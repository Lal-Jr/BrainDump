import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import VoiceRecorder from '../../components/admin/VoiceRecorder';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { createPostFromVoice, createPostFromText, createPostManually } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

// One job: turn a voice note or rough text into a draft, then hand off to the editor.
export default function Create() {
  const navigate = useNavigate();
  const toast = useToast();
  const [mode, setMode] = useState('voice'); // voice | text
  const [audio, setAudio] = useState(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const ready = mode === 'voice' ? !!audio : !!text.trim();

  async function run(task) {
    setBusy(true);
    try {
      const { post } = await task();
      navigate(`/admin/edit/${post.id}`);
    } catch (e) {
      toast.error(e.message || 'Something went wrong. Please try again.');
      setBusy(false);
    }
  }

  if (busy) return <LoadingSpinner text="Writing your draft" />;

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <h1 className="text-2xl font-bold text-zinc-50">New post</h1>
      <p className="mt-4 text-[14px] text-zinc-500">Say it or jot it down. You'll edit the draft before anything goes live.</p>

      <div className="tab-group mt-8">
        {['voice', 'text'].map((m) => (
          <button key={m} onClick={() => setMode(m)} className={mode === m ? 'tab-item-active' : 'tab-item'}>{m}</button>
        ))}
      </div>

      <div className="card mt-4 p-6 sm:p-8">
        {mode === 'voice' ? (
          <VoiceRecorder onRecordingComplete={setAudio} onError={toast.error} />
        ) : (
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Rough notes, half-formed thoughts, whatever's on your mind…" aria-label="Your notes" rows={10} autoFocus className="input resize-y leading-relaxed" />
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => run(() => (mode === 'voice' ? createPostFromVoice(audio) : createPostFromText(text)))} disabled={!ready} className="btn-primary">
          Create draft
        </button>
        {/* Also the way in when AI credits run out: an empty draft to write by hand */}
        <button onClick={() => run(() => createPostManually({ title: `Untitled draft ${new Date().toLocaleDateString()}`, content: '' }))} className="text-[12px] text-zinc-500 transition-colors hover:text-zinc-200">
          or start a blank draft →
        </button>
      </div>
      <p className="mt-6 text-[12px] text-zinc-600">
        <Link to="/admin" className="transition-colors hover:text-zinc-300">← Back to posts</Link>
      </p>
    </div>
  );
}
