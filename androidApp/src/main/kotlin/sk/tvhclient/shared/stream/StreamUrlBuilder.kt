package sk.tvhclient.shared.stream

import sk.tvhclient.shared.model.TvhServer
import java.net.URLEncoder

object StreamUrlBuilder {

    fun liveUrl(server: TvhServer, channelUuid: String, profile: String = "pass"): String {
        val scheme = "http"
        val auth = if (server.user.isNotBlank()) {
            val u = URLEncoder.encode(server.user, "UTF-8")
            val p = URLEncoder.encode(server.pass, "UTF-8")
            "$u:$p@"
        } else {
            ""
        }
        val prof = if (profile.isNotBlank()) "?profile=${URLEncoder.encode(profile, "UTF-8")}" else ""
        return "$scheme://$auth${server.host}:${server.port}/stream/channel/$channelUuid$prof"
    }

    fun piconUrl(server: TvhServer, iconPath: String?): String? {
        if (iconPath.isNullOrBlank()) return null
        if (iconPath.startsWith("http://") || iconPath.startsWith("https://")) {
            return iconPath
        }
        val cleanPath = if (iconPath.startsWith("/")) iconPath else "/$iconPath"
        val auth = if (server.user.isNotBlank()) {
            val u = URLEncoder.encode(server.user, "UTF-8")
            val p = URLEncoder.encode(server.pass, "UTF-8")
            "$u:$p@"
        } else {
            ""
        }
        return "http://$auth${server.host}:${server.port}$cleanPath"
    }
}
