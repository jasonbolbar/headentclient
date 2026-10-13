import React, { useState, useMemo } from 'react';
import { useTvheadend } from '../../context/TvheadendContext';
import { Channel } from '../../types';
import { PiconImage } from '../common/PiconImage';
import { Search, Star, Eye, EyeOff, CalendarDays, Play, Filter, Check } from 'lucide-react';

interface ChannelsScreenProps {
  onOpenEpgForChannel?: (channelUuid: string) => void;
}

export const ChannelsScreen: React.FC<ChannelsScreenProps> = ({ onOpenEpgForChannel }) => {
  const { tvChannels, tags, epgMap, settings, playChannel, toggleFavorite, toggleHidden, dvrEntries } = useTvheadend();

  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showHidden, setShowHidden] = useState(false);

  const nowSec = Math.floor(Date.now() / 1000);

  // Filter channels
  const filteredChannels = useMemo(() => {
    return tvChannels.filter(ch => {
      // Hidden check
      const isHidden = settings.hiddenChannelUuids.includes(ch.uuid);
      if (!showHidden && isHidden) return false;
      if (showHidden && !isHidden) return false;

      // Tag filter
      if (selectedTag === 'favorites') {
        if (!settings.favoriteChannelUuids.includes(ch.uuid)) return false;
      } else if (selectedTag !== 'all') {
        if (!ch.tags.includes(selectedTag)) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = ch.name.toLowerCase().includes(q);
        const matchesNum = ch.number?.toString().includes(q);
        return matchesName || matchesNum;
      }

      return true;
    });
  }, [tvChannels, settings.hiddenChannelUuids, settings.favoriteChannelUuids, selectedTag, searchQuery, showHidden]);

  // Map of currently recording channel UUIDs
  const recordingChannelUuids = useMemo(() => {
    const set = new Set<string>();
    dvrEntries.forEach(d => {
      if (d.status === 'recording' || d.schedStatus === 'recording') {
        set.add(d.channelUuid);
      }
    });
    return set;
  }, [dvrEntries]);

  const formatHm = (sec?: number) => {
    if (!sec) return '';
    return new Date(sec * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0B1220]">
      {/* Top Filter & Search Bar */}
      <div className="px-6 py-3.5 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md space-y-3 shrink-0">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by channel name or number (e.g. BBC, 1)..."
              className="w-full pl-9 pr-4 py-2 bg-slate-800/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick hidden toggle & count */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              onClick={() => setShowHidden(!showHidden)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                showHidden
                  ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border-slate-700/60'
              }`}
            >
              {showHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showHidden ? 'Viewing Hidden Channels' : 'Hidden Channels'}</span>
              {settings.hiddenChannelUuids.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-700 text-[10px] text-white">
                  {settings.hiddenChannelUuids.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tag Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedTag('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${
              selectedTag === 'all'
                ? 'bg-teal-500 text-slate-950 border-teal-400 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700/70'
            }`}
          >
            All Channels ({tvChannels.length})
          </button>

          <button
            onClick={() => setSelectedTag('favorites')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${
              selectedTag === 'favorites'
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700/70'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${selectedTag === 'favorites' ? 'fill-slate-950' : 'text-amber-400'}`} />
            Favorites ({settings.favoriteChannelUuids.length})
          </button>

          {tags.filter(t => t.uuid !== 'tag-radio').map(tag => (
            <button
              key={tag.uuid}
              onClick={() => setSelectedTag(tag.uuid)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${
                selectedTag === tag.uuid
                  ? 'bg-teal-500 text-slate-950 border-teal-400 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700/70'
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2.5">
        {filteredChannels.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center text-slate-400">
            <p className="text-base font-semibold">No channels found</p>
            <p className="text-xs text-slate-500 mt-1">Try another search or tag filter</p>
          </div>
        ) : (
          filteredChannels.map(ch => {
            const isFav = settings.favoriteChannelUuids.includes(ch.uuid);
            const isHidden = settings.hiddenChannelUuids.includes(ch.uuid);
            const isRec = recordingChannelUuids.has(ch.uuid);

            const events = epgMap[ch.uuid] || [];
            const nowEv = events.find(e => e.start <= nowSec && nowSec < e.stop) || events[0];
            const nextEv = events.find(e => e.start >= (nowEv ? nowEv.stop : nowSec));

            const progress = nowEv && nowEv.stop > nowEv.start
              ? Math.min(100, Math.max(0, ((nowSec - nowEv.start) / (nowEv.stop - nowEv.start)) * 100))
              : 0;

            return (
              <div
                key={ch.uuid}
                className="group relative flex flex-col md:flex-row md:items-center justify-between p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800/80 hover:border-slate-700 transition shadow-md gap-4"
              >
                {/* Channel Identity */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer" onClick={() => playChannel(ch)}>
                  {/* Channel Number */}
                  <div className="w-8 text-center shrink-0">
                    <span className="font-mono text-xs font-bold text-teal-400">
                      {ch.number || '—'}
                    </span>
                  </div>

                  {/* Logo */}
                  <div className="relative shrink-0">
                    <PiconImage
                      src={ch.iconPublicUrl}
                      alt={ch.name}
                      fallbackText={ch.name}
                      className="w-11 h-11"
                    />
                    {isRec && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 ring-2 ring-slate-900 animate-pulse" title="Recording on this channel" />
                    )}
                  </div>

                  {/* Channel Info & EPG */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white group-hover:text-teal-400 transition truncate">
                        {ch.name}
                      </h4>
                      {isRec && (
                        <span className="px-1.5 py-0.2 rounded bg-red-950 border border-red-500/40 text-red-400 text-[10px] font-bold uppercase tracking-wider">
                          REC
                        </span>
                      )}
                    </div>

                    {/* Live & Next Program */}
                    <div className="mt-1 space-y-1">
                      {nowEv ? (
                        <div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-200 font-medium truncate">{nowEv.title}</span>
                            <span className="text-[11px] text-slate-400 font-mono shrink-0">
                              {formatHm(nowEv.start)} - {formatHm(nowEv.stop)}
                            </span>
                          </div>
                          {/* Mini Progress */}
                          <div className="w-full max-w-md h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
                            <div className="h-full bg-teal-500 rounded-full" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">Live Broadcast (No EPG)</p>
                      )}

                      {nextEv && (
                        <div className="text-[11px] text-slate-400 truncate">
                          <span className="font-semibold text-slate-400">Next:</span> {nextEv.title} ({formatHm(nextEv.start)})
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => playChannel(ch)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-500/10 hover:bg-teal-500 text-teal-300 hover:text-slate-950 font-bold text-xs border border-teal-500/30 transition active:scale-95"
                    title="Watch channel"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Watch</span>
                  </button>

                  {onOpenEpgForChannel && (
                    <button
                      onClick={() => onOpenEpgForChannel(ch.uuid)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-teal-400 border border-slate-700/60 transition"
                      title="View channel TV Guide"
                    >
                      <CalendarDays className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => toggleFavorite(ch.uuid)}
                    className={`p-2 rounded-lg border transition ${
                      isFav
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-700/60 text-slate-400 hover:text-amber-400'
                    }`}
                    title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400' : ''}`} />
                  </button>

                  <button
                    onClick={() => toggleHidden(ch.uuid)}
                    className={`p-2 rounded-lg border transition ${
                      isHidden
                        ? 'bg-slate-800 border-slate-700 text-amber-400'
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-700/60 text-slate-400 hover:text-slate-200'
                    }`}
                    title={isHidden ? 'Unhide channel' : 'Hide channel'}
                  >
                    {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
