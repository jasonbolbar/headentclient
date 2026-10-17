package sk.tvhclient.android.tif

import android.content.ContentProviderOperation
import android.content.ContentUris
import android.content.ContentValues
import android.content.Context
import android.media.tv.TvContract
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import sk.tvhclient.shared.api.TvhApi
import sk.tvhclient.shared.model.Channel
import sk.tvhclient.shared.model.EpgEvent
import sk.tvhclient.shared.model.TvhServer

object TvhSyncManager {
    private const val TAG = "TvhSyncManager"
    private const val BATCH_OPERATION_LIMIT = 100

    suspend fun syncNow(
        context: Context,
        server: TvhServer,
        onProgress: (String) -> Unit = {}
    ): Pair<Boolean, String> = withContext(Dispatchers.IO) {
        val inputId = TvContractUtils.buildInputId(context)
        val api = TvhApi(server)

        try {
            onProgress("1/4. Conectando y obteniendo canales...")
            val channels = api.channels()
            if (channels.isEmpty()) {
                Log.w(TAG, "No se recibieron canales de Tvheadend.")
                return@withContext Pair(
                    false,
                    "No se encontraron canales en el servidor. Verifica que tengas canales mapeados en la pestaña 'Configuration > Channel / EPG' de Tvheadend."
                )
            }

            onProgress("2/4. Guardando ${channels.size} canales en Android TV...")
            val channelIdMap = syncChannels(context, inputId, channels)

            onProgress("3/4. Descargando guía EPG (próximas 24h)...")
            val nowSec = System.currentTimeMillis() / 1000L
            val untilSec = nowSec + (24 * 3600L)
            val epgEvents = try {
                api.epgWindow(untilSec = untilSec)
            } catch (e: Exception) {
                Log.w(TAG, "No se pudo obtener la guía EPG: ${e.message}")
                emptyList()
            }

            if (epgEvents.isNotEmpty()) {
                onProgress("4/4. Guardando ${epgEvents.size} programas en la guía...")
                syncPrograms(context, channelIdMap, epgEvents)
            }

            val msg = "¡Sincronización completada! ${channelIdMap.size} canales y ${epgEvents.size} programas EPG."
            Log.i(TAG, msg)
            onProgress(msg)
            Pair(true, msg)
        } catch (e: Exception) {
            val err = "Fallo en la sincronización: ${e.localizedMessage ?: e.message}"
            Log.e(TAG, err, e)
            Pair(false, err)
        } finally {
            api.close()
        }
    }

    private fun syncChannels(
        context: Context,
        inputId: String,
        channels: List<Channel>
    ): Map<String, Long> {
        val cr = context.contentResolver
        val channelIdMap = mutableMapOf<String, Long>()

        // 1. Limpieza total de canales anteriores para este inputId
        // Esto elimina cualquier canal duplicado previo y garantiza una lista limpia
        try {
            val channelsUri = TvContract.buildChannelsUriForInput(inputId)
            val deleted = cr.delete(channelsUri, null, null)
            Log.i(TAG, "Canales anteriores limpiados: $deleted")
        } catch (e: Exception) {
            try {
                val deleted = cr.delete(
                    TvContract.Channels.CONTENT_URI,
                    "${TvContract.Channels.COLUMN_INPUT_ID} = ?",
                    arrayOf(inputId)
                )
                Log.i(TAG, "Canales anteriores limpiados (fallback): $deleted")
            } catch (e2: Exception) {
                Log.w(TAG, "Aviso limpiando canales anteriores: ${e2.message}")
            }
        }

        // 2. Insertar canales limpios en TvContract
        for (channel in channels) {
            val isRadio = channel.isRadioByService
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

            try {
                val insertedUri = cr.insert(TvContract.Channels.CONTENT_URI, values)
                val rowId = insertedUri?.let { ContentUris.parseId(it) } ?: -1L
                if (rowId > 0) {
                    channelIdMap[channel.uuid] = rowId
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error guardando canal ${channel.name}: ${e.message}")
            }
        }

        return channelIdMap
    }

    private fun syncPrograms(
        context: Context,
        channelIdMap: Map<String, Long>,
        events: List<EpgEvent>
    ) {
        val cr = context.contentResolver
        val nowMillis = System.currentTimeMillis()

        val eventsByChannel = events.filter { it.channelUuid.isNotBlank() }.groupBy { it.channelUuid }

        for ((channelUuid, channelEvents) in eventsByChannel) {
            val dbChannelId = channelIdMap[channelUuid] ?: continue

            try {
                val channelProgramsUri = TvContract.buildProgramsUriForChannel(dbChannelId)
                cr.delete(
                    channelProgramsUri,
                    "${TvContract.Programs.COLUMN_END_TIME_UTC_MILLIS} < ?",
                    arrayOf(nowMillis.toString())
                )
            } catch (e: Exception) {
                Log.w(TAG, "Error limpiando EPG antiguo: ${e.message}")
            }

            val operations = ArrayList<ContentProviderOperation>()

            for (event in channelEvents) {
                val startMillis = event.start * 1000L
                val endMillis = event.stop * 1000L

                if (endMillis <= nowMillis) continue

                val values = ContentValues().apply {
                    put(TvContract.Programs.COLUMN_CHANNEL_ID, dbChannelId)
                    put(TvContract.Programs.COLUMN_TITLE, event.title)
                    put(TvContract.Programs.COLUMN_SHORT_DESCRIPTION, event.summary.ifBlank { event.subtitle })
                    put(TvContract.Programs.COLUMN_LONG_DESCRIPTION, event.bestDescription)
                    put(TvContract.Programs.COLUMN_START_TIME_UTC_MILLIS, startMillis)
                    put(TvContract.Programs.COLUMN_END_TIME_UTC_MILLIS, endMillis)
                    put(TvContract.Programs.COLUMN_INTERNAL_PROVIDER_DATA, event.eventId.toString())

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
                        Log.e(TAG, "Error aplicando lote EPG: ${e.message}")
                    }
                    operations.clear()
                }
            }

            if (operations.isNotEmpty()) {
                try {
                    cr.applyBatch(TvContract.AUTHORITY, operations)
                } catch (e: Exception) {
                    Log.e(TAG, "Error aplicando lote final EPG: ${e.message}")
                }
            }
        }
    }
}
