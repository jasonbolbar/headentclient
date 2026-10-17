package sk.tvhclient.android.tif

import android.content.Context
import android.database.Cursor
import android.media.tv.TvContract
import android.media.tv.TvInputManager
import android.media.tv.TvInputService
import android.media.tv.TvTrackInfo
import android.net.Uri
import android.util.Log
import android.view.Surface
import org.videolan.libvlc.LibVLC
import org.videolan.libvlc.Media
import org.videolan.libvlc.MediaPlayer
import org.videolan.libvlc.interfaces.IMedia
import org.videolan.libvlc.interfaces.IVLCVout
import sk.tvhclient.shared.Tvh
import sk.tvhclient.shared.stream.StreamUrlBuilder

/**
 * Android TV Input Framework (TIF) service for Tvheadend.
 * Feeds live TV broadcasts directly into Android TV's native "Live Channels" app,
 * utilizing libVLC for video and audio rendering.
 */
class TvhTvInputService : TvInputService() {

    companion object {
        private const val TAG = "TvhTvInputService"
    }

    override fun onCreateSession(inputId: String): Session {
        return TvhTvInputSession(this, inputId)
    }

    /**
     * TIF Session responsible for media playback, Surface binding, and track management.
     */
    inner class TvhTvInputSession(
        private val context: Context,
        private val inputId: String
    ) : Session(context), MediaPlayer.EventListener, IVLCVout.Callback {

        private var libVLC: LibVLC? = null
        private var mediaPlayer: MediaPlayer? = null
        private var currentMedia: Media? = null
        private var surface: Surface? = null
        private var isSurfaceAttached = false

        init {
            val options = ArrayList<String>().apply {
                add("--no-drop-late-frames")
                add("--no-skip-frames")
                add("--http-reconnect")
                add("--network-caching=1500")
                add("--deinterlace=1")
                add("--deinterlace-mode=blend")
                add("--aspect-ratio=16:9")
                add("--aout=android_audiotrack")
                add("--spdif")
                add("--audio-time-stretch")
            }
            libVLC = LibVLC(context, options)
            mediaPlayer = MediaPlayer(libVLC).apply {
                setEventListener(this@TvhTvInputSession)
                vlcVout.addCallback(this@TvhTvInputSession)
                aspectRatio = "16:9" // Force 16:9 widescreen to fill Android TV
                scale = 0f          // Fit to screen window
                setAudioOutput("android_audiotrack")
                try {
                    setAudioDigitalOutputEnabled(true)
                } catch (e: Throwable) {
                    Log.d(TAG, "Digital audio output configuration notice: ${e.message}")
                }
            }
        }

        // =========================================================================
        // Surface Lifecycle Management
        // =========================================================================

        override fun onSetSurface(surface: Surface?): Boolean {
            this.surface = surface
            val player = mediaPlayer ?: return false
            val vout = player.vlcVout

            if (surface != null) {
                if (isSurfaceAttached) {
                    vout.detachViews()
                    isSurfaceAttached = false
                }
                val dm = context.resources.displayMetrics
                vout.setWindowSize(dm.widthPixels, dm.heightPixels)
                vout.setVideoSurface(surface, null)
                vout.attachViews()
                isSurfaceAttached = true
                player.aspectRatio = "16:9"
                player.scale = 0f
                Log.d(TAG, "Video Surface attached to libVLC with window ${dm.widthPixels}x${dm.heightPixels} and 16:9 aspect ratio.")
            } else {
                if (isSurfaceAttached) {
                    vout.detachViews()
                    isSurfaceAttached = false
                    Log.d(TAG, "Video Surface detached from libVLC.")
                }
            }
            return true
        }

        // =========================================================================
        // Channel Tuning
        // =========================================================================

        override fun onTune(channelUri: Uri): Boolean {
            Log.i(TAG, "onTune requested for URI: $channelUri")
            notifyVideoUnavailable(TvInputManager.VIDEO_UNAVAILABLE_REASON_BUFFERING)

            val channelUuid = queryChannelUuid(channelUri)
            if (channelUuid.isNullOrBlank()) {
                Log.e(TAG, "Unable to extract channel UUID from: $channelUri")
                notifyVideoUnavailable(TvInputManager.VIDEO_UNAVAILABLE_REASON_UNKNOWN)
                return false
            }

            val server = Tvh.store.active()
            if (server == null) {
                Log.e(TAG, "No active Tvheadend server found.")
                notifyVideoUnavailable(TvInputManager.VIDEO_UNAVAILABLE_REASON_UNKNOWN)
                return false
            }

            val streamUrl = StreamUrlBuilder.liveUrl(
                server = server,
                channelUuid = channelUuid,
                profile = server.profile.ifBlank { "pass" }
            )

            Log.d(TAG, "Playing live stream URL for channel $channelUuid: $streamUrl")
            startPlayback(streamUrl)
            return true
        }

        private fun queryChannelUuid(channelUri: Uri): String? {
            val projection = arrayOf(TvContract.Channels.COLUMN_INTERNAL_PROVIDER_DATA)
            context.contentResolver.query(channelUri, projection, null, null, null)?.use { cursor ->
                if (cursor.moveToFirst()) {
                    val idx = cursor.getColumnIndex(TvContract.Channels.COLUMN_INTERNAL_PROVIDER_DATA)
                    if (idx >= 0) {
                        return cursor.getString(idx)
                    }
                }
            }
            return null
        }

        private fun startPlayback(streamUrl: String) {
            val player = mediaPlayer ?: return
            val vlc = libVLC ?: return

            try {
                player.stop()
                currentMedia?.release()

                currentMedia = Media(vlc, Uri.parse(streamUrl)).apply {
                    setHWDecoderEnabled(true, false)
                    addOption(":network-caching=1500")
                    addOption(":clock-jitter=0")
                    addOption(":clock-synchro=0")
                    addOption(":aspect-ratio=16:9")
                    addOption(":spdif")
                    addOption(":aout=android_audiotrack")
                }

                player.media = currentMedia
                player.aspectRatio = "16:9"
                player.scale = 0f
                player.play()
            } catch (e: Exception) {
                Log.e(TAG, "Error starting libVLC playback: ${e.message}", e)
                notifyVideoUnavailable(TvInputManager.VIDEO_UNAVAILABLE_REASON_UNKNOWN)
            }
        }

        // =========================================================================
        // Audio, Subtitles & Track Selection
        // =========================================================================

        private fun updateTracks() {
            val player = mediaPlayer ?: return
            val trackInfoList = ArrayList<TvTrackInfo>()
            val currentMedia = player.media

            // Collect tracks from currentMedia
            val mediaAudioTracks = mutableMapOf<Int, IMedia.Track>()
            val mediaSubtitleTracks = mutableMapOf<Int, IMedia.Track>()
            if (currentMedia != null) {
                for (i in 0 until currentMedia.trackCount) {
                    val track = currentMedia.getTrack(i)
                    if (track != null) {
                        if (track.type == IMedia.Track.Type.Audio) {
                            mediaAudioTracks[track.id] = track
                        } else if (track.type == IMedia.Track.Type.Text) {
                            mediaSubtitleTracks[track.id] = track
                        }
                    }
                }
            }

            // 1. Audio Tracks
            val audioTracks = player.audioTracks ?: emptyArray()
            val currentAudioId = player.audioTrack

            for ((idx, track) in audioTracks.withIndex()) {
                if (track.id < 0) continue
                val mediaTrack = mediaAudioTracks[track.id]
                val (lang, desc) = resolveAudioLanguageAndDescription(idx, track.name, mediaTrack)
                val builder = TvTrackInfo.Builder(TvTrackInfo.TYPE_AUDIO, track.id.toString())
                if (!lang.isNullOrBlank() && lang != "und") {
                    builder.setLanguage(lang)
                }
                builder.setDescription(desc)
                trackInfoList.add(builder.build())
            }

            // 2. Subtitle (SPU) Tracks
            val spuTracks = player.spuTracks ?: emptyArray()
            val currentSpuId = player.spuTrack

            for ((idx, track) in spuTracks.withIndex()) {
                if (track.id < 0) continue
                val mediaTrack = mediaSubtitleTracks[track.id]
                val (lang, desc) = resolveSubtitleLanguageAndDescription(idx, track.name, mediaTrack)
                val builder = TvTrackInfo.Builder(TvTrackInfo.TYPE_SUBTITLE, track.id.toString())
                if (!lang.isNullOrBlank() && lang != "und") {
                    builder.setLanguage(lang)
                }
                builder.setDescription(desc)
                trackInfoList.add(builder.build())
            }

            // 3. Video Track
            if (currentMedia != null) {
                for (i in 0 until currentMedia.trackCount) {
                    val track = currentMedia.getTrack(i)
                    if (track?.type == IMedia.Track.Type.Video) {
                        val videoTrack = track as? IMedia.VideoTrack
                        val builder = TvTrackInfo.Builder(TvTrackInfo.TYPE_VIDEO, i.toString())
                        if (videoTrack != null) {
                            builder.setVideoWidth(videoTrack.width)
                            builder.setVideoHeight(videoTrack.height)
                            if (videoTrack.frameRateNum > 0 && videoTrack.frameRateDen > 0) {
                                builder.setVideoFrameRate(videoTrack.frameRateNum.toFloat() / videoTrack.frameRateDen)
                            }
                        }
                        trackInfoList.add(builder.build())
                        notifyTrackSelected(TvTrackInfo.TYPE_VIDEO, i.toString())
                        break
                    }
                }
            }

            notifyTracksChanged(trackInfoList)

            if (currentAudioId >= 0) {
                notifyTrackSelected(TvTrackInfo.TYPE_AUDIO, currentAudioId.toString())
            }
            if (currentSpuId >= 0) {
                notifyTrackSelected(TvTrackInfo.TYPE_SUBTITLE, currentSpuId.toString())
            } else {
                notifyTrackSelected(TvTrackInfo.TYPE_SUBTITLE, null)
            }
        }

        private fun resolveAudioLanguageAndDescription(
            index: Int,
            rawName: String?,
            mediaTrack: IMedia.Track?
        ): Pair<String?, String> {
            val name = rawName?.trim() ?: ""
            val nameLower = name.lowercase()
            val mediaLang = mediaTrack?.language?.trim()?.lowercase()

            val langCode = when {
                !mediaLang.isNullOrBlank() && mediaLang != "und" -> mediaLang
                nameLower.contains("spa") || nameLower.contains("esp") || nameLower.contains("castellano") -> "spa"
                nameLower.contains("qaa") || nameLower.contains("vo") || nameLower.contains("orig") -> "qaa"
                nameLower.contains("eng") || nameLower.contains("ing") -> "eng"
                nameLower.contains("cat") || nameLower.contains("val") -> "cat"
                nameLower.contains("eus") || nameLower.contains("vas") -> "eus"
                nameLower.contains("glg") || nameLower.contains("gal") -> "glg"
                nameLower.contains("fra") || nameLower.contains("fre") -> "fra"
                nameLower.contains("deu") || nameLower.contains("ger") -> "deu"
                nameLower.contains("ita") -> "ita"
                nameLower.contains("por") -> "por"
                index == 0 -> "spa" // Default 1st audio track on European/Spanish TV
                index == 1 -> "qaa" // Default 2nd audio track on European/Spanish TV (V.O.)
                else -> null
            }

            val friendlyName = when (langCode) {
                "spa", "es" -> "Español"
                "qaa" -> "Versión Original (V.O.)"
                "eng", "en" -> "Inglés"
                "cat" -> "Catalán"
                "eus" -> "Euskera"
                "glg" -> "Gallego"
                "fra", "fr" -> "Francés"
                "deu", "de" -> "Alemán"
                "ita", "it" -> "Italiano"
                "por", "pt" -> "Portugués"
                else -> name.ifBlank { "Pista de audio ${index + 1}" }
            }

            val channelsInfo = when ((mediaTrack as? IMedia.AudioTrack)?.channels) {
                6 -> " (5.1)"
                2 -> " (Estéreo)"
                1 -> " (Mono)"
                else -> ""
            }

            val finalDescription = if (friendlyName.contains("5.1") || friendlyName.contains("Estéreo")) {
                friendlyName
            } else {
                "$friendlyName$channelsInfo"
            }

            return Pair(langCode, finalDescription)
        }

        private fun resolveSubtitleLanguageAndDescription(
            index: Int,
            rawName: String?,
            mediaTrack: IMedia.Track?
        ): Pair<String?, String> {
            val name = rawName?.trim() ?: ""
            val nameLower = name.lowercase()
            val mediaLang = mediaTrack?.language?.trim()?.lowercase()

            val langCode = when {
                !mediaLang.isNullOrBlank() && mediaLang != "und" -> mediaLang
                nameLower.contains("spa") || nameLower.contains("esp") || nameLower.contains("castellano") -> "spa"
                nameLower.contains("eng") || nameLower.contains("ing") -> "eng"
                nameLower.contains("cat") || nameLower.contains("val") -> "cat"
                nameLower.contains("eus") || nameLower.contains("vas") -> "eus"
                nameLower.contains("glg") || nameLower.contains("gal") -> "glg"
                index == 0 -> "spa"
                else -> null
            }

            val isHardOfHearing = nameLower.contains("sord") || nameLower.contains("teletexto") || nameLower.contains("888") || nameLower.contains("cc")
            val baseName = when (langCode) {
                "spa", "es" -> "Español"
                "eng", "en" -> "Inglés"
                "cat" -> "Catalán"
                "eus" -> "Euskera"
                "glg" -> "Gallego"
                else -> name.ifBlank { "Subtítulo ${index + 1}" }
            }

            val finalDescription = if (isHardOfHearing) "$baseName (Para personas sordas)" else baseName
            return Pair(langCode, finalDescription)
        }

        override fun onSelectTrack(type: Int, trackId: String?): Boolean {
            val player = mediaPlayer ?: return false
            Log.d(TAG, "onSelectTrack called: type=$type, trackId=$trackId")

            return when (type) {
                TvTrackInfo.TYPE_AUDIO -> {
                    val id = trackId?.toIntOrNull() ?: -1
                    player.setAudioTrack(id)
                    notifyTrackSelected(TvTrackInfo.TYPE_AUDIO, trackId)
                    true
                }
                TvTrackInfo.TYPE_SUBTITLE -> {
                    val id = trackId?.toIntOrNull() ?: -1
                    player.setSpuTrack(id)
                    notifyTrackSelected(TvTrackInfo.TYPE_SUBTITLE, trackId)
                    true
                }
                else -> false
            }
        }

        override fun onSetCaptionEnabled(enabled: Boolean) {
            val player = mediaPlayer ?: return
            Log.d(TAG, "onSetCaptionEnabled: $enabled")
            if (!enabled) {
                player.setSpuTrack(-1)
                notifyTrackSelected(TvTrackInfo.TYPE_SUBTITLE, null)
            } else {
                val spuTracks = player.spuTracks
                val firstValid = spuTracks?.firstOrNull { it.id >= 0 }
                if (firstValid != null) {
                    player.setSpuTrack(firstValid.id)
                    notifyTrackSelected(TvTrackInfo.TYPE_SUBTITLE, firstValid.id.toString())
                }
            }
        }

        override fun onSetStreamVolume(volume: Float) {
            val player = mediaPlayer ?: return
            val vlcVolume = (volume * 100f).toInt().coerceIn(0, 100)
            player.volume = vlcVolume
        }

        // =========================================================================
        // libVLC & Session Lifecycle Callbacks
        // =========================================================================

        override fun onEvent(event: MediaPlayer.Event?) {
            when (event?.type) {
                MediaPlayer.Event.Playing -> {
                    Log.i(TAG, "libVLC MediaPlayer is Playing. Notifying video available.")
                    mediaPlayer?.let { p ->
                        p.aspectRatio = "16:9"
                        p.scale = 0f
                    }
                    notifyVideoAvailable()
                    updateTracks()
                }
                MediaPlayer.Event.Buffering -> {
                    if (event.buffering < 100f) {
                        notifyVideoUnavailable(TvInputManager.VIDEO_UNAVAILABLE_REASON_BUFFERING)
                    } else {
                        notifyVideoAvailable()
                    }
                }
                MediaPlayer.Event.EncounteredError -> {
                    Log.e(TAG, "libVLC encountered playback error.")
                    notifyVideoUnavailable(TvInputManager.VIDEO_UNAVAILABLE_REASON_UNKNOWN)
                }
                MediaPlayer.Event.ESAdded,
                MediaPlayer.Event.ESDeleted,
                MediaPlayer.Event.ESSelected -> {
                    updateTracks()
                }
            }
        }

        override fun onSurfacesCreated(vlcVout: IVLCVout?) {
            Log.d(TAG, "onSurfacesCreated in IVLCVout")
        }

        override fun onSurfacesDestroyed(vlcVout: IVLCVout?) {
            Log.d(TAG, "onSurfacesDestroyed in IVLCVout")
        }

        override fun onRelease() {
            Log.d(TAG, "Releasing TvhTvInputSession resources.")
            try {
                mediaPlayer?.let { player ->
                    player.stop()
                    player.setEventListener(null)
                    player.vlcVout.removeCallback(this)
                    if (isSurfaceAttached) {
                        player.vlcVout.detachViews()
                        isSurfaceAttached = false
                    }
                    player.release()
                }
                mediaPlayer = null
                currentMedia?.release()
                currentMedia = null
                libVLC?.release()
                libVLC = null
            } catch (e: Exception) {
                Log.e(TAG, "Error releasing session: ${e.message}", e)
            }
        }
    }
}
