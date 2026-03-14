import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VoiceRecorder from '../components/VoiceRecorder';
import { createPostFromVoice, createPostFromText } from '../api';
import { useToast } from '../context/ToastContext';

const VOICE_STEPS = [
  { label: 'Transcribing audio...', sub: 'Whisper is converting your speech to text' },
  { label: 'Capturing your voice...', sub: 'Finding the narrative thread in your thoughts' },
  { label: 'Writing the post...', sub: 'Preserving your personality and tone' },
  { label: 'Adding finishing touches...', sub: 'Generating title, tags, and imagery' },
];

const TEXT_STEPS = [
  { label: 'Analyzing your notes...', sub: 'Understanding the key ideas and themes' },
  { label: 'Expanding your ideas...', sub: 'Adding depth, examples, and structure' },
  { label: 'Polishing the post...', sub: 'Refining tone, flow, and formatting' },
  { label: 'Finalizing...', sub: 'Generating title, tags, and imagery' },
];

const STYLES = [
  { key: 'editorial', label: 'Editorial', desc: 'Well-crafted essay', icon: '📝' },
  { key: 'listicle', label: 'Listicle', desc: 'Numbered key points', icon: '📋' },
  { key: 'tutorial', label: 'Tutorial', desc: 'How-to guide', icon: '🔧' },
  { key: 'story', label: 'Story', desc: 'Narrative arc', icon: '📖' },
];

const TONES = [
  { key: 'thoughtful', label: 'Thoughtful' },
  { key: 'casual', label: 'Casual' },
  { key: 'professional', label: 'Professional' },
  { key: 'passionate', label: 'Passionate' },
];

export default function Create() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('voice');
  const [audioBlob, setAudioBlob] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [style, setStyle] = useState('editorial');
  const [tone, setTone] = useState('thoughtful');
  const [processing, setProcessing] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const toast = useToast();

  const steps = mode === 'voice' ? VOICE_STEPS : TEXT_STEPS;

  const handleGenerate = async () => {
    try {
      setProcessing(true);
      setStepIdx(0);

      const interval = setInterval(() => {
        setStepIdx(i => Math.min(i + 1, steps.length - 1));
      }, 6000);

      let result;
      if (mode === 'voice') {
        if (!audioBlob) { clearInterval(interval); setProcessing(false); return toast.error('Record something first!'); }
        result = await createPostFromVoice(audioBlob);
      } else {
        if (!textInput.trim()) { clearInterval(interval); setProcessing(false); return toast.error('Type something first!'); }
        result = await createPostFromText(textInput, { style, tone });
      }

      clearInterval(interval);
      navigate(`/admin/edit/${result.post.id}`);
    } catch (e) {
      console.error(e);
      toast.error(e.message || 'Something went wrong. Please try again.');
    } finally {
      setProcessing(false);
      setStepIdx(0);
    }
  };

  if (processing) {
    const step = steps[stepIdx];
    const isVoice = mode === 'voice';
    return (
      <div className="flex flex-col items-center justify-center py-28 gap-8 animate-fade-in">
        {/* Animated orb — different color per mode */}
        <div className="relative w-24 h-24">
          <div className={`absolute inset-0 rounded-full ${isVoice ? 'bg-violet-500/20' : 'bg-brand-500/20'} animate-ping`} style={{ animationDuration: '2s' }} />
          <div className={`absolute inset-2 rounded-full ${isVoice ? 'bg-violet-500/10' : 'bg-brand-500/10'} animate-ping`} style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
          <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${isVoice ? 'from-violet-500 to-violet-700' : 'from-brand-500 to-brand-700'} animate-pulse flex items-center justify-center`}>
            {isVoice ? (
              <svg className="w-10 h-10 text-white/80" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            ) : (
              <svg className="w-10 h-10 text-white/80" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            )}
          </div>
        </div>

        <div className="text-center space-y-2">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium mb-2 ${isVoice ? 'bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20' : 'bg-brand-500/10 text-brand-400 ring-1 ring-brand-500/20'}`}>
            {isVoice ? 'Voice → Post' : 'Text → Post'}
          </div>
          <p className="text-zinc-100 font-semibold text-lg">{step.label}</p>
          <p className="text-sm text-zinc-600">{step.sub}</p>
        </div>

        {/* Progress bar */}
        <div className="w-64">
          <div className="h-1 bg-zinc-800/60 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${isVoice ? 'bg-violet-500' : 'bg-brand-500'}`}
              style={{ width: `${((stepIdx + 1) / steps.length) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                i <= stepIdx ? (isVoice ? 'bg-violet-500' : 'bg-brand-500') : 'bg-zinc-800'
              }`} />
            ))}
          </div>
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
          {mode === 'voice' ? 'Record your thoughts. AI preserves your voice.' : 'Jot your ideas. AI expands them into a full post.'}
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex justify-center">
        <div className="tab-group">
          <button
            onClick={() => { setMode('voice'); }}
            className={`flex items-center gap-2 ${mode === 'voice' ? 'tab-item-active' : 'tab-item'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
            Voice
          </button>
          <button
            onClick={() => { setMode('text'); }}
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
          <div className="space-y-5">
            <VoiceRecorder
              onRecordingComplete={setAudioBlob}
              disabled={processing}
            />
            <div className="text-center">
              <p className="text-xs text-zinc-700 leading-relaxed max-w-sm mx-auto">
                Speak naturally — ramble, digress, use slang. AI will find the story in your words and keep your authentic voice.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Drop your notes, bullet points, rough ideas, or stream of consciousness here..."
              rows={8}
              className="w-full bg-transparent border border-zinc-800/60 rounded-xl px-5 py-4 text-zinc-200 placeholder:text-zinc-700 outline-none focus:border-brand-500/40 focus:ring-1 focus:ring-brand-500/20 transition-all duration-200 resize-y min-h-[180px] text-[15px] leading-relaxed"
            />

            {/* Style selector */}
            <div>
              <p className="text-xs text-zinc-500 font-medium mb-2.5">Post Style</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {STYLES.map(s => (
                  <button
                    key={s.key}
                    onClick={() => setStyle(s.key)}
                    className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                      style === s.key
                        ? 'border-brand-500/40 bg-brand-500/[0.06] ring-1 ring-brand-500/20'
                        : 'border-zinc-800/40 hover:border-zinc-700/60 hover:bg-white/[0.02]'
                    }`}
                  >
                    <span className="text-base">{s.icon}</span>
                    <p className={`text-sm font-medium mt-1 ${style === s.key ? 'text-zinc-100' : 'text-zinc-400'}`}>{s.label}</p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Tone selector */}
            <div>
              <p className="text-xs text-zinc-500 font-medium mb-2.5">Tone</p>
              <div className="flex flex-wrap gap-2">
                {TONES.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTone(t.key)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      tone === t.key
                        ? 'bg-brand-500/15 text-brand-400 ring-1 ring-brand-500/30'
                        : 'bg-zinc-800/40 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-zinc-700 leading-relaxed">
              AI will expand your notes into a full {style === 'editorial' ? 'essay' : style === 'listicle' ? 'list post' : style === 'tutorial' ? 'guide' : 'story'} with a {tone} tone — adding depth, structure, and polish.
            </p>
          </div>
        )}
      </div>

      {/* Generate button */}
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={handleGenerate}
          disabled={processing || (mode === 'voice' ? !audioBlob : !textInput.trim())}
          className="btn-primary px-10 py-3.5 text-base flex items-center gap-2.5 group disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
          {mode === 'voice' ? 'Transform Recording' : 'Generate Post'}
        </button>

        {/* Pipeline visualization — different per mode */}
        {mode === 'voice' ? (
          <div className="flex items-center gap-3 text-[11px] text-zinc-700 font-medium">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
              Voice
            </span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            <span>Transcribe</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            <span>Your voice, polished</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            <span>Image + tags</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-[11px] text-zinc-700 font-medium">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" /></svg>
              Notes
            </span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            <span>Expand + enrich</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            <span>Style + polish</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            <span>Image + SEO tags</span>
          </div>
        )}
      </div>
    </div>
  );
}
