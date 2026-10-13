import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTvheadend } from '../../context/TvheadendContext';
import { Channel, EpgEvent } from '../../types';
import { PiconImage } from '../common/PiconImage';
import { EpgDetailModal } from './EpgDetailModal';
import { ChevronLeft, ChevronRight, Calendar, Filter } from 'lucide-react';

interface EpgGridScreenProps {
  initialChannelUuid?: string;
  onPlayChannel?: (channel: Channel) => void;
}

const PX_PER_MIN = 3.5; // pixel width for 1 minute
const HOUR_WIDTH = 60 * PX_PER_MIN; // 210px per hour

export const EpgGridScreen: React.FC<EpgGridScreenProps> = ({ initialChannelUuid, onPlayChannel }) => {
  const { tvChannels, epgMap, tags, playChannel } = useTvheadend();

  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [activeModalEvent, setActiveModalEvent] = useState<{ event: EpgEvent; channel: Channel } | null>(null);

  const gridScrollRef = useRef<HTMLDivElement>(null);

  // Time calculations
  const now = new Date();
  const nowSec = Math.floor(now.getTime() / 1000);

  // Base day timestamp (00:00 of selected day)
  const baseDayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + selectedDayOffset, 0, 0, 0);
  const baseDaySec = Math.floor(baseDayDate.getTime() / 1000);

  // Grid spans 24 hours for that day
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Channels to display
  const channels = useMemo(() => {
    return tvChannels.filter(ch => {
      if (selectedTag === 'all') return true;
      return ch.tags.includes(selectedTag);
    });
  }, [tvChannels, selectedTag]);

  // Center scroll to current time on mount if today
  useEffect(() => {
    if (selectedDayOffset === 0 && gridScrollRef.current) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentMinutesFromMidnight = currentHour * 60 + currentMinute;
      const targetPx = Math.max(0, currentMinutesFromMidnight * PX_PER_MIN - 200);
      gridScrollRef.current.scrollLeft = targetPx;
    }
  }, [selectedDayOffset]);

  const daysList = [
    { offset: 0, label: 'Today' },
    { offset: 1, label: 'Tomorrow' },
    { offset: 2, label: new Date(Date.now() + 2 * 86400000).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) },
    { offset: 3, label: new Date(Date.now() + 3 * 86400000).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0B1220]">
      {/* Top Filter & Day Picker Bar */}
      <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shrink-0">
        {/* Day selection tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <Calendar className="w-4 h-4 text-teal-400 ml-2" />
          {daysList.map(d => (
            <button
              key={d.offset}
              onClick={() => setSelectedDayOffset(d.offset)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                selectedDayOffset === d.offset
                  ? 'bg-teal-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Tag Filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setSelectedTag('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${
              selectedTag === 'all'
                ? 'bg-teal-500 text-slate-950 border-teal-400 font-bold'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            All Groups
          </button>
          {tags.filter(t => t.uuid !== 'tag-radio').slice(0, 5).map(tag => (
            <button
              key={tag.uuid}
              onClick={() => setSelectedTag(tag.uuid)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${
                selectedTag === tag.uuid
                  ? 'bg-teal-500 text-slate-950 border-teal-400 font-bold'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main EPG Grid Container */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Fixed Left Channels Column */}
        <div className="w-44 md:w-56 shrink-0 border-r border-slate-800 bg-slate-950/95 z-20 shadow-xl flex flex-col">
          {/* Top header corner */}
          <div className="h-10 border-b border-slate-800 flex items-center px-4 font-bold text-xs uppercase tracking-wider text-slate-400">
            Channels
          </div>

          {/* Channel list rows */}
          <div className="flex-1 overflow-y-hidden">
            {channels.map(ch => (
              <div
                key={ch.uuid}
                onClick={() => (onPlayChannel ? onPlayChannel(ch) : playChannel(ch))}
                className="h-16 border-b border-slate-800/80 px-3 flex items-center gap-2.5 hover:bg-slate-900 cursor-pointer transition select-none group"
              >
                <span className="font-mono text-xs font-bold text-teal-400 w-6 text-center shrink-0">
                  {ch.number || ''}
                </span>
                <PiconImage
                  src={ch.iconPublicUrl}
                  alt={ch.name}
                  fallbackText={ch.name}
                  className="w-9 h-9 shrink-0 group-hover:scale-105 transition"
                />
                <span className="text-xs font-bold text-white group-hover:text-teal-400 transition truncate">
                  {ch.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Timeline Grid */}
        <div
          ref={gridScrollRef}
          className="flex-1 overflow-x-auto overflow-y-auto scrollbar-thin relative bg-slate-950"
        >
          {/* Header: Hourly timeline */}
          <div
            className="h-10 border-b border-slate-800 flex sticky top-0 bg-slate-900/95 backdrop-blur-md z-10 shrink-0"
            style={{ width: `${24 * HOUR_WIDTH}px` }}
          >
            {hours.map(h => (
              <div
                key={h}
                className="border-r border-slate-800/80 px-2 flex items-center text-xs font-mono font-bold text-slate-400"
                style={{ width: `${HOUR_WIDTH}px` }}
              >
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Current Time Indicator Line (if today) */}
          {selectedDayOffset === 0 && (
            <div
              className="absolute top-0 bottom-0 z-30 pointer-events-none flex flex-col items-center"
              style={{
                left: `${Math.max(0, (now.getHours() * 60 + now.getMinutes()) * PX_PER_MIN)}px`,
              }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-lg shadow-red-500/80 -translate-y-1" />
              <div className="w-0.5 h-full bg-red-500/80" />
            </div>
          )}

          {/* Channel Program Rows */}
          <div style={{ width: `${24 * HOUR_WIDTH}px` }}>
            {channels.map(ch => {
              const allEvents = epgMap[ch.uuid] || [];
              const dayEndSec = baseDaySec + 86400;

              // Filter events that fall on this day
              const dayEvents = allEvents.filter(e => e.stop > baseDaySec && e.start < dayEndSec);

              return (
                <div
                  key={ch.uuid}
                  className="h-16 border-b border-slate-800/80 relative flex items-center"
                >
                  {dayEvents.map((ev, i) => {
                    const startOffsetMin = Math.max(0, (ev.start - baseDaySec) / 60);
                    const durationMin = Math.max(15, (ev.stop - ev.start) / 60);

                    const leftPx = startOffsetMin * PX_PER_MIN;
                    const widthPx = Math.max(60, durationMin * PX_PER_MIN - 4);

                    const isNow = ev.start <= nowSec && nowSec < ev.stop;

                    return (
                      <button
                        key={ev.eventId || i}
                        onClick={() => setActiveModalEvent({ event: ev, channel: ch })}
                        className={`absolute top-1 bottom-1 rounded-lg px-2.5 py-1 text-left flex flex-col justify-center transition border overflow-hidden group ${
                          isNow
                            ? 'bg-teal-950/70 border-teal-500/60 hover:bg-teal-900/80 text-white'
                            : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-200'
                        }`}
                        style={{
                          left: `${leftPx}px`,
                          width: `${widthPx}px`,
                        }}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {isNow && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />}
                          <span className="text-xs font-bold truncate group-hover:text-teal-300">
                            {ev.title}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          {new Date(ev.start * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} - {new Date(ev.stop * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Program Detail Modal */}
      {activeModalEvent && (
        <EpgDetailModal
          event={activeModalEvent.event}
          channel={activeModalEvent.channel}
          onClose={() => setActiveModalEvent(null)}
        />
      )}
    </div>
  );
};
