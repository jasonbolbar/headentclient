import React, { useState } from 'react';
import { useTvheadend } from '../../context/TvheadendContext';
import { Channel } from '../../types';
import { PiconImage } from '../common/PiconImage';
import { StreamUrlBuilder } from '../../services/streamUrl';
import {
  X,
  Tv,
  Check,
  Calendar,
  Volume2,
  Subtitles,
  Settings,
  Mic,
  Search
} from 'lucide-react';

interface LiveChannelsPreviewModalProps {
  onClose: () => void;
}

export const LiveChannelsPreviewModal: React.FC<LiveChannelsPreviewModalProps> = ({ onClose }) => {
  const { tvChannels, epgMap, activeServer } = useTvheadend();

  const [selectedChannel, setSelectedChannel] = useState<Channel>(tvChannels[0] || null);
  const [selectedAudio, setSelectedAudio] = useState('Español (Dolby Digital 5.1)');
  const [selectedSub, setSelectedSub] = useState('Desactivados');

  const nowSec = Math.floor(Date.now() / 1000);
  const currentEvents = selectedChannel ? (epgMap[selectedChannel.uuid] || []) : [];
  const nowEv = currentEvents.find(e => e.start <= nowSec && nowSec < e.stop) || currentEvents[0];
  const nextEv = currentEvents.find(e => e.start >= (nowEv ? nowEv.stop : nowSec));

  const streamUrl = selectedChannel
    ? StreamUrlBuilder.getLiveUrl(activeServer, selectedChannel.uuid, activeServer.profile, selectedChannel.name)
    : '';

  const formatHm = (sec?: number) => {
    if (!sec) return '';
    return new Date(sec * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col select-none overflow-hidden animate-in fade-in">
      {/* Background Live Stream Video (emulating Android TV TIF Surface playback) */}
      <div className="absolute inset-0">
        <video
          src={streamUrl}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/70" />
      </div>

      {/* Android TV Top Bar */}
      <div className="relative z-10 px-8 py-5 flex items-center justify-between text-slate-300">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800/80 flex items-center justify-center text-teal-400">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">Live Channels (Android TV)</h2>
            <p className="text-[10px] text-teal-400">Entrada TIF: Headent Client • {activeServer.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-mono font-bold text-white bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white"
            title="Cerrar simulación"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Channel Preview & Native Program Guide Overlay */}
      <div className="relative z-10 flex-1 flex flex-col justify-end p-8 space-y-6">
        {/* Active Banner */}
        {selectedChannel && nowEv && (
          <div className="p-6 rounded-2xl bg-black/80 border border-slate-700/80 backdrop-blur-xl max-w-3xl space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xl font-black text-teal-400 bg-teal-950 px-3 py-1 rounded-lg border border-teal-500/30">
                  {selectedChannel.number || '1'}
                </span>
                <PiconImage
                  src={selectedChannel.iconPublicUrl}
                  alt={selectedChannel.name}
                  fallbackText={selectedChannel.name}
                  className="w-12 h-12"
                />
                <div>
                  <h3 className="text-lg font-black text-white">{selectedChannel.name}</h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {formatHm(nowEv.start)} - {formatHm(nowEv.stop)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-red-600 text-[10px] font-bold text-white uppercase tracking-wider">
                  EN DIRECTO
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300">
                  1080p HD
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-base font-bold text-teal-300">{nowEv.title}</h4>
              {nowEv.summary && (
                <p className="text-xs text-slate-300 line-clamp-2 mt-1 leading-relaxed">{nowEv.summary}</p>
              )}
            </div>

            {nextEv && (
              <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <span className="font-bold text-slate-300">A continuación ({formatHm(nextEv.start)}):</span>
                <span className="text-slate-300">{nextEv.title}</span>
              </div>
            )}
          </div>
        )}

        {/* Live Channels Horizontal Channel Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider">
            <span>Guía de Canales Sincronizada (TvContract)</span>
            <span className="text-teal-400 font-normal lowercase">{tvChannels.length} canales disponibles</span>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {tvChannels.map(ch => {
              const isSelected = selectedChannel?.uuid === ch.uuid;
              const evs = epgMap[ch.uuid] || [];
              const curr = evs.find(e => e.start <= nowSec && nowSec < e.stop) || evs[0];

              return (
                <button
                  key={ch.uuid}
                  onClick={() => setSelectedChannel(ch)}
                  className={`p-3.5 rounded-2xl text-left shrink-0 w-64 border transition shadow-xl ${
                    isSelected
                      ? 'bg-teal-950/90 border-teal-400 shadow-teal-500/20 scale-105'
                      : 'bg-black/80 hover:bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="font-mono text-xs font-bold text-teal-400">
                      {ch.number || ''}
                    </span>
                    <PiconImage
                      src={ch.iconPublicUrl}
                      alt={ch.name}
                      fallbackText={ch.name}
                      className="w-8 h-8"
                    />
                    <h5 className="text-xs font-bold text-white truncate flex-1">{ch.name}</h5>
                  </div>
                  <p className="text-[11px] text-slate-300 truncate font-medium">
                    {curr ? curr.title : 'Emisión en vivo'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {curr ? `${formatHm(curr.start)} - ${formatHm(curr.stop)}` : ''}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
