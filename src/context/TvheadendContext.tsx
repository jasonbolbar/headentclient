import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Channel, ChannelTag, EpgEvent, DvrEntry, DvrRule, TvhServer, AppSettings } from '../types';
import { AppStorage } from '../services/storage';
import { TvhApiService } from '../services/api';

interface TvheadendContextValue {
  servers: TvhServer[];
  activeServer: TvhServer;
  settings: AppSettings;
  channels: Channel[];
  radioChannels: Channel[];
  tvChannels: Channel[];
  tags: ChannelTag[];
  epgMap: Record<string, EpgEvent[]>;
  dvrEntries: DvrEntry[];
  dvrRules: DvrRule[];
  loading: boolean;
  error: string | null;

  // Active Playback State
  currentChannel: Channel | null;
  currentDvr: DvrEntry | null;
  currentRadio: Channel | null;
  isRadioPlaying: boolean;

  // Playback control
  playChannel: (channel: Channel) => void;
  playChannelByUuid: (uuid: string) => void;
  playDvr: (dvr: DvrEntry) => void;
  playRadio: (station: Channel) => void;
  stopPlayback: () => void;
  stopRadio: () => void;

  // Server management
  setActiveServerId: (id: string) => void;
  saveServer: (server: TvhServer) => void;
  removeServer: (id: string) => void;

  // Settings
  updateSettings: (partial: Partial<AppSettings>) => void;
  toggleFavorite: (uuid: string) => void;
  reorderFavorites: (newOrder: string[]) => void;
  toggleHidden: (uuid: string) => void;

  // DVR operations
  recordProgram: (eventId: number | string, configId?: string) => Promise<boolean>;
  cancelRecording: (id: string) => Promise<boolean>;
  stopRecording: (id: string) => Promise<boolean>;
  deleteRecording: (id: string) => Promise<boolean>;

  // Data refresh
  refreshData: () => Promise<void>;
}

const TvheadendContext = createContext<TvheadendContextValue | null>(null);

export const TvheadendProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [servers, setServers] = useState<TvhServer[]>(() => AppStorage.getServers());
  const [activeServer, setActiveServer] = useState<TvhServer>(() => AppStorage.getActiveServer());
  const [settings, setSettings] = useState<AppSettings>(() => AppStorage.getSettings());

  const [channels, setChannels] = useState<Channel[]>([]);
  const [tags, setTags] = useState<ChannelTag[]>([]);
  const [epgMap, setEpgMap] = useState<Record<string, EpgEvent[]>>({});
  const [dvrEntries, setDvrEntries] = useState<DvrEntry[]>([]);
  const [dvrRules, setDvrRules] = useState<DvrRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active playback
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [currentDvr, setCurrentDvr] = useState<DvrEntry | null>(null);
  const [currentRadio, setCurrentRadio] = useState<Channel | null>(null);
  const [isRadioPlaying, setIsRadioPlaying] = useState(false);

  // Load data for active server
  const loadServerData = useCallback(async (srv: TvhServer) => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedChannels, fetchedTags, fetchedEpg, fetchedDvr, fetchedRules] = await Promise.all([
        TvhApiService.getChannels(srv),
        TvhApiService.getTags(srv),
        TvhApiService.getEpg(srv),
        TvhApiService.getDvrEntries(srv),
        TvhApiService.getDvrRules(srv),
      ]);

      setChannels(fetchedChannels);
      setTags(fetchedTags);
      setEpgMap(fetchedEpg);
      setDvrEntries(fetchedDvr);
      setDvrRules(fetchedRules);
    } catch (err: any) {
      setError(err?.message || 'Failed to load data from server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServerData(activeServer);
  }, [activeServer, loadServerData]);

  // Periodic EPG & DVR poll (every 60 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      TvhApiService.getEpg(activeServer).then(setEpgMap).catch(() => {});
      TvhApiService.getDvrEntries(activeServer).then(setDvrEntries).catch(() => {});
    }, 60000);
    return () => clearInterval(timer);
  }, [activeServer]);

  // Derived channel lists
  const radioChannels = useMemo(() => {
    return channels.filter(ch => {
      if (ch.isRadioByService === true) return true;
      if (ch.serviceTypes?.some(s => s.toLowerCase().includes('radio'))) return true;
      if (ch.tags.includes('tag-radio')) return true;
      return false;
    }).sort((a, b) => (a.number || 9999) - (b.number || 9999));
  }, [channels]);

  const tvChannels = useMemo(() => {
    return channels.filter(ch => {
      if (ch.isRadioByService === true) return false;
      if (ch.serviceTypes?.some(s => s.toLowerCase().includes('radio'))) return false;
      if (ch.tags.includes('tag-radio')) return false;
      return true;
    }).sort((a, b) => (a.number || 9999) - (b.number || 9999));
  }, [channels]);

  // Playback handlers
  const playChannel = useCallback((ch: Channel) => {
    setCurrentDvr(null);
    setCurrentChannel(ch);
    AppStorage.setLastChannel(ch.uuid);
  }, []);

  const playChannelByUuid = useCallback((uuid: string) => {
    const target = channels.find(c => c.uuid === uuid);
    if (target) {
      playChannel(target);
    }
  }, [channels, playChannel]);

  const playDvr = useCallback((dvr: DvrEntry) => {
    setCurrentChannel(null);
    setCurrentDvr(dvr);
  }, []);

  const playRadio = useCallback((station: Channel) => {
    setCurrentRadio(station);
    setIsRadioPlaying(true);
    AppStorage.setLastRadio(station.uuid);
  }, []);

  const stopPlayback = useCallback(() => {
    setCurrentChannel(null);
    setCurrentDvr(null);
  }, []);

  const stopRadio = useCallback(() => {
    setIsRadioPlaying(false);
  }, []);

  // Server management
  const setActiveServerId = useCallback((id: string) => {
    AppStorage.setActiveServerId(id);
    const found = servers.find(s => s.id === id);
    if (found) {
      setActiveServer(found);
    }
  }, [servers]);

  const saveServer = useCallback((srv: TvhServer) => {
    AppStorage.upsertServer(srv);
    setServers(AppStorage.getServers());
    setActiveServer(srv);
  }, []);

  const removeServer = useCallback((id: string) => {
    AppStorage.deleteServer(id);
    const updated = AppStorage.getServers();
    setServers(updated);
    setActiveServer(AppStorage.getActiveServer());
  }, []);

  // Settings
  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      AppStorage.saveSettings(next);
      return next;
    });
  }, []);

  const toggleFavorite = useCallback((uuid: string) => {
    setSettings(prev => {
      const isFav = prev.favoriteChannelUuids.includes(uuid);
      const newFavs = isFav
        ? prev.favoriteChannelUuids.filter(id => id !== uuid)
        : [...prev.favoriteChannelUuids, uuid];
      const newOrder = isFav
        ? prev.favoriteOrder.filter(id => id !== uuid)
        : [...prev.favoriteOrder, uuid];
      const next = { ...prev, favoriteChannelUuids: newFavs, favoriteOrder: newOrder };
      AppStorage.saveSettings(next);
      return next;
    });
  }, []);

  const reorderFavorites = useCallback((newOrder: string[]) => {
    setSettings(prev => {
      const next = { ...prev, favoriteOrder: newOrder };
      AppStorage.saveSettings(next);
      return next;
    });
  }, []);

  const toggleHidden = useCallback((uuid: string) => {
    setSettings(prev => {
      const isHidden = prev.hiddenChannelUuids.includes(uuid);
      const newHidden = isHidden
        ? prev.hiddenChannelUuids.filter(id => id !== uuid)
        : [...prev.hiddenChannelUuids, uuid];
      const next = { ...prev, hiddenChannelUuids: newHidden };
      AppStorage.saveSettings(next);
      return next;
    });
  }, []);

  // DVR operations
  const recordProgram = useCallback(async (eventId: number | string, configId?: string): Promise<boolean> => {
    const res = await TvhApiService.recordEvent(activeServer, eventId, configId);
    if (res.success) {
      // Refresh recordings
      const updated = await TvhApiService.getDvrEntries(activeServer);
      setDvrEntries(updated);
      return true;
    }
    return false;
  }, [activeServer]);

  const cancelRecording = useCallback(async (id: string): Promise<boolean> => {
    const res = await TvhApiService.cancelDvr(activeServer, id);
    if (res.success) {
      setDvrEntries(prev => prev.filter(e => e.uuid !== id && e.dvrId !== id));
      return true;
    }
    return false;
  }, [activeServer]);

  const stopRecording = useCallback(async (id: string): Promise<boolean> => {
    const res = await TvhApiService.stopDvr(activeServer, id);
    if (res.success) {
      const updated = await TvhApiService.getDvrEntries(activeServer);
      setDvrEntries(updated);
      return true;
    }
    return false;
  }, [activeServer]);

  const deleteRecording = useCallback(async (id: string): Promise<boolean> => {
    const res = await TvhApiService.deleteDvr(activeServer, id);
    if (res.success) {
      setDvrEntries(prev => prev.filter(e => e.uuid !== id && e.dvrId !== id));
      return true;
    }
    return false;
  }, [activeServer]);

  const refreshData = useCallback(async () => {
    await loadServerData(activeServer);
  }, [activeServer, loadServerData]);

  const value = useMemo(() => ({
    servers,
    activeServer,
    settings,
    channels,
    radioChannels,
    tvChannels,
    tags,
    epgMap,
    dvrEntries,
    dvrRules,
    loading,
    error,
    currentChannel,
    currentDvr,
    currentRadio,
    isRadioPlaying,
    playChannel,
    playChannelByUuid,
    playDvr,
    playRadio,
    stopPlayback,
    stopRadio,
    setActiveServerId,
    saveServer,
    removeServer,
    updateSettings,
    toggleFavorite,
    reorderFavorites,
    toggleHidden,
    recordProgram,
    cancelRecording,
    stopRecording,
    deleteRecording,
    refreshData,
  }), [
    servers,
    activeServer,
    settings,
    channels,
    radioChannels,
    tvChannels,
    tags,
    epgMap,
    dvrEntries,
    dvrRules,
    loading,
    error,
    currentChannel,
    currentDvr,
    currentRadio,
    isRadioPlaying,
    playChannel,
    playChannelByUuid,
    playDvr,
    playRadio,
    stopPlayback,
    stopRadio,
    setActiveServerId,
    saveServer,
    removeServer,
    updateSettings,
    toggleFavorite,
    reorderFavorites,
    toggleHidden,
    recordProgram,
    cancelRecording,
    stopRecording,
    deleteRecording,
    refreshData,
  ]);

  return (
    <TvheadendContext.Provider value={value}>
      {children}
    </TvheadendContext.Provider>
  );
};

export const useTvheadend = () => {
  const context = useContext(TvheadendContext);
  if (!context) {
    throw new Error('useTvheadend must be used within a TvheadendProvider');
  }
  return context;
};
