import React, { useState } from 'react';
import { useTvheadend } from '../../context/TvheadendContext';
import { TvhServer } from '../../types';
import { ServerFormModal } from './ServerFormModal';
import { AppStorage } from '../../services/storage';
import {
  Server,
  Palette,
  PlaySquare,
  Lock,
  Download,
  Upload,
  Info,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Monitor,
  Smartphone,
  Sparkles,
  Shield,
  FileText,
  Layers
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const { servers, activeServer, setActiveServerId, saveServer, removeServer, settings, updateSettings } = useTvheadend();

  const [activeCategory, setActiveCategory] = useState<string>('servers');
  const [editingServer, setEditingServer] = useState<TvhServer | null>(null);
  const [showServerForm, setShowServerForm] = useState(false);
  const [backupNotice, setBackupNotice] = useState<string | null>(null);

  const handleExportBackup = () => {
    const json = AppStorage.exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `headent-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupNotice('Backup file downloaded successfully!');
    setTimeout(() => setBackupNotice(null), 3500);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      const ok = AppStorage.importBackup(text);
      if (ok) {
        setBackupNotice('Configuration successfully restored! Reloading...');
        setTimeout(() => window.location.reload(), 1200);
      } else {
        setBackupNotice('Invalid backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const categories = [
    { id: 'servers', label: 'Servers', icon: Server, desc: 'Tvheadend servers' },
    { id: 'appearance', label: 'Appearance', icon: Palette, desc: 'Themes & UI modes' },
    { id: 'playback', label: 'Playback', icon: PlaySquare, desc: 'Profiles & Decoding' },
    { id: 'parental', label: 'Parental Lock', icon: Lock, desc: 'PIN & Restrictions' },
    { id: 'backup', label: 'Backup & Restore', icon: Download, desc: 'Export / Import' },
    { id: 'info', label: 'Information', icon: Info, desc: 'Version & Legal' },
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-[#0B1220]">
      {/* Settings Navigation Sidebar */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/80 p-3 shrink-0 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-x-hidden scrollbar-none">
        <div className="hidden md:block px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          Settings Menu
        </div>
        {categories.map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition shrink-0 ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-semibold">{cat.label}</div>
                <div className="text-[10px] text-slate-500 hidden md:block truncate">{cat.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Settings Details Section */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* SERVERS CATEGORY */}
        {activeCategory === 'servers' && (
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Tvheadend Servers</h3>
                <p className="text-xs text-slate-400">Manage connections and credentials</p>
              </div>
              <button
                onClick={() => {
                  setEditingServer(null);
                  setShowServerForm(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add Server</span>
              </button>
            </div>

            <div className="space-y-3">
              {servers.map(srv => {
                const isActive = srv.id === activeServer.id;
                return (
                  <div
                    key={srv.id}
                    className={`p-4 rounded-2xl border transition flex items-center justify-between gap-4 ${
                      isActive
                        ? 'bg-slate-900 border-blue-500/60 shadow-lg'
                        : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white truncate">{srv.name}</h4>
                        {isActive && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                            Active
                          </span>
                        )}
                        {srv.isDemo && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                            Built-in Demo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        {srv.useHttps ? 'https://' : 'http://'}{srv.host}:{srv.port} • Profile: {srv.profile}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!isActive && (
                        <button
                          onClick={() => setActiveServerId(srv.id)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                        >
                          Select
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingServer(srv);
                          setShowServerForm(true);
                        }}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        title="Edit server"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {servers.length > 1 && (
                        <button
                          onClick={() => removeServer(srv.id)}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 transition"
                          title="Remove server"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* APPEARANCE CATEGORY */}
        {activeCategory === 'appearance' && (
          <div className="space-y-5 max-w-2xl">
            <div className="pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Appearance & Interface</h3>
              <p className="text-xs text-slate-400">Customize UI mode, styling and clock options</p>
            </div>

            {/* UI Mode Selector */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <label className="text-xs font-bold text-white uppercase tracking-wider">Device Interface Mode</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => updateSettings({ uiMode: 'tv' })}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-center transition ${
                    settings.uiMode === 'tv'
                      ? 'bg-blue-600/20 border-blue-500 text-white font-bold'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <Monitor className="w-6 h-6 text-blue-400" />
                  <div>
                    <div className="text-xs">Android TV / Set-Top Box</div>
                    <div className="text-[10px] text-slate-400">Launcher hero, D-pad remote</div>
                  </div>
                </button>

                <button
                  onClick={() => updateSettings({ uiMode: 'phone' })}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-center transition ${
                    settings.uiMode === 'phone'
                      ? 'bg-blue-600/20 border-blue-500 text-white font-bold'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-6 h-6 text-slate-300" />
                  <div>
                    <div className="text-xs">Phone / Tablet Mode</div>
                    <div className="text-[10px] text-slate-400">Bottom navigation tabs</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Theme Selector */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <label className="text-xs font-bold text-white uppercase tracking-wider">Visual Theme</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => updateSettings({ theme: 'modern' })}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition ${
                    settings.theme === 'modern'
                      ? 'bg-teal-950/60 border-teal-500 text-white font-bold'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400'
                  }`}
                >
                  <Sparkles className="w-5 h-5 text-teal-400 shrink-0" />
                  <div className="text-left">
                    <div className="text-xs">Modern Mode</div>
                    <div className="text-[10px] text-slate-400">Navy/teal glass aesthetic</div>
                  </div>
                </button>

                <button
                  onClick={() => updateSettings({ theme: 'classic' })}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition ${
                    settings.theme === 'classic'
                      ? 'bg-slate-800 border-slate-400 text-white font-bold'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400'
                  }`}
                >
                  <Layers className="w-5 h-5 text-slate-400 shrink-0" />
                  <div className="text-left">
                    <div className="text-xs">Classic Mode</div>
                    <div className="text-[10px] text-slate-400">Clean, compact layout</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Clock Format */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white">Clock Display Format</h4>
                <p className="text-[10px] text-slate-400">Choose between 24-hour and 12-hour AM/PM time</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateSettings({ clockFormat: '24h' })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                    settings.clockFormat === '24h'
                      ? 'bg-teal-500 text-slate-950 border-teal-400'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  24 Hours
                </button>
                <button
                  onClick={() => updateSettings({ clockFormat: '12h' })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                    settings.clockFormat === '12h'
                      ? 'bg-teal-500 text-slate-950 border-teal-400'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  12 Hours
                </button>
              </div>
            </div>

            {/* Tile behavior */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white">Tiles Open Channel List First</h4>
                <p className="text-[10px] text-slate-400">When enabled, home tiles open the list instead of directly starting playback</p>
              </div>
              <input
                type="checkbox"
                checked={settings.tilesOpenList}
                onChange={e => updateSettings({ tilesOpenList: e.target.checked })}
                className="w-4 h-4 rounded text-teal-500"
              />
            </div>
          </div>
        )}

        {/* PLAYBACK CATEGORY */}
        {activeCategory === 'playback' && (
          <div className="space-y-4 max-w-2xl">
            <div className="pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Playback & Decoding</h3>
              <p className="text-xs text-slate-400">Video streaming parameters and hardware acceleration</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <label className="text-xs font-bold text-white uppercase tracking-wider">Default Streaming Profile</label>
              <input
                type="text"
                value={settings.streamProfile}
                onChange={e => updateSettings({ streamProfile: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                placeholder="pass (raw direct stream)"
              />
              <p className="text-[10px] text-slate-400">Typically "pass" for untouched MPEG-TS, or transcode profile name on your server</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white">Hardware Video Acceleration</h4>
                <p className="text-[10px] text-slate-400">Enable GPU hardware decoding for smooth 4K/60fps playback</p>
              </div>
              <input
                type="checkbox"
                checked={settings.hwDecoding}
                onChange={e => updateSettings({ hwDecoding: e.target.checked })}
                className="w-4 h-4 rounded text-teal-500"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white">Timeshift Live Buffer</h4>
                <p className="text-[10px] text-slate-400">Allow pausing and seeking backwards on live TV streams</p>
              </div>
              <input
                type="checkbox"
                checked={settings.timeshiftEnabled}
                onChange={e => updateSettings({ timeshiftEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-teal-500"
              />
            </div>
          </div>
        )}

        {/* PARENTAL LOCK */}
        {activeCategory === 'parental' && (
          <div className="space-y-4 max-w-2xl">
            <div className="pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Parental Lock & PIN</h3>
              <p className="text-xs text-slate-400">Restrict access to locked channels or app settings</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white">Enable Parental Lock</h4>
                <p className="text-[10px] text-slate-400">Require PIN before opening protected content</p>
              </div>
              <input
                type="checkbox"
                checked={settings.parentalLockEnabled}
                onChange={e => updateSettings({ parentalLockEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-teal-500"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <label className="text-xs font-bold text-white">4-Digit Security PIN</label>
              <input
                type="password"
                maxLength={4}
                value={settings.parentalPin}
                onChange={e => updateSettings({ parentalPin: e.target.value.replace(/\D/g, '') })}
                className="w-36 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono tracking-widest text-center"
              />
              <p className="text-[10px] text-slate-400">Current default PIN is 1234</p>
            </div>
          </div>
        )}

        {/* BACKUP & RESTORE */}
        {activeCategory === 'backup' && (
          <div className="space-y-4 max-w-2xl">
            <div className="pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Backup & Restore</h3>
              <p className="text-xs text-slate-400">Export or import server configurations and preferences</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Export Backup</h4>
                  <p className="text-[10px] text-slate-400">Save server addresses, favorites, and settings to a JSON file</p>
                </div>
                <button
                  onClick={handleExportBackup}
                  className="w-full py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow transition"
                >
                  Download JSON
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Restore Backup</h4>
                  <p className="text-[10px] text-slate-400">Load configuration from a previously saved JSON file</p>
                </div>
                <label className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer flex items-center justify-center">
                  <span>Select JSON File</span>
                  <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                </label>
              </div>
            </div>

            {backupNotice && (
              <div className="p-3 rounded-xl bg-teal-950/80 border border-teal-500/40 text-teal-300 text-xs font-semibold">
                {backupNotice}
              </div>
            )}
          </div>
        )}

        {/* INFO & LEGAL */}
        {activeCategory === 'info' && (
          <div className="space-y-4 max-w-2xl">
            <div className="pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">About Headent Client</h3>
              <p className="text-xs text-slate-400">Application build details and legal notices</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-white">Headent Client</h4>
                  <p className="text-xs text-slate-400">Tvheadend client for Live TV, EPG, Recordings & Radio</p>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-slate-800 text-teal-400 border border-slate-700">
                  v1.0.7
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Independent client application for Tvheadend servers. Contains no bundled media streams; operates with your authorized Tvheadend server instance.
              </p>
              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                Released under the <span className="font-semibold text-slate-200">MIT License</span>.
              </div>
            </div>

            {/* Remote Control Key Cheat-Sheet */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Remote Control Keys</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span><strong className="text-white">Red key (1):</strong> Live TV Channels</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span><strong className="text-white">Green key (2):</strong> Radio Stations</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span><strong className="text-white">Yellow key (3):</strong> DVR Archive</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span><strong className="text-white">Blue key (4):</strong> Settings</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="font-mono text-teal-400">G:</span>
                  <span>Open TV Guide (EPG)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="font-mono text-teal-400">0-9:</span>
                  <span>Direct channel number zap</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Server Modal */}
      {showServerForm && (
        <ServerFormModal
          existingServer={editingServer}
          onSave={saveServer}
          onClose={() => setShowServerForm(false)}
        />
      )}
    </div>
  );
};
