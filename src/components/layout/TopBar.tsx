import React from 'react';
import { useTvheadend } from '../../context/TvheadendContext';
import { Tv, Monitor, Smartphone, RefreshCw, CalendarDays, Sparkles } from 'lucide-react';

interface TopBarProps {
  onOpenEpg?: () => void;
  title?: string;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenEpg, title }) => {
  const { settings, updateSettings, refreshData, loading } = useTvheadend();

  return (
    <header className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between shadow-md shrink-0 select-none">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
          <Tv className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
            {title || 'Headent Client'}
            {settings.theme === 'modern' && (
              <span className="text-[10px] font-semibold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-1.5 py-0.2 rounded">
                Modern
              </span>
            )}
          </h1>
          <p className="text-[10px] text-slate-400">Tvheadend Live TV & DVR</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {onOpenEpg && (
          <button
            onClick={onOpenEpg}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700/60 transition"
            title="Open EPG TV Guide"
          >
            <CalendarDays className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">TV Guide</span>
          </button>
        )}

        {/* Refresh data */}
        <button
          onClick={() => refreshData()}
          disabled={loading}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition disabled:opacity-50"
          title="Reload channels & EPG"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-400' : ''}`} />
        </button>

        {/* Theme toggle: Modern / Classic */}
        <button
          onClick={() => updateSettings({ theme: settings.theme === 'modern' ? 'classic' : 'modern' })}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold border transition ${
            settings.theme === 'modern'
              ? 'bg-teal-950/60 text-teal-300 border-teal-500/30'
              : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}
          title="Toggle UI Theme (Modern / Classic)"
        >
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span className="hidden md:inline">{settings.theme === 'modern' ? 'Modern' : 'Classic'}</span>
        </button>

        {/* UI Mode toggle: TV vs Phone */}
        <button
          onClick={() => updateSettings({ uiMode: settings.uiMode === 'tv' ? 'phone' : 'tv' })}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
            settings.uiMode === 'tv'
              ? 'bg-blue-950/60 text-blue-300 border-blue-500/40'
              : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}
          title="Toggle interface: TV Launcher mode vs Mobile/Phone tab mode"
        >
          {settings.uiMode === 'tv' ? (
            <>
              <Monitor className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">TV Mode</span>
            </>
          ) : (
            <>
              <Smartphone className="w-3.5 h-3.5 text-slate-300" />
              <span className="hidden sm:inline">Phone Mode</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
