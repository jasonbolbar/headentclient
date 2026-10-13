import React, { useState } from 'react';
import {
  Gamepad2,
  X,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  Home,
  RotateCcw,
  Volume2,
  VolumeX,
  CalendarDays,
  Info
} from 'lucide-react';

export const VirtualRemote: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const sendKey = (key: string, code?: string) => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key, code: code || key, bubbles: true }));
    setTimeout(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { key, code: code || key, bubbles: true }));
    }, 100);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-teal-400 border border-teal-500/40 shadow-2xl backdrop-blur-md transition active:scale-95 group"
        title="Mando a distancia virtual de Android TV"
      >
        <Gamepad2 className="w-5 h-5 group-hover:rotate-12 transition" />
        <span className="text-xs font-bold text-white hidden sm:inline">Mando Android TV</span>
      </button>

      {/* Virtual Remote Control Floating Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-72 bg-slate-950/95 border-2 border-slate-700/80 rounded-3xl p-5 shadow-2xl backdrop-blur-xl flex flex-col items-center select-none animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-xs font-bold tracking-wider text-slate-200 uppercase">Control Remoto TV</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* D-Pad Controller */}
          <div className="my-5 relative w-44 h-44 bg-slate-900 border border-slate-700/80 rounded-full shadow-inner flex items-center justify-center p-2">
            {/* Up */}
            <button
              onClick={() => sendKey('ArrowUp')}
              className="absolute top-2 w-12 h-10 flex items-center justify-center text-slate-300 hover:text-teal-400 active:scale-90 transition rounded-t-xl hover:bg-slate-800/80"
              title="Arriba / Canal +"
            >
              <ChevronUp className="w-6 h-6" />
            </button>

            {/* Down */}
            <button
              onClick={() => sendKey('ArrowDown')}
              className="absolute bottom-2 w-12 h-10 flex items-center justify-center text-slate-300 hover:text-teal-400 active:scale-90 transition rounded-b-xl hover:bg-slate-800/80"
              title="Abajo / Canal -"
            >
              <ChevronDown className="w-6 h-6" />
            </button>

            {/* Left */}
            <button
              onClick={() => sendKey('ArrowLeft')}
              className="absolute left-2 w-10 h-12 flex items-center justify-center text-slate-300 hover:text-teal-400 active:scale-90 transition rounded-l-xl hover:bg-slate-800/80"
              title="Izquierda / Retroceso"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Right */}
            <button
              onClick={() => sendKey('ArrowRight')}
              className="absolute right-2 w-10 h-12 flex items-center justify-center text-slate-300 hover:text-teal-400 active:scale-90 transition rounded-r-xl hover:bg-slate-800/80"
              title="Derecha / Avance"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* OK / Center Button */}
            <button
              onClick={() => sendKey('Enter')}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 active:scale-90 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center transition"
              title="Botón OK / Seleccionar"
            >
              OK
            </button>
          </div>

          {/* Action Row: Back, Guide, Info */}
          <div className="w-full grid grid-cols-3 gap-2 mb-4">
            <button
              onClick={() => sendKey('Escape')}
              className="py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white flex flex-col items-center gap-1 border border-slate-700/60 active:scale-95 transition"
              title="Atrás (Back / Esc)"
            >
              <RotateCcw className="w-4 h-4 text-slate-400" />
              <span className="text-[10px] font-semibold">Atrás</span>
            </button>

            <button
              onClick={() => sendKey('g', 'KeyG')}
              className="py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-teal-300 hover:text-teal-200 flex flex-col items-center gap-1 border border-slate-700/60 active:scale-95 transition"
              title="Guía TV / EPG (G)"
            >
              <CalendarDays className="w-4 h-4 text-teal-400" />
              <span className="text-[10px] font-semibold">Guía</span>
            </button>

            <button
              onClick={() => sendKey('i', 'KeyI')}
              className="py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white flex flex-col items-center gap-1 border border-slate-700/60 active:scale-95 transition"
              title="Información (Info / I)"
            >
              <Info className="w-4 h-4 text-blue-400" />
              <span className="text-[10px] font-semibold">Info</span>
            </button>
          </div>

          {/* Botones de Colores del Mando a Distancia (Fastext / Secciones) */}
          <div className="w-full space-y-1.5 mb-4">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
              Botones de Color
            </div>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => sendKey('1')}
                className="py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow transition active:scale-95 flex flex-col items-center"
                title="Rojo: Canales de TV (1)"
              >
                <span>Rojo</span>
                <span className="text-[9px] opacity-80">TV</span>
              </button>
              <button
                onClick={() => sendKey('2')}
                className="py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition active:scale-95 flex flex-col items-center"
                title="Verde: Radio (2)"
              >
                <span>Verde</span>
                <span className="text-[9px] opacity-80">Radio</span>
              </button>
              <button
                onClick={() => sendKey('3')}
                className="py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold text-xs shadow transition active:scale-95 flex flex-col items-center"
                title="Amarillo: Grabaciones DVR (3)"
              >
                <span>Amar.</span>
                <span className="text-[9px] opacity-80">DVR</span>
              </button>
              <button
                onClick={() => sendKey('4')}
                className="py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition active:scale-95 flex flex-col items-center"
                title="Azul: Ajustes (4)"
              >
                <span>Azul</span>
                <span className="text-[9px] opacity-80">Ajustes</span>
              </button>
            </div>
          </div>

          {/* Teclado Numérico para Zapping Directo */}
          <div className="w-full">
            <div className="grid grid-cols-3 gap-1.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map(num => (
                <button
                  key={num}
                  onClick={() => sendKey(num)}
                  className={`py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 font-mono font-bold text-xs border border-slate-800 active:scale-90 transition ${
                    num === '0' ? 'col-start-2' : ''
                  }`}
                  title={`Canal ${num}`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
