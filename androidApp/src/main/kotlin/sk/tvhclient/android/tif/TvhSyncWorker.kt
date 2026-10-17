package sk.tvhclient.android.tif

import android.content.Context
import android.util.Log
import androidx.work.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import sk.tvhclient.shared.Tvh
import java.util.concurrent.TimeUnit

/**
 * WorkManager worker responsible for periodic synchronization of Tvheadend channels and EPG
 * into Android TV's system database (TvContract).
 */
class TvhSyncWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    companion object {
        private const val TAG = "TvhSyncWorker"
        private const val PERIODIC_WORK_TAG = "tvh_tif_periodic_sync"

        /**
         * Schedules periodic EPG synchronization every 3 hours while network is connected.
         */
        fun schedulePeriodicSync(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val request = PeriodicWorkRequestBuilder<TvhSyncWorker>(3, TimeUnit.HOURS)
                .setConstraints(constraints)
                .addTag(PERIODIC_WORK_TAG)
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

        val (success, message) = TvhSyncManager.syncNow(applicationContext, server)
        if (success) {
            Log.i(TAG, "Periodic sync completed successfully: $message")
            Result.success()
        } else {
            Log.w(TAG, "Periodic sync ended with notice: $message")
            Result.failure()
        }
    }
}
