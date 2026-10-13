import React, { useState, useEffect } from 'react';
import { useTvheadend } from '../../context/TvheadendContext';
import { Server, Wifi } from 'lucide-react';

export const TvTopClock: React.FC = () => {
  const { activeServer, settings } = useTvheadend();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[time.getDay()]} ${time.getDate()}. ${months[time.getMonth()]}`;
  };

  const formatTime = () => {
    const is12h = settings.clockFormat === '12h';
    return time.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: is12h,
    });
  };

  return (
    <div className="flex items-center justify-between px-8 py-4 select-none shrink-0 border-b border-slate-800/40">
      {/* Date */}
      <div className="text-sm font-semibold tracking-wide text-slate-300">
        {formatDate()}
      </div>

      {/* Center Server Pill */}
      <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/60 border border-slate-700/50 rounded-full text-xs text-slate-300">
        <Server className="w-3.5 h-3.5 text-teal-400" />
        <span className="font-medium truncate max-w-[200px]">{activeServer.name}</span>
        {activeServer.isDemo ? (
          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 uppercase tracking-wider">
            Demo
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400">
            <Wifi className="w-2.5 h-2.5" />
            Online
          </span>
        )}
      </div>

      {/* Time */}
      <div className="text-2xl font-bold font-mono tracking-tight text-white drop-shadow">
        {formatTime()}
      </div>
    </div>
  );
};
