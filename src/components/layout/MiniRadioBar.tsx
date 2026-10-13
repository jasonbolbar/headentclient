import React from 'react';
import { useTvheadend } from '../../context/TvheadendContext';
import { Radio, Play, Pause, Square } from 'lucide-react';
import { PiconImage } from '../common/PiconImage';

export const MiniRadioBar: React.FC = () => {
  const { currentRadio, isRadioPlaying, playRadio, stopRadio, epgMap } = useTvheadend();

  if (!currentRadio) return null;

  const nowEvents = epgMap[currentRadio.uuid] || [];
  const nowSec = Math.floor(Date.now() / 1000);
  const currentEvent = nowEvents.find(e => e.start <= nowSec && nowSec < e.stop) || nowEvents[0];

  return (
    <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900/95 to-slate-900 border-t border-emerald-500/30 px-4 py-2.5 flex items-center justify-between shadow-xl backdrop-blur-md shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <PiconImage
          src={currentRadio.iconPublicUrl}
          alt={currentRadio.name}
          fallbackText={currentRadio.name}
          className="w-9 h-9 border-emerald-500/30"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <h4 className="text-sm font-bold text-white truncate">{currentRadio.name}</h4>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
              RADIO
            </span>
          </div>
          <p className="text-xs text-slate-300 truncate">
            {currentEvent ? currentEvent.title : 'Live Station Broadcast'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => (isRadioPlaying ? stopRadio() : playRadio(currentRadio))}
          className="p-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white transition active:scale-95"
          title={isRadioPlaying ? 'Pause' : 'Play'}
        >
          {isRadioPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
        </button>
        <button
          onClick={stopRadio}
          className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          title="Stop Radio"
        >
          <Square className="w-4 h-4 fill-current" />
        </button>
      </div>
    </div>
  );
};
