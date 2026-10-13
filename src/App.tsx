import React, { useState, useEffect } from 'react';
import { TvheadendProvider, useTvheadend } from './context/TvheadendContext';
import { NavTab, BottomNav } from './components/layout/BottomNav';
import { TopBar } from './components/layout/TopBar';
import { TvTopClock } from './components/layout/TvTopClock';
import { MiniRadioBar } from './components/layout/MiniRadioBar';
import { TvHomeScreen } from './components/screens/TvHomeScreen';
import { ChannelsScreen } from './components/screens/ChannelsScreen';
import { RadioScreen } from './components/screens/RadioScreen';
import { EpgGridScreen } from './components/screens/EpgGridScreen';
import { DvrScreen } from './components/screens/DvrScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { PlayerScreen } from './components/screens/PlayerScreen';
import { PinModal } from './components/common/PinModal';
import { VirtualRemote } from './components/layout/VirtualRemote';
import { LiveChannelsPreviewModal } from './components/screens/LiveChannelsPreviewModal';

const AppContent: React.FC = () => {
  const {
    settings,
    currentChannel,
    currentDvr,
    stopPlayback,
    playChannelByUuid,
  } = useTvheadend();

  // Active view: 'home' | 'channels' | 'radio' | 'epg' | 'dvr' | 'settings'
  const [currentSection, setCurrentSection] = useState<'home' | 'channels' | 'radio' | 'epg' | 'dvr' | 'settings'>(
    settings.uiMode === 'tv' ? 'home' : 'channels'
  );

  // Parental lock modal
  const [pinTarget, setPinTarget] = useState<'settings' | 'channel' | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Live Channels (TIF) simulation modal
  const [showLiveChannelsPreview, setShowLiveChannelsPreview] = useState(false);

  // TV Remote & keyboard shortcut bridge
  useEffect(() => {
    const handleRemoteKeys = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      // Red key (1): Channels
      if (e.key === '1' || e.code === 'KeyR') {
        setCurrentSection('channels');
      }
      // Green key (2): Radio
      else if (e.key === '2' || e.code === 'KeyG' && e.ctrlKey) {
        setCurrentSection('radio');
      }
      // Yellow key (3): Archive
      else if (e.key === '3' || e.code === 'KeyY') {
        setCurrentSection('dvr');
      }
      // Blue key (4): Settings
      else if (e.key === '4' || e.code === 'KeyB') {
        handleNavToSettings();
      }
      // Guide key (G)
      else if (e.key === 'g' || e.key === 'G') {
        setCurrentSection('epg');
      }
    };

    window.addEventListener('keydown', handleRemoteKeys);
    return () => window.removeEventListener('keydown', handleRemoteKeys);
  }, [settings]);

  const handleNavToSettings = () => {
    if (settings.parentalLockEnabled && (settings.parentalScope === 'settings' || settings.parentalScope === 'both')) {
      setPinTarget('settings');
      setPendingAction(() => () => setCurrentSection('settings'));
    } else {
      setCurrentSection('settings');
    }
  };

  const handleNavToTab = (tab: NavTab) => {
    if (tab === 'settings') {
      handleNavToSettings();
    } else {
      setCurrentSection(tab);
    }
  };

  return (
    <div className={`w-full h-screen flex flex-col overflow-hidden ${settings.colorMode === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-[#0B1220] text-white'}`}>
      {/* Top Header / TV Clock */}
      {settings.uiMode === 'tv' ? (
        <TvTopClock onOpenLiveChannelsPreview={() => setShowLiveChannelsPreview(true)} />
      ) : (
        <TopBar
          onOpenEpg={() => setCurrentSection('epg')}
          onOpenLiveChannelsPreview={() => setShowLiveChannelsPreview(true)}
          title={
            currentSection === 'channels' ? 'TV Channels' :
            currentSection === 'radio' ? 'Radio Stations' :
            currentSection === 'epg' ? 'TV Guide (EPG)' :
            currentSection === 'dvr' ? 'Recordings Archive' :
            currentSection === 'settings' ? 'Settings' : 'Headent Client'
          }
        />
      )}

      {/* Main Screen Body */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        {currentSection === 'home' && (
          <TvHomeScreen
            onNavigate={sec => setCurrentSection(sec)}
            onOpenChannel={uuid => playChannelByUuid(uuid)}
          />
        )}

        {currentSection === 'channels' && (
          <ChannelsScreen
            onOpenEpgForChannel={() => setCurrentSection('epg')}
          />
        )}

        {currentSection === 'radio' && (
          <RadioScreen />
        )}

        {currentSection === 'epg' && (
          <EpgGridScreen />
        )}

        {currentSection === 'dvr' && (
          <DvrScreen />
        )}

        {currentSection === 'settings' && (
          <SettingsScreen />
        )}
      </main>

      {/* Mini Radio Persistent Bar */}
      <MiniRadioBar />

      {/* Bottom Navigation for Phone Mode or Back Button for TV subpages */}
      {settings.uiMode === 'phone' ? (
        <BottomNav
          currentTab={currentSection === 'epg' ? 'channels' : (currentSection as NavTab)}
          onSelectTab={handleNavToTab}
          showHomeTab={settings.theme === 'modern'}
        />
      ) : currentSection !== 'home' ? (
        <div className="bg-slate-950/90 border-t border-slate-800/80 px-6 py-2 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <button
            onClick={() => setCurrentSection('home')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
          >
            <span>‹ Back to Home Launcher</span>
          </button>
          <div className="hidden sm:flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5"><strong className="text-white">Red:</strong> Channels</span>
            <span className="flex items-center gap-1.5"><strong className="text-white">Green:</strong> Radio</span>
            <span className="flex items-center gap-1.5"><strong className="text-white">Yellow:</strong> Archive</span>
            <span className="flex items-center gap-1.5"><strong className="text-white">Blue:</strong> Settings</span>
            <span className="flex items-center gap-1.5"><strong className="text-teal-400">G:</strong> TV Guide</span>
          </div>
        </div>
      ) : null}

      {/* Video Player Modal (Active Live or DVR stream) */}
      {(currentChannel || currentDvr) && (
        <PlayerScreen
          channel={currentChannel}
          dvr={currentDvr}
          onClose={stopPlayback}
          onOpenEpg={() => {
            stopPlayback();
            setCurrentSection('epg');
          }}
        />
      )}

      {/* Parental Lock PIN prompt */}
      {pinTarget && (
        <PinModal
          title={pinTarget === 'settings' ? 'Unlock Settings' : 'Locked Channel'}
          correctPin={settings.parentalPin}
          onSuccess={() => {
            setPinTarget(null);
            if (pendingAction) {
              pendingAction();
              setPendingAction(null);
            }
          }}
          onClose={() => {
            setPinTarget(null);
            setPendingAction(null);
          }}
        />
      )}
      {/* Virtual Android TV Remote Control */}
      <VirtualRemote />

      {/* Live Channels (TIF) Native Android TV Simulation View */}
      {showLiveChannelsPreview && (
        <LiveChannelsPreviewModal onClose={() => setShowLiveChannelsPreview(false)} />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <TvheadendProvider>
      <AppContent />
    </TvheadendProvider>
  );
};

export default App;
