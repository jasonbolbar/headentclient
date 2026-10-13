import React from 'react';
import { Home, Tv, Radio, Disc3, Settings } from 'lucide-react';

export type NavTab = 'home' | 'channels' | 'radio' | 'dvr' | 'settings';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  showHomeTab?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab, showHomeTab = true }) => {
  return (
    <div className="bg-slate-900/95 border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl backdrop-blur-md shrink-0">
      {showHomeTab && (
        <button
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            currentTab === 'home'
              ? 'text-teal-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[11px]">Home</span>
        </button>
      )}

      {/* Red: Channels */}
      <button
        onClick={() => onSelectTab('channels')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition relative ${
          currentTab === 'channels'
            ? 'text-red-400 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className="relative">
          <Tv className="w-5 h-5" />
          <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
        </div>
        <span className="text-[11px]">Channels</span>
      </button>

      {/* Green: Radio */}
      <button
        onClick={() => onSelectTab('radio')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition relative ${
          currentTab === 'radio'
            ? 'text-emerald-400 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className="relative">
          <Radio className="w-5 h-5" />
          <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
        </div>
        <span className="text-[11px]">Radio</span>
      </button>

      {/* Yellow: DVR */}
      <button
        onClick={() => onSelectTab('dvr')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition relative ${
          currentTab === 'dvr'
            ? 'text-amber-400 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className="relative">
          <Disc3 className="w-5 h-5" />
          <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-500/50" />
        </div>
        <span className="text-[11px]">Archive</span>
      </button>

      {/* Blue: Settings */}
      <button
        onClick={() => onSelectTab('settings')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition relative ${
          currentTab === 'settings'
            ? 'text-blue-400 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className="relative">
          <Settings className="w-5 h-5" />
          <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
        </div>
        <span className="text-[11px]">Settings</span>
      </button>
    </div>
  );
};
