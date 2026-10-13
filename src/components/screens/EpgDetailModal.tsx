import React, { useState } from 'react';
import { EpgEvent, Channel } from '../../types';
import { useTvheadend } from '../../context/TvheadendContext';
import { X, Play, Disc3, Clock, Tag, ShieldAlert, CheckCircle2, Ban } from 'lucide-react';
import { PiconImage } from '../common/PiconImage';

interface EpgDetailModalProps {
  event: EpgEvent;
  channel?: Channel;
  onClose: () => void;
}

export const EpgDetailModal: React.FC<EpgDetailModalProps> = ({ event, channel, onClose }) => {
  const { playChannel, recordProgram, cancelRecording, stopRecording, dvrEntries } = useTvheadend();
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Check if this event or matching time/channel is currently recorded or scheduled
  const matchingDvr = dvrEntries.find(d => {
    if (channel && d.channelUuid === channel.uuid) {
      return (d.start <= event.start && event.stop <= d.stop) || d.dispTitle.toLowerCase() === event.title.toLowerCase();
    }
    return false;
  });

  const isRecordingNow = matchingDvr?.status === 'recording' || matchingDvr?.schedStatus === 'recording';
  const isScheduled = matchingDvr?.status === 'scheduled' || matchingDvr?.schedStatus === 'scheduled';

  const formatTime = (ts: number) => {
    return new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDate = (ts: number) => {
    return new Date(ts * 1000).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const durationMin = Math.round((event.stop - event.start) / 60);

  const handleRecord = async () => {
    setSubmitting(true);
    const ok = await recordProgram(event.eventId || event.title);
    setSubmitting(false);
    if (ok) {
      setFeedback('Recording scheduled successfully!');
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleCancel = async () => {
    if (!matchingDvr) return;
    setSubmitting(true);
    await cancelRecording(matchingDvr.uuid);
    setSubmitting(false);
    setFeedback('Recording cancelled.');
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleStop = async () => {
    if (!matchingDvr) return;
    setSubmitting(true);
    await stopRecording(matchingDvr.uuid);
    setSubmitting(false);
    setFeedback('Recording stopped and saved to archive.');
    setTimeout(() => setFeedback(null), 3000);
  };

  const getGenreLabel = (genreCode?: number) => {
    if (!genreCode) return null;
    const top = Math.floor(genreCode / 16);
    switch (top) {
      case 1: return 'Movie / Drama';
      case 2: return 'News / Current Affairs';
      case 3: return 'Show / Game Show';
      case 4: return 'Sports';
      case 5: return 'Children / Youth';
      case 6: return 'Music / Dance';
      case 7: return 'Arts / Culture';
      case 8: return 'Social / Political';
      case 9: return 'Science / Education';
      default: return 'General Programme';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800/80 hover:bg-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content Header */}
        <div className="flex items-start gap-4 pb-4 border-b border-slate-800 shrink-0">
          {channel && (
            <PiconImage
              src={channel.iconPublicUrl}
              alt={channel.name}
              fallbackText={channel.name}
              className="w-14 h-14"
            />
          )}
          <div className="min-w-0 flex-1 pr-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-teal-400">
                {channel?.name || event.channelName}
              </span>
              {channel?.number && (
                <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                  CH {channel.number}
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-white mt-0.5">{event.title}</h2>
            {event.subtitle && (
              <p className="text-sm font-semibold text-teal-300 mt-0.5">{event.subtitle}</p>
            )}
          </div>
        </div>

        {/* Details & Badges */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1">
          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span>{formatDate(event.start)} • {formatTime(event.start)} - {formatTime(event.stop)} ({durationMin} min)</span>
            </span>

            {event.genre && event.genre[0] && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-950/60 text-teal-300 text-xs font-medium border border-teal-500/30">
                <Tag className="w-3 h-3 text-teal-400" />
                <span>{getGenreLabel(event.genre[0])}</span>
              </span>
            )}

            {event.ageRating !== undefined && event.ageRating > 0 && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-950/60 text-amber-300 text-xs font-medium border border-amber-500/30">
                <ShieldAlert className="w-3 h-3 text-amber-400" />
                <span>{event.ageRating}+</span>
              </span>
            )}

            {event.episodeOnscreen && (
              <span className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700">
                {event.episodeOnscreen}
              </span>
            )}
          </div>

          {/* Description */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Programme Synopsis</h4>
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
              {event.description || event.summary || 'No detailed synopsis available for this broadcast.'}
            </p>
          </div>

          {/* Series Link Info */}
          {event.serieslinkUri && (
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="font-semibold text-slate-300">Series Link:</span>
              <span className="font-mono text-teal-400 truncate">{event.serieslinkUri}</span>
            </div>
          )}

          {/* Feedback message */}
          {feedback && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-teal-950/80 border border-teal-500/50 text-teal-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>{feedback}</span>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {channel && (
              <button
                onClick={() => {
                  playChannel(channel);
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Tune Channel</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isRecordingNow ? (
              <button
                onClick={handleStop}
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition active:scale-95 disabled:opacity-50"
              >
                <Ban className="w-4 h-4" />
                <span>Stop Recording</span>
              </button>
            ) : isScheduled ? (
              <button
                onClick={handleCancel}
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition active:scale-95 disabled:opacity-50"
              >
                <Ban className="w-4 h-4" />
                <span>Cancel Recording</span>
              </button>
            ) : (
              <button
                onClick={handleRecord}
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-red-400 font-bold text-xs border border-red-500/30 transition active:scale-95 disabled:opacity-50"
              >
                <Disc3 className="w-4 h-4" />
                <span>Record Programme</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
