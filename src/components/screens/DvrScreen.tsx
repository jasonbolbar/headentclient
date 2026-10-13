import React, { useState, useMemo } from 'react';
import { useTvheadend } from '../../context/TvheadendContext';
import { DvrEntry, DvrRule } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { AppStorage } from '../../services/storage';
import {
  Disc3,
  Calendar,
  Film,
  Tv,
  Play,
  Trash2,
  StopCircle,
  LayoutGrid,
  List,
  Clock,
  HardDrive,
  Folder,
  Layers,
  AlertTriangle
} from 'lucide-react';

type DvrTab = 'recent' | 'scheduled' | 'rules' | 'movies' | 'series' | 'channels';

export const DvrScreen: React.FC = () => {
  const { dvrEntries, dvrRules, playDvr, deleteRecording, stopRecording, cancelRecording } = useTvheadend();

  const [activeTab, setActiveTab] = useState<DvrTab>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<DvrEntry | null>(null);

  const resumeProgress = useMemo(() => AppStorage.getResumeProgress(), []);

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '—';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${Math.round(mb)} MB`;
  };

  const formatDuration = (sec?: number) => {
    if (!sec || sec <= 0) return '—';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const formatDate = (ts: number) => {
    return new Date(ts * 1000).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Filter entries based on active tab
  const filteredEntries = useMemo(() => {
    switch (activeTab) {
      case 'recent':
        return dvrEntries.filter(e => e.status === 'completed' || e.status === 'recording');
      case 'scheduled':
        return dvrEntries.filter(e => e.status === 'scheduled');
      case 'movies':
        return dvrEntries.filter(e => e.contentType === 0x10 || e.dispTitle.toLowerCase().includes('movie'));
      case 'series':
        return dvrEntries.filter(e => e.dispTitle.toLowerCase().includes('earth') || e.dispTitle.toLowerCase().includes('journey'));
      case 'channels':
        return dvrEntries;
      default:
        return dvrEntries;
    }
  }, [dvrEntries, activeTab]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0B1220]">
      {/* Top Tabs & View Toggle Bar */}
      <div className="px-6 py-3.5 border-b border-slate-800 bg-slate-900/70 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('recent')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
              activeTab === 'recent'
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <Disc3 className="w-3.5 h-3.5" />
            <span>Recordings ({dvrEntries.filter(e => e.status !== 'scheduled').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('scheduled')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
              activeTab === 'scheduled'
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Scheduled ({dvrEntries.filter(e => e.status === 'scheduled').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
              activeTab === 'rules'
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Timer Rules ({dvrRules.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('movies')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
              activeTab === 'movies'
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Movies</span>
          </button>

          <button
            onClick={() => setActiveTab('series')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
              activeTab === 'series'
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Series</span>
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            title="Grid view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition ${viewMode === 'list' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            title="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {activeTab === 'rules' ? (
          /* Timer Rules Section */
          <div className="space-y-3 max-w-3xl">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2">Automated Recording Rules (AutoRec)</h3>
            {dvrRules.map(rule => (
              <div key={rule.uuid} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <h4 className="text-sm font-bold text-white">{rule.name}</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-400 uppercase">
                      {rule.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Channel: {rule.channel || 'All Channels'} • Title: {rule.title || 'All'}
                    {rule.start && ` • Time: ${rule.start} - ${rule.stop}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-emerald-400 font-semibold px-2 py-1 rounded bg-emerald-950/60 border border-emerald-500/30">
                    Enabled
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center text-slate-400">
            <Disc3 className="w-12 h-12 text-slate-600 mb-2" />
            <p className="text-base font-semibold">No recordings found</p>
            <p className="text-xs text-slate-500 mt-1">Schedule programmes from the TV Guide or Live channels</p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredEntries.map(entry => {
              const resumeSec = resumeProgress[entry.uuid] || 0;
              const hasResume = resumeSec > 0 && entry.duration && entry.duration > 0;
              const resumePercent = hasResume ? Math.min(100, (resumeSec / entry.duration!) * 100) : 0;
              const isRec = entry.status === 'recording' || entry.schedStatus === 'recording';

              return (
                <div
                  key={entry.uuid}
                  className="rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 p-4 flex flex-col justify-between shadow-lg transition group relative"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs font-mono font-bold text-teal-400 truncate">
                        {entry.channelName}
                      </span>
                      <StatusBadge status={entry.status} size="sm" />
                    </div>

                    <h4 className="text-base font-black text-white group-hover:text-amber-400 transition line-clamp-1">
                      {entry.dispTitle}
                    </h4>
                    {entry.dispSubtitle && (
                      <p className="text-xs font-semibold text-slate-300 mt-0.5 line-clamp-1">{entry.dispSubtitle}</p>
                    )}
                    {entry.dispDescription && (
                      <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {entry.dispDescription}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {formatDuration(entry.duration)}
                      </span>
                      {entry.fileSize && entry.fileSize > 0 ? (
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-3 h-3 text-slate-500" />
                          {formatFileSize(entry.fileSize)}
                        </span>
                      ) : null}
                    </div>

                    {hasResume && (
                      <div className="mt-2.5">
                        <div className="flex justify-between text-[10px] text-amber-400 mb-1">
                          <span>Resume: {Math.round(resumeSec / 60)}m</span>
                          <span>{Math.round(resumePercent)}%</span>
                        </div>
                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${resumePercent}%` }} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-3">
                    {isRec ? (
                      <button
                        onClick={() => stopRecording(entry.uuid)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white font-bold text-xs border border-red-500/30 transition"
                      >
                        <StopCircle className="w-3.5 h-3.5" />
                        <span>Stop</span>
                      </button>
                    ) : entry.status === 'scheduled' ? (
                      <button
                        onClick={() => cancelRecording(entry.uuid)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs border border-slate-700 transition"
                      >
                        Cancel
                      </button>
                    ) : (
                      <button
                        onClick={() => playDvr(entry)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition active:scale-95"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Play</span>
                      </button>
                    )}

                    <button
                      onClick={() => setDeleteConfirmTarget(entry)}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition"
                      title="Delete recording"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="space-y-2">
            {filteredEntries.map(entry => (
              <div
                key={entry.uuid}
                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between gap-4 transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-teal-400">{entry.channelName}</span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs text-slate-400">{formatDate(entry.start)}</span>
                    <StatusBadge status={entry.status} size="sm" />
                  </div>
                  <h4 className="text-sm font-bold text-white mt-0.5 truncate">{entry.dispTitle}</h4>
                  {entry.dispSubtitle && <p className="text-xs text-slate-400 truncate">{entry.dispSubtitle}</p>}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                    {formatDuration(entry.duration)} {entry.fileSize ? `(${formatFileSize(entry.fileSize)})` : ''}
                  </span>

                  {entry.status !== 'scheduled' && (
                    <button
                      onClick={() => playDvr(entry)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Play</span>
                    </button>
                  )}

                  <button
                    onClick={() => setDeleteConfirmTarget(entry)}
                    className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Delete Recording?</h3>
            </div>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-white">"{deleteConfirmTarget.dispTitle}"</span>? The recorded video file will be permanently removed from the server.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteRecording(deleteConfirmTarget.uuid);
                  setDeleteConfirmTarget(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow"
              >
                Delete File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
