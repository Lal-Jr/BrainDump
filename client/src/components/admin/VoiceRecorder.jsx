import { useState, useRef, useEffect } from 'react';

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

// Record a voice note in the browser. The recording never leaves the device until "Create draft".
export default function VoiceRecorder({ onRecordingComplete, onError, disabled }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const recorder = useRef(null);
  const stream = useRef(null);
  const chunks = useRef([]);
  const timer = useRef(null);

  // Release the microphone and timer if the page is left mid-recording
  useEffect(
    () => () => {
      clearInterval(timer.current);
      stream.current?.getTracks().forEach((t) => t.stop());
    },
    []
  );
  useEffect(() => () => audioUrl && URL.revokeObjectURL(audioUrl), [audioUrl]);

  async function start() {
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      recorder.current = new MediaRecorder(stream.current, { mimeType });
      chunks.current = [];
      recorder.current.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      recorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: mimeType });
        setAudioUrl(URL.createObjectURL(blob));
        stream.current?.getTracks().forEach((t) => t.stop());
        onRecordingComplete?.(blob);
      };
      recorder.current.start(1000);
      setRecording(true);
      setSeconds(0);
      setAudioUrl(null);
      timer.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      onError?.('Please allow microphone access to record a voice note.');
    }
  }

  function stop() {
    if (recorder.current?.state !== 'inactive') recorder.current?.stop();
    setRecording(false);
    clearInterval(timer.current);
  }

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <div className="relative flex items-center justify-center">
        {recording && (
          <>
            <span className="recording-pulse absolute h-24 w-24 rounded-full bg-red-500/20" />
            <span className="recording-pulse-2 absolute h-24 w-24 rounded-full bg-red-500/10" />
          </>
        )}
        <button
          type="button"
          onClick={recording ? stop : start}
          disabled={disabled}
          aria-label={recording ? 'Stop recording' : 'Start recording'}
          className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-40 ${
            recording ? 'bg-red-500' : 'bg-brand-300 hover:bg-brand-200'
          }`}
        >
          {recording ? (
            <span className="h-7 w-7 bg-white" />
          ) : (
            <svg className="h-9 w-9 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="9" y="3" width="6" height="11" />
              <path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" />
            </svg>
          )}
        </button>
      </div>

      {recording && (
        <div className="flex h-5 items-end gap-1" aria-hidden>
          {[0, 0.2, 0.1, 0.3, 0.15, 0.25, 0.1].map((d, i) => (
            <span key={i} className="eq-bar w-1 bg-red-400/70" style={{ animationDelay: `${d}s` }} />
          ))}
        </div>
      )}

      <div className="text-center">
        {recording ? (
          <>
            <p className="text-2xl font-semibold text-red-400">{fmt(seconds)}</p>
            <p className="label mt-3">Recording. Tap to stop</p>
          </>
        ) : audioUrl ? (
          <>
            <p className="text-[13px] font-medium text-brand-300">Recorded {fmt(seconds)}</p>
            <audio controls src={audioUrl} className="mt-4 w-full max-w-xs" />
            <p className="label mt-3">Tap the mic to re-record</p>
          </>
        ) : (
          <p className="label">Tap the mic to start</p>
        )}
      </div>
    </div>
  );
}
