package sk.tvhclient.android.tif

import android.content.ContentProviderOperation
import android.content.ContentUris
import android.content.ContentValues
import android.content.Context
import android.database.Cursor
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.media.tv.TvContract
import android.net.Uri
import android.util.Log
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import sk.tvhclient.shared.Tvh
import sk.tvhclient.shared.api.TvhApi
import sk.tvhclient.shared.model.Channel
import sk.tvhclient.shared.model.EpgEvent
import sk.tvhclient.shared.model.TvhServer
import sk.tvhclient.shared.stream.StreamUrlBuilder
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.TimeUnit

/**
 * WorkManager worker responsible for synchronizing Tvheadend channels and EPG programs
 * into Android TV's system database (TvContract).
 */
class TvhSyncWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    companion object {
        private const val TAG = "TvhSyncWorker"
        private const val PERIODIC_WORK_TAG = "tvh_tif_periodic_sync"
        private const val BATCH_OPERATION_LIMIT = 100

        /**
         * Schedules periodic EPG synchronization every 3 hours while network is connected.
         */
        fun schedulePeriodicSync(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val request = PeriodicWorkRequestBuilder<TvhSyncWorker>(3, TimeUnit.HOURS)
                .setConstraints(constraints)
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                PERIODIC_WORK_TAG,
                ExistingPeriodicWorkPolicy.KEEP,
                request
            )
        }
    }

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val server = Tvh.store.active()
        if (server == null) {
            Log.w(TAG, "No active Tvheadend server configured. Aborting TIF sync.")
            return@withContext Result.failure()
        }

        val inputId = TvContractUtils.buildInputId(applicationContext)
        val api = TvhApi(server)

        try {
            Log.i(TAG, "Starting TIF sync for server: ${server.name} ($inputId)")

            // 1. Fetch live channels from Tvheadend
            val channels = api.channels()
            if (channels.isEmpty()) {
                Log.w(TAG, "No channels received from Tvheadend server.")
                return@withContext Result.success()
            }

            // 2. Synchronize channels into TvContract.Channels
            val channelIdMap = syncChannels(inputId, server, channels)

            // 3. Fetch EPG window (next 24 hours) and sync into TvContract.Programs
            val nowSec = System.currentTimeMillis() / 1000L
            val untilSec = nowSec + (24 * 3600L)
            val epgEvents = api.epgWindow(untilSec = untilSec)
            syncPrograms(channelIdMap, epgEvents)

            Log.i(TAG, "TIF sync finished successfully. Synced ${channelIdMap.size} channels.")
            Result.success()
        } catch (e: Exception) {
            Log.e(TAG, "Error synchronizing with Android TV Live Channels: ${e.message}", e)
            Result.retry()
        } finally {
            api.close()
        }
    }

    /**
     * Inserts or updates channels in TvContract.Channels, returning a map of
     * channel UUID to Android TV internal channel database ID.
     */
    private fun syncChannels(
        inputId: String,
        server: TvhServer,
        channels: List<Channel>
    ): Map<String, Long> {
        val cr = applicationContext.contentResolver
        val channelIdMap = mutableMapOf<String, Long>()

        // Query existing channels for this inputId
        val existingChannels = mutableMapOf<String, Long>()
        val projection = arrayOf(TvContract.Channels._ID, TvContract.Channels.COLUMN_INTERNAL_PROVIDER_DATA)
        val uri = TvContract.buildChannelsUriForInput(inputId)

        cr.query(uri, projection, null, null, null)?.use { cursor ->
            val idCol = cursor.getColumnIndexOrThrow(TvContract.Channels._ID)
            val uuidCol = cursor.getColumnIndexOrThrow(TvContract.Channels.COLUMN_INTERNAL_PROVIDER_DATA)
            while (cursor.moveToNext()) {
                val dbId = cursor.getLong(idCol)
                val uuid = cursor.getString(uuidCol)
                if (!uuid.isNullOrBlank()) {
                    existingChannels[uuid] = dbId
                }
            }
        }

        for (channel in channels) {
            val isRadio = channel.isRadioByService == true
            val values = ContentValues().apply {
                put(TvContract.Channels.COLUMN_INPUT_ID, inputId)
                put(TvContract.Channels.COLUMN_TYPE, TvContract.Channels.TYPE_OTHER)
                put(
                    TvContract.Channels.COLUMN_SERVICE_TYPE,
                    if (isRadio) TvContract.Channels.SERVICE_TYPE_AUDIO else TvContract.Channels.SERVICE_TYPE_AUDIO_VIDEO
                )
                put(TvContract.Channels.COLUMN_DISPLAY_NUMBER, channel.numberText.ifBlank { channel.number?.toString() ?: "" })
                put(TvContract.Channels.COLUMN_DISPLAY_NAME, channel.name)
                put(TvContract.Channels.COLUMN_INTERNAL_PROVIDER_DATA, channel.uuid)
                put(TvContract.Channels.COLUMN_ORIGINAL_NETWORK_ID, 0)
                put(TvContract.Channels.COLUMN_TRANSPORT_STREAM_ID, 0)
                put(TvContract.Channels.COLUMN_SERVICE_ID, channel.number ?: 0)
                put(TvContract.Channels.COLUMN_APP_LINK_INTENT_URI, "headentclient://channel/${channel.uuid}")
            }

            val existingId = existingChannels[channel.uuid]
            val rowId: Long = if (existingId != null) {
                val channelUri = TvContract.buildChannelUri(existingId)
                cr.update(channelUri, values, null, null)
                existingId
            } else {
                val insertedUri = cr.insert(TvContract.Channels.CONTENT_URI, values)
                insertedUri?.let { ContentUris.parseId(it) } ?: -1L
            }

            if (rowId > 0) {
                channelIdMap[channel.uuid] = rowId
                // Save channel logo if available
                saveChannelLogo(rowId, server, channel.iconPublicUrl)
            }
        }

        return channelIdMap
    }

    /**
     * Downloads and writes channel logo (picon) to TvContract logo URI.
     */
    private fun saveChannelLogo(dbChannelId: Long, server: TvhServer, iconPublicUrl: String?) {
        val piconUrl = StreamUrlBuilder.piconUrl(server, iconPublicUrl) ?: return
        try {
            val logoUri = TvContract.buildChannelLogoUri(dbChannelId)
            val url = URL(piconUrl)
            val connection = (url.openConnection() as HttpURLConnection).apply {
                connectTimeout = 5000
                readTimeout = 5000
            }
            connection.inputStream.use { inputStream ->
                val bitmap = BitmapFactory.decodeStream(inputStream) ?: return
                applicationContext.contentResolver.openOutputStream(logoUri)?.use { outputStream ->
                    bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
                }
            }
        } catch (e: Exception) {
            Log.d(TAG, "Could not sync logo for channel $dbChannelId: ${e.message}")
        }
    }

    /**
     * Synchronizes EPG events into TvContract.Programs.
     * Converts UNIX timestamps from seconds to milliseconds (* 1000L).
     */
    private fun syncPrograms(
        channelIdMap: Map<String, Long>,
        events: List<EpgEvent>
    ) {
        val cr = applicationContext.contentResolver
        val nowMillis = System.currentTimeMillis()

        // Group EPG events by channel UUID
        val eventsByChannel = events.filter { it.channelUuid != null }.groupBy { it.channelUuid!! }

        for ((channelUuid, channelEvents) in eventsByChannel) {
            val dbChannelId = channelIdMap[channelUuid] ?: continue

            // Remove expired programs for this channel
            val channelProgramsUri = TvContract.buildProgramsUriForChannel(dbChannelId)
            cr.delete(
                channelProgramsUri,
                "${TvContract.Programs.COLUMN_END_TIME_UTC_MILLIS} < ?",
                arrayOf(nowMillis.toString())
            )

            // Batch insert programs in chunks
            val operations = ArrayList<ContentProviderOperation>()

            for (event in channelEvents) {
                val startMillis = event.start * 1000L
                val endMillis = event.stop * 1000L

                // Skip events that already ended
                if (endMillis <= nowMillis) continue

                val values = ContentValues().apply {
                    put(TvContract.Programs.COLUMN_CHANNEL_ID, dbChannelId)
                    put(TvContract.Programs.COLUMN_TITLE, event.title)
                    put(TvContract.Programs.COLUMN_SHORT_DESCRIPTION, event.summary.ifBlank { event.subtitle })
                    put(TvContract.Programs.COLUMN_LONG_DESCRIPTION, event.bestDescription)
                    put(TvContract.Programs.COLUMN_START_TIME_UTC_MILLIS, startMillis)
                    put(TvContract.Programs.COLUMN_END_TIME_UTC_MILLIS, endMillis)
                    put(TvContract.Programs.COLUMN_INTERNAL_PROVIDER_DATA, event.eventId?.toString() ?: "")

                    event.episodeOnscreen.takeIf { it.isNotBlank() }?.let {
                        put(TvContract.Programs.COLUMN_EPISODE_DISPLAY_NUMBER, it)
                    }

                    event.genre.firstOrNull()?.let { genreCode ->
                        TvContractUtils.mapDvbGenreToCanonical(genreCode)?.let { canonical ->
                            put(TvContract.Programs.COLUMN_CANONICAL_GENRE, canonical)
                        }
                    }
                }

                operations.add(
                    ContentProviderOperation.newInsert(TvContract.Programs.CONTENT_URI)
                        .withValues(values)
                        .build()
                )

                if (operations.size >= BATCH_OPERATION_LIMIT) {
                    try {
                        cr.applyBatch(TvContract.AUTHORITY, operations)
                    } catch (e: Exception) {
                        Log.e(TAG, "Error applying batch program operations: ${e.message}", e)
                    }
                    operations.clear()
                }
            }

            if (operations.isNotEmpty()) {
                try {
                    cr.applyBatch(TvContract.AUTHORITY, operations)
                } catch (e: Exception) {
                    Log.e(TAG, "Error applying batch program operations: ${e.message}", e)
                }
            }
        }
    }
}
