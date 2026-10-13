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
            }
            libVLC = LibVLC(context, options)
            mediaPlayer = MediaPlayer(libVLC).apply {
                setEventListener(this@TvhTvInputSession)
                vlcVout.addCallback(this@TvhTvInputSession)
                aspectRatio = null // Auto / fit
                scale = 0f         // Fit to screen
            }
        }

        // =========================================================================
        // Surface Lifecycle Management
        // =========================================================================

        override fun onSetDisplaySurface(surface: Surface?) {
            this.surface = surface
            val player = mediaPlayer ?: return
            val vout = player.vlcVout

            if (surface != null) {
                if (isSurfaceAttached) {
                    vout.detachViews()
                    isSurfaceAttached = false
                }
                vout.setVideoSurface(surface, null)
                vout.attachViews()
                isSurfaceAttached = true
                Log.d(TAG, "Video Surface attached to libVLC.")
            } else {
                if (isSurfaceAttached) {
                    vout.detachViews()
                    isSurfaceAttached = false
                    Log.d(TAG, "Video Surface detached from libVLC.")
                }
            }
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

            Log.d(TAG, "Playing live stream URL for channel $channelUuid")
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
                }

                player.media = currentMedia
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

            // 1. Audio Tracks
            val audioTracks = player.audioTracks ?: emptyArray()
            val currentAudioId = player.audioTrack

            for (track in audioTracks) {
                if (track.id < 0) continue
                val builder = TvTrackInfo.Builder(TvTrackInfo.TYPE_AUDIO, track.id.toString())
                    .setLanguage(track.language ?: "und")
                    .setDescription(track.name ?: "Audio ${track.id}")
                trackInfoList.add(builder.build())
            }

            // 2. Subtitle (SPU) Tracks
            val spuTracks = player.spuTracks ?: emptyArray()
            val currentSpuId = player.spuTrack

            for (track in spuTracks) {
                if (track.id < 0) continue
                val builder = TvTrackInfo.Builder(TvTrackInfo.TYPE_SUBTITLE, track.id.toString())
                    .setLanguage(track.language ?: "und")
                    .setDescription(track.name ?: "Subtitles ${track.id}")
                trackInfoList.add(builder.build())
            }

            // 3. Video Track
            val currentMedia = player.media
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
