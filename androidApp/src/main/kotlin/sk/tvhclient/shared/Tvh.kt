package sk.tvhclient.shared

import android.content.Context
import android.content.SharedPreferences
import sk.tvhclient.shared.model.TvhServer

class ServerStore(private val prefs: SharedPreferences) {

    fun active(): TvhServer? {
        val host = prefs.getString("server_host", null) ?: return null
        return TvhServer(
            id = prefs.getString("server_id", "default") ?: "default",
            name = prefs.getString("server_name", "Tvheadend") ?: "Tvheadend",
            host = host,
            port = prefs.getInt("server_port", 9981),
            htspPort = prefs.getInt("server_htsp_port", 9982),
            user = prefs.getString("server_user", "") ?: "",
            pass = prefs.getString("server_pass", "") ?: "",
            profile = prefs.getString("server_profile", "pass") ?: "pass",
            useSoftwareDecoding = prefs.getBoolean("server_sw_decoding", true)
        )
    }

    fun saveServer(server: TvhServer) {
        prefs.edit()
            .putString("server_id", server.id)
            .putString("server_name", server.name)
            .putString("server_host", server.host)
            .putInt("server_port", server.port)
            .putInt("server_htsp_port", server.htspPort)
            .putString("server_user", server.user)
            .putString("server_pass", server.pass)
            .putString("server_profile", server.profile)
            .putBoolean("server_sw_decoding", server.useSoftwareDecoding)
            .apply()
    }
}

object Tvh {
    private var _store: ServerStore? = null

    val store: ServerStore
        get() = _store ?: throw IllegalStateException("Tvh has not been initialized. Call Tvh.init(context) first.")

    fun init(context: Context) {
        if (_store == null) {
            val prefs = context.applicationContext.getSharedPreferences("tvh_settings", Context.MODE_PRIVATE)
            _store = ServerStore(prefs)
        }
    }
}
