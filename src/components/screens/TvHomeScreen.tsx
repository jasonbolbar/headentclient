import React from 'react';
import { useTvheadend } from '../../context/TvheadendContext';
import { Tv, Radio, CalendarDays, Disc3, Settings, Play, Info, Star } from 'lucide-react';
import { PiconImage } from '../common/PiconImage';
import { AppStorage } from '../../services/storage';

interface TvHomeScreenProps {
  onNavigate: (section: 'channels' | 'radio' | 'epg' | 'dvr' | 'settings') => void;
  onOpenChannel: (uuid: string) => void;
  onOpenEpgModal?: (channelUuid: string) => void;
}

export const TvHomeScreen: React.FC<TvHomeScreenProps> = ({ onNavigate, onOpenChannel, onOpenEpgModal }) => {
  const { tvChannels, epgMap, settings, playChannel } = useTvheadend();

  // Last channel for Hero card
  const lastChannelUuid = AppStorage.getLastChannel();
  const heroChannel = tvChannels.find(c => c.uuid === lastChannelUuid) || tvChannels[0];

  // Now & Next EPG for Hero channel
  const heroEvents = heroChannel ? (epgMap[heroChannel.uuid] || []) : [];
  const nowSec = Math.floor(Date.now() / 1000);
  const nowEvent = heroEvents.find(e => e.start <= nowSec && nowSec < e.stop) || heroEvents[0];
  const nextEvent = heroEvents.find(e => e.start >= (nowEvent ? nowEvent.stop : nowSec));

  const progressPercent = nowEvent && nowEvent.stop > nowEvent.start
    ? Math.min(100, Math.max(0, ((nowSec - nowEvent.start) / (nowEvent.stop - nowEvent.start)) * 100))
    : 0;

  const formatHm = (sec?: number) => {
    if (!sec) return '';
    const d = new Date(sec * 1000);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Favourites list
  const favoriteChannels = tvChannels.filter(c => settings.favoriteChannelUuids.includes(c.uuid));

  const tiles = [
    {
      id: 'channels' as const,
      title: 'TV Channels',
      desc: `${tvChannels.length} Live channels`,
      icon: Tv,
      color: 'from-red-600 to-rose-700',
      dot: 'bg-red-500',
      tag: 'Red Key',
      keyHint: '1',
    },
    {
      id: 'radio' as const,
      title: 'Radio Stations',
      desc: 'Digital & FM broadcasts',
      icon: Radio,
      color: 'from-emerald-600 to-teal-700',
      dot: 'bg-emerald-500',
      tag: 'Green Key',
      keyHint: '2',
    },
    {
      id: 'epg' as const,
      title: 'TV Guide (EPG)',
      desc: 'Timeline schedule grid',
      icon: CalendarDays,
      color: 'from-cyan-600 to-blue-700',
      dot: 'bg-cyan-400',
      tag: 'Guide Key',
      keyHint: 'G',
    },
    {
      id: 'dvr' as const,
      title: 'Archive (DVR)',
      desc: 'Recordings & Timers',
      icon: Disc3,
      color: 'from-amber-600 to-yellow-600',
      dot: 'bg-amber-400',
      tag: 'Yellow Key',
      keyHint: '3',
    },
    {
      id: 'settings' as const,
      title: 'Settings',
      desc: 'Servers & Configuration',
      icon: Settings,
      color: 'from-blue-600 to-indigo-700',
      dot: 'bg-blue-400',
      tag: 'Blue Key',
      keyHint: '4',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 select-none bg-gradient-to-b from-[#0B1220] to-[#0F172A]">
      {/* Modern Hero Card */}
      {heroChannel && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-teal-950/40 border border-teal-500/30 p-6 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 min-w-0 flex-1">
              {/* Channel badge */}
              <div className="flex items-center gap-3">
                <PiconImage
                  src={heroChannel.iconPublicUrl}
                  alt={heroChannel.name}
                  fallbackText={heroChannel.name}
                  className="w-12 h-12 shadow-lg border-teal-500/30"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded">
                      CH {heroChannel.number || '—'}
                    </span>
                    <h2 className="text-xl font-extrabold text-white tracking-tight">{heroChannel.name}</h2>
                  </div>
                  <span className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Live On Air
                  </span>
                </div>
              </div>

              {/* Program details */}
              <div className="pt-1">
                <h3 className="text-2xl font-black text-white tracking-tight">
                  {nowEvent ? nowEvent.title : 'Live Broadcast'}
                </h3>
                {nowEvent?.subtitle && (
                  <p className="text-sm font-medium text-teal-300 mt-0.5">{nowEvent.subtitle}</p>
                )}
                {nowEvent?.summary && (
                  <p className="text-xs text-slate-300 line-clamp-2 mt-1.5 max-w-2xl leading-relaxed">
                    {nowEvent.summary}
                  </p>
                )}
              </div>

              {/* Time progress bar */}
              {nowEvent && (
                <div className="space-y-1.5 pt-1 max-w-xl">
                  <div className="flex justify-between text-xs font-medium text-slate-400">
                    <span>{formatHm(nowEvent.start)}</span>
                    <span className="text-teal-400 font-bold">
                      {Math.max(0, Math.round((nowEvent.stop - nowSec) / 60))} min left
                    </span>
                    <span>{formatHm(nowEvent.stop)}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-1000"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Next on air */}
              {nextEvent && (
                <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                  <span className="font-bold text-slate-300">Next ({formatHm(nextEvent.start)}):</span>
                  <span className="truncate text-slate-300">{nextEvent.title}</span>
                </div>
              )}
            </div>

            {/* Hero Actions */}
            <div className="flex sm:flex-row lg:flex-col gap-3 shrink-0">
              <button
                onClick={() => playChannel(heroChannel)}
                className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold text-sm shadow-lg shadow-teal-500/20 transition active:scale-95"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Watch Now (OK)</span>
              </button>
              <button
                onClick={() => onNavigate('epg')}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition active:scale-95"
              >
                <CalendarDays className="w-4 h-4 text-teal-400" />
                <span>Channel Guide</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Favourites Row */}
      {favoriteChannels.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Favorite Channels</h3>
            </div>
            <span className="text-xs text-slate-400">Click to zap</span>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {favoriteChannels.map(ch => {
              const events = epgMap[ch.uuid] || [];
              const curr = events.find(e => e.start <= nowSec && nowSec < e.stop) || events[0];
              return (
                <button
                  key={ch.uuid}
                  onClick={() => playChannel(ch)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/50 transition shrink-0 w-64 text-left group shadow-md"
                >
                  <PiconImage
                    src={ch.iconPublicUrl}
                    alt={ch.name}
                    fallbackText={ch.name}
                    className="w-10 h-10 group-hover:scale-105 transition"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono text-teal-400 font-bold">{ch.number || ''}</span>
                      <h4 className="text-xs font-bold text-white truncate">{ch.name}</h4>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {curr ? curr.title : 'Live Broadcast'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation Tiles */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Main Sections</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {tiles.map(tile => {
            const Icon = tile.icon;
            return (
              <button
                key={tile.id}
                onClick={() => onNavigate(tile.id)}
                className="group relative flex flex-col justify-between p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800/80 hover:border-slate-700 transition shadow-lg text-left overflow-hidden min-h-[140px] active:scale-95"
              >
                <div className="flex items-start justify-between w-full">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${tile.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                    {tile.tag}
                  </span>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-bold text-white group-hover:text-teal-400 transition">
                    {tile.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{tile.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
