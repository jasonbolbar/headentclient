import React, { useState, useMemo } from 'react';
import { useTvheadend } from '../../context/TvheadendContext';
import { PiconImage } from '../common/PiconImage';
import { Radio, Play, Pause, Star, Search, Volume2, Music } from 'lucide-react';

export const RadioScreen: React.FC = () => {
  const { radioChannels, epgMap, playRadio, stopRadio, currentRadio, isRadioPlaying, settings, toggleFavorite } = useTvheadend();

  const [searchQuery, setSearchQuery] = useState('');
  const [favOnly, setFavOnly] = useState(false);

  const nowSec = Math.floor(Date.now() / 1000);

  const filteredRadios = useMemo(() => {
    return radioChannels.filter(st => {
      if (favOnly && !settings.favoriteChannelUuids.includes(st.uuid)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return st.name.toLowerCase().includes(q) || st.number?.toString().includes(q);
      }
      return true;
    });
  }, [radioChannels, favOnly, settings.favoriteChannelUuids, searchQuery]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0B1220]">
      {/* Top Filter & Search Bar */}
      <div className="px-6 py-3.5 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search radio stations..."
            className="w-full pl-9 pr-4 py-2 bg-slate-800/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFavOnly(!favOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              favOnly
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${favOnly ? 'fill-slate-950' : 'text-amber-400'}`} />
            <span>Favorites Only</span>
          </button>
        </div>
      </div>

      {/* Main Radio List & Now Playing Card */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* Active Radio Station Card */}
        {currentRadio && (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/40 shadow-xl flex flex-col sm:flex-row items-center gap-5">
            <div className="relative">
              <PiconImage
                src={currentRadio.iconPublicUrl}
                alt={currentRadio.name}
                fallbackText={currentRadio.name}
                className="w-20 h-20 shadow-2xl border-emerald-500/40"
              />
              {isRadioPlaying && (
                <span className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full text-slate-950 shadow">
                  <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                </span>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono text-emerald-400 font-bold">CH {currentRadio.number || ''}</span>
                <span className="text-xs uppercase font-bold text-slate-400">Live Station</span>
              </div>
              <h3 className="text-xl font-black text-white mt-0.5 truncate">{currentRadio.name}</h3>

              {(() => {
                const events = epgMap[currentRadio.uuid] || [];
                const curr = events.find(e => e.start <= nowSec && nowSec < e.stop) || events[0];
                return (
                  <p className="text-xs text-emerald-300 font-medium mt-1 truncate">
                    {curr ? curr.title : 'Live Audio Broadcast'}
                  </p>
                );
              })()}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => (isRadioPlaying ? stopRadio() : playRadio(currentRadio))}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg transition active:scale-95"
              >
                {isRadioPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Listen Live</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Radio Station List */}
        <div className="space-y-2.5">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-1">
            Available Stations ({filteredRadios.length})
          </h3>

          {filteredRadios.map(st => {
            const isPlayingThis = currentRadio?.uuid === st.uuid && isRadioPlaying;
            const isFav = settings.favoriteChannelUuids.includes(st.uuid);
            const events = epgMap[st.uuid] || [];
            const curr = events.find(e => e.start <= nowSec && nowSec < e.stop) || events[0];
            const next = events.find(e => e.start >= (curr ? curr.stop : nowSec));

            return (
              <div
                key={st.uuid}
                className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between gap-4 transition shadow-md"
              >
                <div
                  className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
                  onClick={() => (isPlayingThis ? stopRadio() : playRadio(st))}
                >
                  <span className="font-mono text-xs font-bold text-emerald-400 w-8 text-center shrink-0">
                    {st.number || '—'}
                  </span>
                  <PiconImage
                    src={st.iconPublicUrl}
                    alt={st.name}
                    fallbackText={st.name}
                    className="w-11 h-11 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white hover:text-emerald-400 transition truncate">
                        {st.name}
                      </h4>
                      {isPlayingThis && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                          PLAYING
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 truncate mt-0.5">
                      {curr ? curr.title : 'Live Audio Stream'}
                    </p>
                    {next && (
                      <p className="text-[10px] text-slate-500 truncate mt-0.2">
                        Next: {next.title}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => (isPlayingThis ? stopRadio() : playRadio(st))}
                    className="p-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 font-bold transition active:scale-95"
                    title={isPlayingThis ? 'Pause' : 'Play station'}
                  >
                    {isPlayingThis ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  </button>

                  <button
                    onClick={() => toggleFavorite(st.uuid)}
                    className={`p-2.5 rounded-xl border transition ${
                      isFav
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-700/60 text-slate-400 hover:text-amber-400'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
