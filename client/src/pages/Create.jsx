import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VoiceRecorder from '../components/VoiceRecorder';
import { createPostFromVoice, createPostFromText } from '../api';

const STEPS = ['Transcribing audio...', 'Understanding your thoughts...', 'Crafting the post...', 'Almost there...'];

export default function Create() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('voice'); // voice | text
  const [audioBlob, setAudioBlob] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);

  const handleGenerate = async () => {
    try {
      setProcessing(true);
      setStepIdx(0);

      // Cycle through loading messages
      const interval = setInterval(() => {
        setStepIdx(i => Math.min(i + 1, STEPS.length - 1));
      }, 5000);

      let result;
      if (mode === 'voice') {
        if (!audioBlob) return alert('Record something first!');
        result = await createPostFromVoice(audioBlob);
      } else {
        if (!textInput.trim()) return alert('Type something first!');
        result = await createPostFromText(textInput);
      }

      clearInterval(interval);
      navigate(`/admin/edit/${result.post.id}`);
    } catch (e) {
      console.error(e);
      alert('Generation failed: ' + e.message);
    } finally {
      setProcessing(false);
      setStepIdx(0);
    }
  };

  if (processing) {
    return (
      <div className="flex flex-col items-center justify-center py-28 gap-8 animate-fade-in">
        {/* Animated orb */}
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-brand-500/20 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute inset-2 rounded-full bg-brand-500/10 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 animate-pulse flex items-center justify-center">
            <svg className="w-10 h-10 text-white/80" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
          </div>
        </div>

        <div className="text-center space-y-2">
          <p className="text-zinc-100 font-semibold text-lg">{STEPS[stepIdx]}</p>
          <p className="text-sm text-zinc-600">AI is transforming your brain dump into a polished post</p>
        </div>

        {/* Progress dots */}
        <div className="flex gap-2">
          {STEPS.map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
              i <= stepIdx ? 'bg-brand-500 w-6' : 'bg-zinc-800'
            }`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Hero header */}
      <div className="text-center pt-4 sm:pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 text-xs font-medium mb-4 ring-1 ring-brand-500/20">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          AI-Powered
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-zinc-50 tracking-tight">
          Brain Dump
        </h1>
        <p className="text-zinc-500 mt-3 text-base sm:text-lg max-w-md mx-auto leading-relaxed">
          Record your thoughts. We'll handle the rest.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex justify-center">
        <div className="tab-group">
          <button
            onClick={() => setMode('voice')}
            className={`flex items-center gap-2 ${mode === 'voice' ? 'tab-item-active' : 'tab-item'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
            Voice
          </button>
          <button
            onClick={() => setMode('text')}
            className={`flex items-center gap-2 ${mode === 'text' ? 'tab-item-active' : 'tab-item'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
            </svg>
            Text
          </button>
        </div>
      </div>

      {/* Input area */}
      <div className="card-glow p-6 sm:p-8">
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
            className="w-full bg-transparent border border-zinc-800/60 rounded-xl px-5 py-4 text-zinc-200 placeholder:text-zinc-700 outline-none focus:border-brand-500/40 focus:ring-1 focus:ring-brand-500/20 transition-all duration-200 resize-y min-h-[200px] text-[15px] leading-relaxed"
          />
        )}
      </div>

      {/* Generate button */}
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={handleGenerate}
          disabled={processing || (mode === 'voice' ? !audioBlob : !textInput.trim())}
          className="btn-primary px-10 py-3.5 text-base flex items-center gap-2.5 group"
        >
          <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
          Generate Post
        </button>

        {/* Pipeline visualization */}
        <div className="flex items-center gap-3 text-[11px] text-zinc-700 font-medium">
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
            Your voice
          </span>
          <svg className="w-3 h-3 text-zinc-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          <span>Transcription</span>
          <svg className="w-3 h-3 text-zinc-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          <span>Formatted post</span>
          <svg className="w-3 h-3 text-zinc-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          <span>Title, tags & images</span>
        </div>
      </div>
    </div>
  );
}
