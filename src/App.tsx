import React, { useState, useEffect, useRef } from 'react';
import {
  Tv,
  Radio,
  Calendar,
  Settings,
  Sliders,
  Volume2,
  Subtitles,
  Info,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Play,
  Pause,
  Check,
  CheckCircle2,
  RefreshCw,
  Search,
  Maximize2,
  X,
  ExternalLink,
  Wifi,
  Clock,
  Sparkles
} from 'lucide-react';

interface Channel {
  id: string;
  number: string;
  name: string;
  logo: string;
  currentProgram: string;
  nextProgram: string;
  category: string;
  description: string;
  start: string;
  end: string;
  progress: number;
  audioTracks: string[];
  subtitleTracks: string[];
  streamUrl: string;
}

const SAMPLE_CHANNELS: Channel[] = [
  {
    id: 'ch-1',
    number: '1',
    name: 'La 1 HD',
    logo: '1',
    currentProgram: 'Telediario 2ª Edición',
    nextProgram: 'El Tiempo & Cine de Noche',
    category: 'Noticias',
    description: 'Informativo nocturno con el resumen de la actualidad nacional e internacional, economía y deportes.',
    start: '21:00',
    end: '22:05',
    progress: 65,
    audioTracks: ['Español (Estéreo)', 'V.O. (Original)', 'Audiodescripción'],
    subtitleTracks: ['Desactivados', 'Español DVB', 'Subtítulos para sordos'],
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  },
  {
    id: 'ch-2',
    number: '2',
    name: 'La 2 HD',
    logo: '2',
    currentProgram: 'Grandes Documentales: Serengeti Salvaje',
    nextProgram: 'Página Dos: Cultura y Libros',
    category: 'Documentales',
    description: 'Espectacular recorrido visual por las grandes migraciones de fauna en las llanuras africanas.',
    start: '21:30',
    end: '22:30',
    progress: 40,
    audioTracks: ['Español (5.1)', 'English [eng]'],
    subtitleTracks: ['Desactivados', 'Español DVB'],
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
  },
  {
    id: 'ch-3',
    number: '3',
    name: 'Antena 3 HD',
    logo: 'A3',
    currentProgram: 'El Hormiguero 3.0',
    nextProgram: 'Cine: Misión de Rescate',
    category: 'Entretenimiento',
    description: 'Talk show con entrevistas a invitados internacionales, experimentos científicos de humor y tertulia.',
    start: '21:55',
    end: '23:10',
    progress: 50,
    audioTracks: ['Español (Estéreo)', 'V.O. [qaa]'],
    subtitleTracks: ['Desactivados', 'Español DVB'],
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
  },
  {
    id: 'ch-4',
    number: '4',
    name: 'Cuatro HD',
    logo: 'C4',
    currentProgram: 'First Dates: En busca del amor',
    nextProgram: 'Código 10: Investigación',
    category: 'Entretenimiento',
    description: 'Espacio de citas a ciegas en un restaurante donde comensales buscan su pareja ideal.',
    start: '21:45',
    end: '22:50',
    progress: 30,
    audioTracks: ['Español (Estéreo)'],
    subtitleTracks: ['Desactivados', 'Español'],
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
  },
  {
    id: 'ch-5',
    number: '5',
    name: 'Telecinco HD',
    logo: 'T5',
    currentProgram: 'Supervivientes: Conexión Honduras',
    nextProgram: 'El Debate en Directo',
    category: 'Reality',
    description: 'Gala en directo con las pruebas de recompensa, nominaciones y convivencia de los concursantes.',
    start: '22:00',
    end: '01:30',
    progress: 20,
    audioTracks: ['Español'],
    subtitleTracks: ['Desactivados'],
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
  },
  {
    id: 'ch-6',
    number: '6',
    name: 'laSexta HD',
    logo: '6',
    currentProgram: 'El Intermedio',
    nextProgram: 'laSexta Clave',
    category: 'Actualidad',
    description: 'Repaso irónico a la actualidad informativa con el Gran Wyoming y su equipo de colaboradores.',
    start: '21:30',
    end: '22:40',
    progress: 75,
    audioTracks: ['Español (Estéreo)'],
    subtitleTracks: ['Desactivados', 'Español'],
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4'
  },
  {
    id: 'ch-7',
    number: '7',
    name: '24 Horas HD',
    logo: '24h',
    currentProgram: 'La Noche en 24 Horas',
    nextProgram: 'Boletín Internacional',
    category: 'Noticias',
    description: 'Análisis en profundidad de la actualidad política con mesa de debate y corresponsales.',
    start: '22:00',
    end: '00:00',
    progress: 45,
    audioTracks: ['Español'],
    subtitleTracks: ['Desactivados', 'Español DVB'],
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'tif' | 'home' | 'setup' | 'epg'>('tif');
  const [currentChannelIndex, setCurrentChannelIndex] = useState(0);
  const [showOsd, setShowOsd] = useState(true);
  const [showTracksModal, setShowTracksModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showQuickList, setShowQuickList] = useState(false);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState(0);
  const [selectedSubTrack, setSelectedSubTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState('21:42');
  const [syncProgress, setSyncProgress] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [showRemote, setShowRemote] = useState(true);

  const channel = SAMPLE_CHANNELS[currentChannelIndex];
  const videoRef = useRef<HTMLVideoElement>(null);

  // Clock update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Auto-hide OSD in TV playback
  useEffect(() => {
    if (activeTab === 'tif') {
      setShowOsd(true);
      const timer = setTimeout(() => {
        if (!showTracksModal && !showInfoModal && !showQuickList) {
          setShowOsd(false);
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentChannelIndex, activeTab, showTracksModal, showInfoModal, showQuickList]);

  // Handle Channel Navigation (Zapping)
  const nextChannel = () => {
    setCurrentChannelIndex((prev) => (prev + 1) % SAMPLE_CHANNELS.length);
    setSelectedAudioTrack(0);
    setSelectedSubTrack(0);
    setShowOsd(true);
  };

  const prevChannel = () => {
    setCurrentChannelIndex((prev) => (prev - 1 + SAMPLE_CHANNELS.length) % SAMPLE_CHANNELS.length);
    setSelectedAudioTrack(0);
    setSelectedSubTrack(0);
    setShowOsd(true);
  };

  // Keyboard navigation for Android TV remote simulation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        prevChannel();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        nextChannel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        setShowOsd((prev) => !prev);
      } else if (e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setShowInfoModal((prev) => !prev);
      } else if (e.key.toLowerCase() === 'g') {
        e.preventDefault();
        setActiveTab((prev) => (prev === 'epg' ? 'tif' : 'epg'));
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowTracksModal(false);
        setShowInfoModal(false);
        setShowQuickList(false);
        if (activeTab !== 'tif') setActiveTab('tif');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  // Run TIF sync simulation
  const startTifSync = () => {
    setIsSyncing(true);
    setSyncProgress(10);
    setSyncDone(false);

    const step1 = setTimeout(() => setSyncProgress(40), 600);
    const step2 = setTimeout(() => setSyncProgress(75), 1200);
    const step3 = setTimeout(() => {
      setSyncProgress(100);
      setIsSyncing(false);
      setSyncDone(true);
    }, 1800);

    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
    };
  };

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-hidden">
      {/* Top Android TV OS Simulation Bar */}
      <nav className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-40 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-semibold text-slate-200">Android TV 14</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('tif')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                activeTab === 'tif'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Live Channels (TIF)</span>
            </button>
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                activeTab === 'home'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>TV Launcher</span>
            </button>
            <button
              onClick={() => setActiveTab('epg')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                activeTab === 'epg'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Guía EPG</span>
            </button>
            <button
              onClick={() => setActiveTab('setup')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                activeTab === 'setup'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Setup Activity</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-800/60 px-2.5 py-1 rounded-md">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tvheadend: 192.168.1.100:9981</span>
          </div>
          <button
            onClick={() => setShowRemote(!showRemote)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border flex items-center gap-1.5 transition ${
              showRemote
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Mando D-Pad</span>
          </button>
          <div className="text-xs font-mono font-bold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
            {currentTime}
          </div>
        </div>
      </nav>

      {/* Main View Area */}
      <div className="flex-1 relative bg-black overflow-hidden flex items-center justify-center">
        {/* 1. LIVE CHANNELS VIEW (TIF Overlay Simulator) */}
        {activeTab === 'tif' && (
          <div className="relative w-full h-full bg-black flex items-center justify-center">
            {/* Background Stream Video */}
            <video
              ref={videoRef}
              src={channel.streamUrl}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Video overlay vignette */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-auto"
              onClick={() => setShowOsd(!showOsd)}
            />

            {/* Top Right Channel Badge (Android TV style) */}
            <div className="absolute top-6 right-8 flex items-center gap-3 z-20">
              <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                <span className="text-xs font-bold text-sky-400">1080p HD</span>
                <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded font-mono font-semibold">
                  50 FPS
                </span>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded font-semibold">
                  libVLC
                </span>
              </div>
            </div>

            {/* NATIVE ANDROID TV LIVE CHANNELS OSD (Zap Bar) */}
            {showOsd && (
              <div className="absolute bottom-6 left-8 right-8 z-30 transition-all duration-300 transform translate-y-0">
                <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-5 shadow-2xl shadow-black/80 text-white">
                  <div className="flex items-start justify-between gap-6">
                    {/* Left: Channel Number & Icon */}
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-sky-600 to-indigo-700 flex flex-col items-center justify-center font-bold shadow-lg border border-white/20">
                        <span className="text-xl font-black text-white">{channel.number}</span>
                        <span className="text-[10px] text-sky-200 tracking-wider font-mono">DVB-T</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold text-white tracking-tight">{channel.name}</h2>
                          <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full font-medium">
                            {channel.category}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-sky-400 mt-1 flex items-center gap-2">
                          {channel.currentProgram}
                        </h3>
                        <p className="text-xs text-slate-300 line-clamp-1 mt-0.5 max-w-xl">
                          {channel.description}
                        </p>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowTracksModal(true);
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-xs font-medium flex items-center gap-1.5 transition text-slate-200"
                        title="Seleccionar Pistas de Audio y Subtítulos"
                      >
                        <Volume2 className="w-4 h-4 text-sky-400" />
                        <span>Pistas</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowInfoModal(true);
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-xs font-medium flex items-center gap-1.5 transition text-slate-200"
                        title="Detalles del programa"
                      >
                        <Info className="w-4 h-4 text-sky-400" />
                        <span>Info</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowQuickList(!showQuickList);
                        }}
                        className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-sky-600/30 transition"
                      >
                        <Tv className="w-4 h-4" />
                        <span>Canales</span>
                      </button>
                    </div>
                  </div>

                  {/* Progress Timeline Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-3 text-xs text-slate-400">
                    <span className="font-mono text-[11px] text-slate-300">{channel.start}</span>
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full"
                        style={{ width: `${channel.progress}%` }}
                      />
                    </div>
                    <span className="font-mono text-[11px] text-slate-400">{channel.end}</span>
                    <span className="text-[11px] text-slate-500 ml-2">A continuación:</span>
                    <span className="text-[11px] text-slate-300 font-medium">{channel.nextProgram}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Channel Drawer */}
            {showQuickList && (
              <div className="absolute right-8 bottom-32 top-16 w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl p-4 shadow-2xl z-40 overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <Tv className="w-4 h-4 text-sky-400" /> Lista de Canales TIF
                  </span>
                  <button
                    onClick={() => setShowQuickList(false)}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-1.5">
                  {SAMPLE_CHANNELS.map((ch, idx) => (
                    <button
                      key={ch.id}
                      onClick={() => {
                        setCurrentChannelIndex(idx);
                        setShowQuickList(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between ${
                        idx === currentChannelIndex
                          ? 'bg-sky-600/30 border border-sky-500/50 text-white'
                          : 'hover:bg-slate-800/80 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-xs w-5 text-sky-400">{ch.number}</span>
                        <div>
                          <div className="text-xs font-semibold text-white">{ch.name}</div>
                          <div className="text-[10px] text-slate-400 line-clamp-1">{ch.currentProgram}</div>
                        </div>
                      </div>
                      {idx === currentChannelIndex && (
                        <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Audio & Subtitle Track Selection Modal (Native Android TV Style) */}
            {showTracksModal && (
              <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setShowTracksModal(false)}
              >
                <div
                  className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Volume2 className="w-5 h-5 text-sky-400" /> Pistas de Audio y Subtítulos
                    </h3>
                    <button
                      onClick={() => setShowTracksModal(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Audio Tracks */}
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                      Pista de Audio (libVLC)
                    </label>
                    <div className="space-y-1.5">
                      {channel.audioTracks.map((audio, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedAudioTrack(idx)}
                          className={`w-full p-2.5 rounded-xl text-xs font-medium text-left flex items-center justify-between transition ${
                            selectedAudioTrack === idx
                              ? 'bg-sky-600 text-white font-semibold'
                              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <span>{audio}</span>
                          {selectedAudioTrack === idx && <Check className="w-4 h-4 text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subtitle Tracks */}
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                      Subtítulos (DVB / Teletexto)
                    </label>
                    <div className="space-y-1.5">
                      {channel.subtitleTracks.map((sub, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedSubTrack(idx)}
                          className={`w-full p-2.5 rounded-xl text-xs font-medium text-left flex items-center justify-between transition ${
                            selectedSubTrack === idx
                              ? 'bg-sky-600 text-white font-semibold'
                              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <span>{sub}</span>
                          {selectedSubTrack === idx && <Check className="w-4 h-4 text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setShowTracksModal(false)}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
                  >
                    Aceptar
                  </button>
                </div>
              </div>
            )}

            {/* Info / Synopsis Modal */}
            {showInfoModal && (
              <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setShowInfoModal(false)}
              >
                <div
                  className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-sky-600 font-bold flex items-center justify-center text-sm text-white">
                        {channel.number}
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-white">{channel.name}</h3>
                        <span className="text-xs text-sky-400 font-medium">{channel.category}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowInfoModal(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-white mb-1">{channel.currentProgram}</h4>
                    <div className="text-xs text-slate-400 mb-3 flex items-center gap-3">
                      <span className="font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        {channel.start} - {channel.end}
                      </span>
                      <span>Audio: Estéreo / 5.1</span>
                      <span>Subtítulos: DVB</span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                      {channel.description}
                    </p>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setShowInfoModal(false)}
                      className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white shadow-lg shadow-sky-600/30 transition"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. ANDROID TV LAUNCHER (HOME SCREEN) */}
        {activeTab === 'home' && (
          <div className="w-full h-full bg-slate-950 p-8 overflow-y-auto space-y-8 flex flex-col justify-start">
            {/* Top Row: Google TV / Leanback Search & Clock */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 border border-slate-700">
                  <Search className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-4 text-sm font-semibold text-slate-400">
                  <span className="text-white border-b-2 border-sky-400 pb-1">Para ti</span>
                  <span className="hover:text-slate-200 cursor-pointer">En directo</span>
                  <span className="hover:text-slate-200 cursor-pointer">Películas</span>
                  <span className="hover:text-slate-200 cursor-pointer">Aplicaciones</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <Wifi className="w-4 h-4 text-emerald-400" />
                <span className="font-mono text-white text-sm">{currentTime}</span>
              </div>
            </div>

            {/* Featured App Banner: Headent Client */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 border border-slate-800 shadow-2xl p-8 flex items-center justify-between">
              <div className="max-w-xl space-y-4 z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold">
                  <Tv className="w-3.5 h-3.5" /> Proveedor Oficial Live Channels
                </div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Headent Client</h1>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Sintoniza tus canales de Tvheadend directamente en la interfaz nativa de Android TV con la guía del sistema, cambio ultra-rápido de canales y motor libVLC.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab('tif')}
                    className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-500/30 transition transform hover:scale-105"
                  >
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>Ver Televisión en Directo</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('setup')}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition"
                  >
                    Ajustes de Sincronización
                  </button>
                </div>
              </div>

              {/* Official TV Banner Graphic */}
              <div className="hidden lg:block w-96 h-48 rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl shadow-sky-500/10">
                <img
                  src="/banner.png"
                  alt="Headent Banner"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Row: Canales en directo (Live Channels Row) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Tv className="w-4 h-4 text-sky-400" /> Canales de Tvheadend Disponibles
                </h2>
                <span className="text-xs text-slate-500">{SAMPLE_CHANNELS.length} canales sintonizados</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {SAMPLE_CHANNELS.map((ch, idx) => (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setCurrentChannelIndex(idx);
                      setActiveTab('tif');
                    }}
                    className="group bg-slate-900 border border-slate-800 hover:border-sky-500/80 rounded-2xl p-4 text-left transition transform hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-500/10 flex flex-col justify-between h-36"
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-7 h-7 rounded-lg bg-sky-600/30 border border-sky-500/40 text-sky-300 font-bold text-xs flex items-center justify-center font-mono">
                        {ch.number}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                        {ch.category}
                      </span>
                    </div>

                    <div>
                      <div className="font-bold text-white text-sm group-hover:text-sky-300 transition truncate">
                        {ch.name}
                      </div>
                      <div className="text-xs text-slate-400 truncate mt-0.5">
                        {ch.currentProgram}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. SETUP ACTIVITY VIEW (Jetpack Compose Native Setup) */}
        {activeTab === 'setup' && (
          <div className="w-full h-full bg-slate-950 p-8 flex items-center justify-center">
            <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
              <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
                <div className="w-14 h-14 rounded-2xl bg-sky-600 flex items-center justify-center shadow-lg shadow-sky-600/30">
                  <Tv className="w-7 h-7 text-white" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-sky-400 bg-sky-950 px-2.5 py-0.5 rounded-full border border-sky-800/60">
                    TvInputSetupActivity
                  </span>
                  <h2 className="text-xl font-bold text-white mt-1">Configuración de Canales Tvheadend</h2>
                  <p className="text-xs text-slate-400">Integración con Live Channels de Android TV (TIF)</p>
                </div>
              </div>

              {/* Server Info Box */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Servidor Activo:</span>
                  <span className="font-semibold text-white">Tvheadend Casa</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Dirección Host:</span>
                  <span className="font-mono text-sky-300">192.168.1.100:9981</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Perfil de Reproducción:</span>
                  <span className="font-mono text-emerald-400">pass (Transmisión Directa)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Base de Datos Destino:</span>
                  <span className="font-mono text-indigo-300">android.media.tv.TvContract</span>
                </div>
              </div>

              {/* Sync Action Area */}
              <div className="space-y-4">
                {isSyncing && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>Descargando canales y guía EPG (24h)...</span>
                      <span className="font-mono font-bold text-sky-400">{syncProgress}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-300 rounded-full"
                        style={{ width: `${syncProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {syncDone && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div className="text-xs text-emerald-200">
                      <strong className="block text-emerald-300">Sincronización completada con éxito</strong>
                      Se insertaron 7 canales y 84 programas EPG en la base de datos de Android TV.
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={startTifSync}
                    disabled={isSyncing}
                    className="flex-1 py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-600/30 transition"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Sincronizando...' : 'Iniciar Sincronización TIF'}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('tif')}
                    className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
                  >
                    Abrir Reproductor
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. EPG TV GUIDE VIEW */}
        {activeTab === 'epg' && (
          <div className="w-full h-full bg-slate-950 p-6 flex flex-col space-y-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-shrink-0">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-sky-400" />
                <h2 className="text-base font-bold text-white">Guía de Programación EPG (TvContract)</h2>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-3">
                <span className="font-mono text-white bg-slate-800 px-2 py-1 rounded">Hoy, 21:00 - 00:00</span>
              </div>
            </div>

            {/* EPG Timeline Grid */}
            <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-2xl overflow-y-auto p-4 space-y-3">
              {SAMPLE_CHANNELS.map((ch, idx) => (
                <div
                  key={ch.id}
                  className="flex items-stretch gap-3 bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 hover:border-slate-700 transition"
                >
                  {/* Channel Header */}
                  <div
                    onClick={() => {
                      setCurrentChannelIndex(idx);
                      setActiveTab('tif');
                    }}
                    className="w-44 flex-shrink-0 flex items-center gap-3 cursor-pointer group pr-3 border-r border-slate-800"
                  >
                    <span className="w-7 h-7 rounded-lg bg-sky-600/20 text-sky-400 border border-sky-500/30 font-bold text-xs flex items-center justify-center font-mono">
                      {ch.number}
                    </span>
                    <span className="font-bold text-xs text-white group-hover:text-sky-400 transition truncate">
                      {ch.name}
                    </span>
                  </div>

                  {/* Current Program Box */}
                  <div
                    onClick={() => {
                      setCurrentChannelIndex(idx);
                      setActiveTab('tif');
                    }}
                    className="flex-1 bg-sky-950/30 border border-sky-800/40 hover:border-sky-500/60 rounded-lg p-2.5 cursor-pointer transition flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white truncate">{ch.currentProgram}</span>
                      <span className="text-[10px] font-mono text-sky-400 bg-sky-900/60 px-1.5 py-0.5 rounded">
                        {ch.start} - {ch.end}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{ch.description}</p>
                  </div>

                  {/* Next Program Box */}
                  <div className="w-64 flex-shrink-0 bg-slate-950/40 border border-slate-800/60 rounded-lg p-2.5 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">A continuación</span>
                    <span className="text-xs font-medium text-slate-300 truncate">{ch.nextProgram}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FLOATING VIRTUAL ANDROID TV REMOTE CONTROL (D-PAD) */}
      {showRemote && (
        <div className="absolute right-6 bottom-6 z-50 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-4 shadow-2xl shadow-black/90 w-52 flex flex-col items-center space-y-4">
          <div className="flex items-center justify-between w-full border-b border-slate-800 pb-2">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-sky-400" /> Mando Android TV
            </span>
            <button onClick={() => setShowRemote(false)} className="text-slate-500 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* D-Pad Buttons */}
          <div className="relative w-36 h-36 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center shadow-inner">
            {/* UP */}
            <button
              onClick={prevChannel}
              className="absolute top-1 w-10 h-9 flex items-center justify-center text-slate-300 hover:text-white active:scale-95 transition"
              title="Canal Anterior (CH+)"
            >
              <ChevronUp className="w-5 h-5" />
            </button>

            {/* DOWN */}
            <button
              onClick={nextChannel}
              className="absolute bottom-1 w-10 h-9 flex items-center justify-center text-slate-300 hover:text-white active:scale-95 transition"
              title="Canal Siguiente (CH-)"
            >
              <ChevronDown className="w-5 h-5" />
            </button>

            {/* LEFT */}
            <button
              onClick={() => setShowQuickList(true)}
              className="absolute left-1 w-9 h-10 flex items-center justify-center text-slate-300 hover:text-white active:scale-95 transition"
              title="Lista de Canales"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* RIGHT */}
            <button
              onClick={() => setShowTracksModal(true)}
              className="absolute right-1 w-9 h-10 flex items-center justify-center text-slate-300 hover:text-white active:scale-95 transition"
              title="Pistas de Audio"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* CENTER / OK */}
            <button
              onClick={() => setShowOsd((prev) => !prev)}
              className="w-14 h-14 rounded-full bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-black text-xs shadow-md shadow-sky-600/40 flex items-center justify-center transition"
              title="OK / Abrir OSD"
            >
              OK
            </button>
          </div>

          {/* Action Row */}
          <div className="grid grid-cols-3 gap-2 w-full pt-1">
            <button
              onClick={() => {
                setShowTracksModal(false);
                setShowInfoModal(false);
                setShowQuickList(false);
                if (activeTab !== 'tif') setActiveTab('tif');
                else setShowOsd(false);
              }}
              className="py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-300 transition"
              title="Atrás / Back"
            >
              Back
            </button>
            <button
              onClick={() => setActiveTab('home')}
              className="py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-300 transition"
              title="Inicio / Home"
            >
              Home
            </button>
            <button
              onClick={() => setShowInfoModal(true)}
              className="py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-300 transition"
              title="Información"
            >
              Info
            </button>
          </div>

          {/* Color Keys */}
          <div className="flex items-center justify-between w-full pt-1 px-1">
            <button
              onClick={() => setActiveTab('tif')}
              className="w-7 h-4 rounded-full bg-red-500/80 hover:bg-red-500 transition shadow-sm"
              title="Rojo: Canales TV"
            />
            <button
              onClick={() => setActiveTab('epg')}
              className="w-7 h-4 rounded-full bg-emerald-500/80 hover:bg-emerald-500 transition shadow-sm"
              title="Verde: Guía EPG"
            />
            <button
              onClick={() => setShowTracksModal(true)}
              className="w-7 h-4 rounded-full bg-amber-500/80 hover:bg-amber-500 transition shadow-sm"
              title="Amarillo: Pistas Audio"
            />
            <button
              onClick={() => setActiveTab('setup')}
              className="w-7 h-4 rounded-full bg-sky-500/80 hover:bg-sky-500 transition shadow-sm"
              title="Azul: Setup TIF"
            />
          </div>
        </div>
      )}
    </div>
  );
}
