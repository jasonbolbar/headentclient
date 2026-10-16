package sk.tvhclient.android

import android.app.Application
import sk.tvhclient.android.tif.TvhSyncWorker
import sk.tvhclient.shared.Tvh

class TvhApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        Tvh.init(this)
        // Automatically schedule periodic sync if server is configured
        if (Tvh.store.active() != null) {
            TvhSyncWorker.schedulePeriodicSync(this)
        }
    }
}
