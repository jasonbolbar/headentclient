import React, { useState } from 'react';
import { Tv } from 'lucide-react';

interface PiconImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackText?: string;
}

export const PiconImage: React.FC<PiconImageProps> = ({ src, alt, className = 'w-10 h-10', fallbackText }) => {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className={`flex items-center justify-center bg-slate-800 border border-slate-700/60 rounded-lg text-slate-300 font-bold text-xs uppercase tracking-wider shrink-0 ${className}`}>
        {fallbackText ? (
          <span>{fallbackText.slice(0, 3)}</span>
        ) : (
          <Tv className="w-4 h-4 text-slate-400" />
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-lg bg-slate-900 border border-slate-700/50 flex items-center justify-center shrink-0 ${className}`}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-contain p-1"
        onError={() => setError(true)}
        loading="lazy"
      />
    </div>
  );
};
