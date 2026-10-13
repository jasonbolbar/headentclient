import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTvheadend } from '../../context/TvheadendContext';
import { Channel, DvrEntry } from '../../types';
import { StreamUrlBuilder } from '../../services/streamUrl';
import { AppStorage } from '../../services/storage';
import { PiconImage } from '../common/PiconImage';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Tv,
  Disc3,
  CalendarDays,
  FileText,
  AudioLines,
  MessageSquare,
  Clock,
  Radio,
  X
} from 'lucide-react';

interface PlayerScreenProps {
  channel?: Channel | null;
  dvr?: DvrEntry | null;
  onClose: () => void;
  onOpenEpg?: () => void;
}

export const PlayerScreen: React.FC<PlayerScreenProps> = ({ channel, dvr, onClose, onOpenEpg }) => {
  const { activeServer, tvChannels, epgMap, playChannel, playDvr, dvrEntries } = useTvheadend();

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Overlay visibility timer
  const [showOverlay, setShowOverlay] = useState(true);
  const overlayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Audio & Subtitle track menus
  const [showTrackMenu, setShowTrackMenu] = useState(false);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState('eng');
  const [selectedSubtitleTrack, setSelectedSubtitleTrack] = useState('off');

  // Teletext overlay
  const [showTeletext, setShowTeletext] = useState(false);
  const [teletextPage, setTeletextPage] = useState('100');

  // Numeric channel entry buffer
  const [numBuffer, setNumBuffer] = useState('');
  const numBufferTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Stream URL
  const streamUrl = useMemo(() => {
    if (channel) {
      return StreamUrlBuilder.getLiveUrl(activeServer, channel.uuid, activeServer.profile, channel.name);
    }
    if (dvr) {
      return StreamUrlBuilder.getDvrUrl(activeServer, dvr.dvrId || dvr.uuid);
    }
    return '';
  }, [channel, dvr, activeServer]);

  // Current channel EPG
  const nowSec = Math.floor(Date.now() / 1000);
  const events = channel ? (epgMap[channel.uuid] || []) : [];
  const nowEv = events.find(e => e.start <= nowSec && nowSec < e.stop) || events[0];
  const nextEv = events.find(e => e.start >= (nowEv ? nowEv.stop : nowSec));

  // Resume progress restoration for DVR
  useEffect(() => {
    if (dvr) {
      const saved = AppStorage.getResumeProgress()[dvr.uuid];
      if (saved && videoRef.current) {
        videoRef.current.currentTime = saved;
      }
    }
  }, [dvr]);

  // Update resume progress on unmount / timeupdate
  useEffect(() => {
    return () => {
      if (dvr && videoRef.current) {
        AppStorage.setResumeProgress(dvr.uuid, videoRef.current.currentTime);
      }
    };
  }, [dvr]);

  // Reset overlay timer
  const triggerOverlay = () => {
    setShowOverlay(true);
    if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
    overlayTimeoutRef.current = setTimeout(() => {
      setShowOverlay(false);
      setShowTrackMenu(false);
    }, 4500);
  };

  useEffect(() => {
    triggerOverlay();
    return () => {
      if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
    };
  }, [channel, dvr]);

  // Channel switching
  const currentIndex = tvChannels.findIndex(c => c.uuid === channel?.uuid);

  const prevChannel = () => {
    if (tvChannels.length === 0) return;
    const prevIdx = (currentIndex - 1 + tvChannels.length) % tvChannels.length;
    playChannel(tvChannels[prevIdx]);
  };

  const nextChannel = () => {
    if (tvChannels.length === 0) return;
    const nextIdx = (currentIndex + 1) % tvChannels.length;
    playChannel(tvChannels[nextIdx]);
  };

  // Keyboard navigation & remote control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      triggerOverlay();

      // Number keys 0-9 for channel jumping
      if (/^[0-9]$/.test(e.key)) {
        const next = numBuffer + e.key;
        setNumBuffer(next);
        if (numBufferTimeoutRef.current) clearTimeout(numBufferTimeoutRef.current);
        numBufferTimeoutRef.current = setTimeout(() => {
          const targetNum = parseInt(next);
          const found = tvChannels.find(c => c.number === targetNum);
          if (found) playChannel(found);
          setNumBuffer('');
        }, 1200);
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
          nextChannel();
          break;
        case 'ArrowDown':
          prevChannel();
          break;
        case 'ArrowLeft':
          if (videoRef.current) videoRef.current.currentTime -= 10;
          break;
        case 'ArrowRight':
          if (videoRef.current) videoRef.current.currentTime += 10;
          break;
        case ' ':
        case 'k':
          togglePlay();
          break;
        case 'm':
          toggleMute();
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'Escape':
        case 'Back':
          onClose();
          break;
        case 't':
          setShowTeletext(prev => !prev);
          break;
        case 'g':
          if (onOpenEpg) onOpenEpg();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, tvChannels, numBuffer, onClose, onOpenEpg]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sec = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = sec;
      setCurrentTime(sec);
    }
  };

  const formatHm = (sec?: number) => {
    if (!sec) return '';
    return new Date(sec * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatSecs = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={triggerOverlay}
      onClick={triggerOverlay}
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center select-none overflow-hidden"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={streamUrl}
        autoPlay
        playsInline
        onTimeUpdate={() => {
          if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
            setDuration(videoRef.current.duration || 0);
          }
        }}
        onEnded={() => setIsPlaying(false)}
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlay}
      />

      {/* Numeric Buffer Pill (appears when entering channel numbers) */}
      {numBuffer && (
        <div className="absolute top-8 right-8 z-50 bg-teal-500 text-slate-950 font-black font-mono text-3xl px-6 py-3 rounded-2xl shadow-2xl animate-pulse">
          CH {numBuffer}
        </div>
      )}

      {/* Teletext Overlay Simulator */}
      {showTeletext && (
        <div className="absolute inset-8 z-40 bg-black border-4 border-yellow-400 p-6 flex flex-col justify-between font-mono text-sm max-w-3xl mx-auto shadow-2xl rounded-lg">
          <div>
            <div className="flex justify-between border-b-2 border-yellow-400 pb-2 text-yellow-300 font-bold">
              <span>HEADENT TELETEXT P{teletextPage}</span>
              <span>LIVE BROADCAST DATA</span>
              <button onClick={() => setShowTeletext(false)} className="text-white hover:text-red-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="pt-6 space-y-4 text-emerald-400">
              <p className="text-white font-bold text-lg">P100 MAIN INDEX</p>
              <p>100 ... GENERAL HEADLINES & TV GUIDE</p>
              <p>200 ... INTERNATIONAL BREAKING NEWS</p>
              <p>300 ... EUROPEAN SPORTS & LEAGUES</p>
              <p>888 ... SUBTITLES ON-AIR (TELETEXT DVB)</p>
              <div className="p-4 bg-slate-900 border border-slate-700 text-slate-200 mt-6 rounded">
                Programme: {nowEv?.title || 'Live Stream'}
                <br />
                Channel: {channel?.name || dvr?.dispTitle}
              </div>
            </div>
          </div>

          {/* Fastext 4 Colored Quick-Links */}
          <div className="grid grid-cols-4 gap-2 pt-4 border-t-2 border-yellow-400 text-center font-bold text-xs">
            <button onClick={() => setTeletextPage('100')} className="bg-red-600 text-white py-1.5 rounded">
              100 Index
            </button>
            <button onClick={() => setTeletextPage('200')} className="bg-emerald-600 text-white py-1.5 rounded">
              200 News
            </button>
            <button onClick={() => setTeletextPage('300')} className="bg-yellow-500 text-slate-950 py-1.5 rounded">
              300 Sport
            </button>
            <button onClick={() => setTeletextPage('888')} className="bg-blue-600 text-white py-1.5 rounded">
              888 Subs
            </button>
          </div>
        </div>
      )}

      {/* Zap Bar & Controls Overlay */}
      <div
        className={`absolute inset-0 pointer-events-none flex flex-col justify-between p-6 transition-opacity duration-300 ${
          showOverlay ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pointer-events-auto bg-gradient-to-b from-black/80 via-black/40 to-transparent p-4 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 transition"
              title="Return (Esc)"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {channel && (
              <div className="flex items-center gap-3">
                <PiconImage
                  src={channel.iconPublicUrl}
                  alt={channel.name}
                  fallbackText={channel.name}
                  className="w-10 h-10 border-teal-500/40"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-teal-400 bg-teal-950 px-2 py-0.5 rounded border border-teal-500/30">
                      CH {channel.number || '—'}
                    </span>
                    <h3 className="text-base font-black text-white">{channel.name}</h3>
                  </div>
                </div>
              </div>
            )}

            {dvr && (
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Disc3 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-400">Recording Playback</span>
                  <h3 className="text-sm font-bold text-white">{dvr.dispTitle}</h3>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Teletext button */}
            <button
              onClick={() => setShowTeletext(!showTeletext)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-xs font-bold text-yellow-300 border border-yellow-500/30 transition"
              title="Toggle Teletext (T)"
            >
              <FileText className="w-3.5 h-3.5 text-yellow-400" />
              <span>TXT</span>
            </button>

            {/* Audio & Subtitles Menu Trigger */}
            <button
              onClick={() => setShowTrackMenu(!showTrackMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700 transition"
              title="Audio & Subtitle tracks"
            >
              <AudioLines className="w-3.5 h-3.5 text-teal-400" />
              <span>Tracks</span>
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 transition"
              title="Toggle Fullscreen (F)"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Tracks Selector Dropdown */}
        {showTrackMenu && (
          <div className="pointer-events-auto self-end bg-slate-900/95 border border-slate-700 p-4 rounded-2xl shadow-2xl space-y-4 w-72 backdrop-blur-md">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-teal-400 block mb-2">
                Audio Stream Track
              </label>
              <div className="space-y-1">
                {[
                  { id: 'eng', label: 'English (Dolby Digital 5.1)' },
                  { id: 'orig', label: 'Original Audio (AAC Stereo)' },
                  { id: 'desc', label: 'Audio Description (AD)' },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedAudioTrack(t.id)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition ${
                      selectedAudioTrack === t.id
                        ? 'bg-teal-500 text-slate-950 font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-teal-400 block mb-2">
                Subtitles Track
              </label>
              <div className="space-y-1">
                {[
                  { id: 'off', label: 'Subtitles Off' },
                  { id: 'dvb', label: 'English (DVB Subtitles)' },
                  { id: 'txt888', label: 'Teletext Page 888' },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedSubtitleTrack(t.id)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition ${
                      selectedSubtitleTrack === t.id
                        ? 'bg-teal-500 text-slate-950 font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Zap Bar & Controls */}
        <div className="pointer-events-auto bg-gradient-to-t from-black/95 via-black/80 to-transparent p-5 rounded-3xl backdrop-blur-md space-y-3.5 border border-slate-800/60">
          {/* DVR Timeline Seek Bar (if recording or vod) */}
          {dvr && duration > 0 && (
            <div className="space-y-1">
              <input
                type="range"
                min={0}
                max={duration}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-400"
              />
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>{formatSecs(currentTime)}</span>
                <span>{formatSecs(duration)}</span>
              </div>
            </div>
          )}

          {/* Live Zap Bar Details (if channel) */}
          {channel && nowEv && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{nowEv.title}</span>
                  {nowEv.subtitle && <span className="text-teal-300 text-xs">({nowEv.subtitle})</span>}
                </div>
                <div className="text-slate-300 font-mono text-xs">
                  {formatHm(nowEv.start)} - {formatHm(nowEv.stop)}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full"
                  style={{
                    width: `${Math.min(100, Math.max(0, ((nowSec - nowEv.start) / (nowEv.stop - nowEv.start)) * 100))}%`,
                  }}
                />
              </div>

              {nextEv && (
                <div className="text-[11px] text-slate-400 truncate">
                  <span className="font-semibold text-slate-300">Next:</span> {nextEv.title} ({formatHm(nextEv.start)})
                </div>
              )}
            </div>
          )}

          {/* Action Buttons Row */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="p-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black shadow-lg transition active:scale-95"
                title="Play / Pause"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
              </button>

              {/* Channel Up / Down */}
              {channel && (
                <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
                  <button
                    onClick={prevChannel}
                    className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    title="Previous Channel (Down)"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-slate-300 px-1">CH</span>
                  <button
                    onClick={nextChannel}
                    className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    title="Next Channel (Up)"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Volume Slider */}
              <div className="flex items-center gap-2 text-slate-300 ml-2">
                <button onClick={toggleMute} className="hover:text-white transition">
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {onOpenEpg && (
                <button
                  onClick={onOpenEpg}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition"
                  title="TV Guide (G)"
                >
                  <CalendarDays className="w-4 h-4 text-teal-400" />
                  <span className="hidden sm:inline">TV Guide</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
