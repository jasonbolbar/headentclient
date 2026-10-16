package sk.tvhclient.shared.api

import android.util.Base64
import org.json.JSONObject
import sk.tvhclient.shared.model.Channel
import sk.tvhclient.shared.model.EpgEvent
import sk.tvhclient.shared.model.TvhServer
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL

class TvhApi(private val server: TvhServer) {

    private fun openConnection(endpoint: String): HttpURLConnection {
        val fullUrl = "http://${server.host}:${server.port}$endpoint"
        val conn = URL(fullUrl).openConnection() as HttpURLConnection
        conn.connectTimeout = 8000
        conn.readTimeout = 12000
        if (server.user.isNotBlank()) {
            val creds = "${server.user}:${server.pass}"
            val encoded = Base64.encodeToString(creds.toByteArray(Charsets.UTF_8), Base64.NO_WRAP)
            conn.setRequestProperty("Authorization", "Basic $encoded")
        }
        return conn
    }

    fun channels(): List<Channel> {
        val conn = openConnection("/api/channel/grid?start=0&limit=9999")
        try {
            if (conn.responseCode != 200) return emptyList()
            val text = conn.inputStream.bufferedReader().use(BufferedReader::readText)
            val json = JSONObject(text)
            val entries = json.optJSONArray("entries") ?: return emptyList()
            val list = mutableListOf<Channel>()
            for (i in 0 until entries.length()) {
                val item = entries.getJSONObject(i)
                val uuid = item.optString("uuid")
                val name = item.optString("name", "Channel $i")
                val number = if (item.has("number")) item.optInt("number") else null
                val numberMinor = if (item.has("number_minor")) item.optInt("number_minor") else null
                val icon = item.optString("icon_public_url", null)
                val enabled = item.optBoolean("enabled", true)
                val services = mutableListOf<String>()
                val sArray = item.optJSONArray("services")
                if (sArray != null) {
                    for (s in 0 until sArray.length()) services.add(sArray.getString(s))
                }
                val isRadio = item.optBoolean("is_radio", false)
                list.add(
                    Channel(
                        uuid = uuid,
                        name = name,
                        number = number,
                        numberMinor = numberMinor,
                        iconPublicUrl = icon,
                        tags = emptyList(),
                        services = services,
                        enabled = enabled,
                        isRadioByServices = isRadio
                    )
                )
            }
            return list
        } catch (e: Exception) {
            e.printStackTrace()
            return emptyList()
        } finally {
            conn.disconnect()
        }
    }

    fun epgWindow(untilSec: Long): List<EpgEvent> {
        val nowSec = System.currentTimeMillis() / 1000L
        val conn = openConnection("/api/epg/events/grid?start=0&limit=9999&filter=[{\"name\":\"stop\",\"op\":\"ge\",\"value\":$nowSec},{\"name\":\"start\",\"op\":\"le\",\"value\":$untilSec}]")
        try {
            if (conn.responseCode != 200) return emptyList()
            val text = conn.inputStream.bufferedReader().use(BufferedReader::readText)
            val json = JSONObject(text)
            val entries = json.optJSONArray("entries") ?: return emptyList()
            val list = mutableListOf<EpgEvent>()
            for (i in 0 until entries.length()) {
                val item = entries.getJSONObject(i)
                val eventId = item.optLong("eventId", i.toLong())
                val channelUuid = item.optString("channelUuid")
                val title = item.optString("title", "")
                val subtitle = item.optString("subtitle", "")
                val summary = item.optString("summary", "")
                val description = item.optString("description", "")
                val start = item.optLong("start", 0L)
                val stop = item.optLong("stop", 0L)
                val episodeOnscreen = item.optString("episodeOnscreen", "")

                val genreList = mutableListOf<Int>()
                if (item.has("genre")) {
                    val gArray = item.optJSONArray("genre")
                    if (gArray != null) {
                        for (g in 0 until gArray.length()) genreList.add(gArray.getInt(g))
                    } else {
                        genreList.add(item.optInt("genre"))
                    }
                }

                list.add(
                    EpgEvent(
                        eventId = eventId,
                        channelUuid = channelUuid,
                        title = title,
                        subtitle = subtitle,
                        summary = summary,
                        description = description,
                        start = start,
                        stop = stop,
                        genre = genreList,
                        episodeOnscreen = episodeOnscreen
                    )
                )
            }
            return list
        } catch (e: Exception) {
            e.printStackTrace()
            return emptyList()
        } finally {
            conn.disconnect()
        }
    }

    fun close() {
        // cleanup if needed
    }
}
