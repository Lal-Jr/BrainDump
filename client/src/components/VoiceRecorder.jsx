import { useState, useRef, useEffect } from 'react';

export default function VoiceRecorder({ onRecordingComplete, disabled }) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      mediaRecorder.current = new MediaRecorder(stream, { mimeType });
      chunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(t => t.stop());
        onRecordingComplete?.(blob);
      };

      mediaRecorder.current.start(1000);
      setIsRecording(true);
      setDuration(0);
      setAudioUrl(null);

      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Please allow microphone access to record voice notes.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex flex-col items-center gap-8 py-8">
      {/* Visualizer / Record button area */}
      <div className="relative flex items-center justify-center">
        {/* Outer rings when recording */}
        {isRecording && (
          <>
            <div className="absolute w-32 h-32 rounded-full bg-red-500/20 recording-pulse" />
            <div className="absolute w-32 h-32 rounded-full bg-red-500/10 recording-pulse-2" />
          </>
        )}

        {/* Ambient glow */}
        <div className={`absolute w-24 h-24 rounded-full blur-2xl transition-all duration-700 ${
          isRecording ? 'bg-red-500/30 scale-150' : audioUrl ? 'bg-emerald-500/20 scale-100' : 'bg-brand-500/15 scale-100'
        }`} />

        {/* Main button */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled}
          className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 group ${
            isRecording
              ? 'bg-gradient-to-b from-red-500 to-red-600 shadow-2xl shadow-red-500/40 hover:shadow-red-500/50'
              : 'bg-gradient-to-b from-brand-500 to-brand-600 shadow-2xl shadow-brand-500/30 hover:shadow-brand-500/40 hover:scale-105'
          } disabled:opacity-40 disabled:cursor-not-allowed active:scale-95`}
        >
          {/* Inner highlight */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/15 to-transparent" />

          {isRecording ? (
            <div className="relative w-8 h-8 rounded-[6px] bg-white transition-all duration-200" />
          ) : (
            <svg className="relative w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          )}
        </button>
      </div>

      {/* EQ bars when recording */}
      {isRecording && (
        <div className="flex items-end gap-1 h-5">
          {[0, 0.2, 0.1, 0.3, 0.15, 0.25, 0.1].map((delay, i) => (
            <div
              key={i}
              className="w-1 bg-red-400/60 rounded-full eq-bar"
              style={{ animationDelay: `${delay}s`, animationDuration: `${0.6 + Math.random() * 0.4}s` }}
            />
          ))}
        </div>
      )}

      {/* Status */}
      <div className="text-center">
        {isRecording ? (
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 font-mono font-medium text-lg tracking-wider">{formatTime(duration)}</span>
          </div>
        ) : audioUrl ? (
          <div className="flex items-center gap-2 text-emerald-400 animate-fade-in">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">Recording ready · {formatTime(duration)}</span>
          </div>
        ) : (
          <span className="text-zinc-600 text-sm">Tap the mic to start recording</span>
        )}
      </div>

      {/* Playback */}
      {audioUrl && (
        <div className="w-full max-w-sm animate-fade-in-up">
          <audio controls src={audioUrl} className="w-full rounded-xl [&::-webkit-media-controls-panel]:bg-surface-300" />
        </div>
      )}
    </div>
  );
}
