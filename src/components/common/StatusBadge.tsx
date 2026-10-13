import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = status.toLowerCase();

  if (norm === 'recording' || norm === 'running') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-bold uppercase rounded-full bg-red-950/80 text-red-400 border border-red-500/30 ${size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}>
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        REC
      </span>
    );
  }

  if (norm === 'scheduled' || norm === 'upcoming') {
    return (
      <span className={`inline-flex items-center gap-1 font-semibold uppercase rounded-full bg-amber-950/70 text-amber-300 border border-amber-500/30 ${size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        Scheduled
      </span>
    );
  }

  if (norm === 'completed' || norm === 'finished') {
    return (
      <span className={`inline-flex items-center font-medium uppercase rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 ${size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}>
        Recorded
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center font-medium uppercase rounded-full bg-slate-800 text-slate-300 border border-slate-700 ${size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}>
      {status}
    </span>
  );
};
