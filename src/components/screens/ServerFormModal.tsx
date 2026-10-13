import React, { useState } from 'react';
import { TvhServer } from '../../types';
import { TvhApiService, ConnectionTestResult } from '../../services/api';
import { X, Server, Wifi, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface ServerFormModalProps {
  existingServer?: TvhServer | null;
  onSave: (server: TvhServer) => void;
  onClose: () => void;
}

export const ServerFormModal: React.FC<ServerFormModalProps> = ({ existingServer, onSave, onClose }) => {
  const [name, setName] = useState(existingServer?.name || 'My Tvheadend Server');
  const [host, setHost] = useState(existingServer?.host || '192.168.1.100');
  const [port, setPort] = useState(existingServer?.port || 9981);
  const [htspPort, setHtspPort] = useState(existingServer?.htspPort || 9982);
  const [useHttps, setUseHttps] = useState(existingServer?.useHttps || false);
  const [username, setUsername] = useState(existingServer?.username || '');
  const [password, setPassword] = useState(existingServer?.password || '');
  const [profile, setProfile] = useState(existingServer?.profile || 'pass');
  const [dvrConfig, setDvrConfig] = useState(existingServer?.dvrConfig || '');
  const [authMode, setAuthMode] = useState<TvhServer['authMode']>(existingServer?.authMode || 'auto');
  const [connectionMode, setConnectionMode] = useState<TvhServer['connectionMode']>(existingServer?.connectionMode || 'http');

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const draft: TvhServer = {
      id: existingServer?.id || 'temp',
      name,
      host,
      port: Number(port),
      htspPort: Number(htspPort),
      useHttps,
      username,
      password,
      profile,
      dvrConfig,
      authMode,
      connectionMode,
    };
    const res = await TvhApiService.testConnection(draft);
    setTesting(false);
    setTestResult(res);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const srv: TvhServer = {
      id: existingServer?.id || `srv-${Date.now()}`,
      name: name.trim() || 'Tvheadend',
      host: host.trim(),
      port: Number(port) || 9981,
      htspPort: Number(htspPort) || 9982,
      useHttps,
      username: username.trim(),
      password,
      profile: profile.trim() || 'pass',
      dvrConfig: dvrConfig.trim(),
      authMode,
      connectionMode,
      isDemo: false,
    };
    onSave(srv);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl relative max-h-[95vh] flex flex-col overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800/80 hover:bg-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pb-3 border-b border-slate-800 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">
              {existingServer ? 'Edit Tvheadend Server' : 'Add New Tvheadend Server'}
            </h2>
            <p className="text-xs text-slate-400">Configure connection details for TVH 4.3+</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-4 overflow-y-auto flex-1 pr-1">
          {/* Server Name */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Server Name / Label</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Host & Port */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">Host or IP Address</label>
              <input
                type="text"
                value={host}
                onChange={e => setHost(e.target.value)}
                placeholder="192.168.1.100 or tvh.local"
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">HTTP Port</label>
              <input
                type="number"
                value={port}
                onChange={e => setPort(Number(e.target.value))}
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* HTTPS Toggle & HTSP Port */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-800">
            <div>
              <span className="text-xs font-bold text-white block">Use HTTPS (SSL/TLS)</span>
              <span className="text-[10px] text-slate-400">Enable if server has TLS certificate</span>
            </div>
            <input
              type="checkbox"
              checked={useHttps}
              onChange={e => setUseHttps(e.target.checked)}
              className="w-4 h-4 rounded text-blue-500 focus:ring-blue-500 bg-slate-800 border-slate-700"
            />
          </div>

          {/* Credentials */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="optional"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="optional"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Profiles & Auth */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Stream Profile</label>
              <input
                type="text"
                value={profile}
                onChange={e => setProfile(e.target.value)}
                placeholder="pass or matroska"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Auth Mode</label>
              <select
                value={authMode}
                onChange={e => setAuthMode(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="auto">Auto (Basic / Digest)</option>
                <option value="basic">Basic Auth</option>
                <option value="digest">Digest Auth</option>
                <option value="none">None (Public)</option>
              </select>
            </div>
          </div>

          {/* Test Connection Result */}
          {testResult && (
            <div className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
              testResult.success
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-red-950/60 border-red-500/40 text-red-300'
            }`}>
              {testResult.success ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-bold">Connection successful!</p>
                    <p className="text-[10px] opacity-80">{testResult.serverName} ({testResult.version})</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <div>
                    <p className="font-bold">Connection failed</p>
                    <p className="text-[10px] opacity-80">{testResult.error}</p>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !host}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 font-bold text-xs border border-slate-700 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'Testing...' : 'Test Connection'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition active:scale-95"
              >
                Save Server
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
