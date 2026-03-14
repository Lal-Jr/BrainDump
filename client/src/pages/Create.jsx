import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VoiceRecorder from '../components/VoiceRecorder';
import { createPostFromVoice, createPostFromText } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Create() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('voice'); // voice | text
  const [audioBlob, setAudioBlob] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState('');

  const handleGenerate = async () => {
    try {
      setProcessing(true);

      if (mode === 'voice') {
        if (!audioBlob) return alert('Record something first!');
        setStatus('Transcribing your voice...');
        const result = await createPostFromVoice(audioBlob);
        setStatus('Post created!');
        navigate(`/edit/${result.post.id}`);
      } else {
        if (!textInput.trim()) return alert('Type something first!');
        setStatus('Generating your post...');
        const result = await createPostFromText(textInput);
        setStatus('Post created!');
        navigate(`/edit/${result.post.id}`);
      }
    } catch (e) {
      console.error(e);
      alert('Generation failed: ' + e.message);
    } finally {
      setProcessing(false);
      setStatus('');
    }
  };

  if (processing) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-slate-800" />
          <div className="absolute inset-0 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-slate-200 font-medium">{status}</p>
          <p className="text-sm text-slate-500 mt-2">This may take 15-30 seconds...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Brain Dump</h1>
        <p className="text-slate-500 mt-2">Record your thoughts, we'll turn them into a post</p>
      </div>

      {/* Mode toggle */}
      <div className="flex justify-center">
        <div className="flex gap-1 bg-slate-900 rounded-xl p-1">
          <button
            onClick={() => setMode('voice')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              mode === 'voice'
                ? 'bg-slate-800 text-slate-100'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            Voice
          </button>
          <button
            onClick={() => setMode('text')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              mode === 'text'
                ? 'bg-slate-800 text-slate-100'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Text
          </button>
        </div>
      </div>

      {/* Input area */}
      <div className="card p-8">
        {mode === 'voice' ? (
          <VoiceRecorder
            onRecordingComplete={setAudioBlob}
            disabled={processing}
          />
        ) : (
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Just dump your thoughts here... don't worry about formatting, grammar, or structure. We'll handle all of that."
            rows={8}
            className="w-full bg-transparent border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder:text-slate-600 outline-none focus:border-brand-600 transition-colors resize-y min-h-[200px]"
          />
        )}
      </div>

      {/* Generate button */}
      <div className="flex justify-center">
        <button
          onClick={handleGenerate}
          disabled={processing || (mode === 'voice' ? !audioBlob : !textInput.trim())}
          className="btn-primary px-8 py-3 text-base flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Generate Post
        </button>
      </div>

      {/* Helper text */}
      <p className="text-center text-xs text-slate-600">
        Your voice / text → AI transcription → Formatted blog post with title, tags &amp; images
      </p>
    </div>
  );
}
