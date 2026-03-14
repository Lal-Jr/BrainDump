import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 60_000,        // 60s timeout (gpt-4o-mini is fast)
  maxRetries: 3,           // retry up to 3 times on transient errors
});

/**
 * Transcribe audio buffer using OpenAI Whisper
 */
export async function transcribeAudio(audioBuffer, mimetype = 'audio/webm') {
  const ext = mimetype.includes('mp4') ? 'mp4' : mimetype.includes('wav') ? 'wav' : 'webm';
  const file = new File([audioBuffer], `recording.${ext}`, { type: mimetype });

  const transcription = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file,
    response_format: 'text',
  });

  return transcription;
}

/**
 * Generate a blog post from a VOICE transcript — conversational, personality-preserving
 */
export async function generateFromVoice(transcript) {
  const systemPrompt = `You are a personal blog ghostwriter. The user recorded a voice memo — raw, unfiltered thoughts spoken aloud. Your job is to transform this spoken brain dump into a compelling blog post while KEEPING their authentic voice.

VOICE-SPECIFIC RULES:
1. Preserve the speaker's natural tone, humor, and quirks — this should sound like THEM, not a copywriter
2. Clean up filler words, repetitions, and false starts, but keep casual language and personality
3. If they ramble, find the narrative thread and restructure it into a coherent flow
4. Use conversational transitions ("Here's the thing...", "So basically...", etc.) where they feel natural
5. Add a compelling title that captures the vibe of what they were saying
6. Write a 1-2 sentence summary that hooks readers
7. Structure with markdown headings (##, ###) but keep it loose — not overly formal
8. Use blockquotes (>) for key insights or strong opinions they expressed
9. Add 2-4 relevant tags
10. If the speaker mentions specific examples, stories, or analogies — highlight those, they're gold
11. Do NOT include image placeholders in the content. Focus purely on text.

The output should read like a blog post someone actually WROTE, not a transcript that was cleaned up.

Respond ONLY with a JSON object (no markdown code fences):
{
  "title": "The Post Title",
  "summary": "A short hook summary",
  "tags": ["tag1", "tag2"],
  "content": "Full markdown content (not including the title)",
  "needsImage": false,
  "imagePrompt": ""
}

IMPORTANT: Set "needsImage" to false by default. Only set to true in RARE cases where the post is meaningless without a visual (e.g. a photography post, a travel photo diary, or a visual design showcase). 99% of posts should be text-only. If needsImage is true, provide a single imagePrompt string. Otherwise leave it empty.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Here's my voice recording transcript:\n\n${transcript}` },
    ],
    temperature: 0.8,
    max_tokens: 4096,
  });

  return parseAIResponse(response);
}

/**
 * Generate a blog post from TEXT input — editorial, polished, expanded
 */
export async function generateFromText(text, options = {}) {
  const { style = 'editorial', tone = 'thoughtful' } = options;

  const styleGuides = {
    editorial: 'Write like a well-crafted blog essay. Develop ideas fully, add transitions between sections, and build toward a conclusion. Think personal Medium article.',
    listicle: 'Structure as a numbered list or collection of key points. Each point should have a heading and 2-3 sentences of explanation. Make it scannable.',
    tutorial: 'Write as a how-to guide. Add step-by-step instructions, code blocks if relevant, and practical tips. Include a "TL;DR" at the top.',
    story: 'Write in a narrative style. Build a story arc even if the input is just bullet points. Use vivid descriptions and personal anecdotes.',
  };

  const toneGuides = {
    thoughtful: 'Reflective, nuanced, asks good questions',
    casual: 'Relaxed, funny, uses slang and informal language',
    professional: 'Authoritative, well-researched feel, includes data-style statements',
    passionate: 'Energetic, opinionated, uses emphasis and exclamations',
  };

  const systemPrompt = `You are an expert blog content writer. The user will give you raw notes, bullet points, or rough ideas typed out. Your job is to EXPAND and TRANSFORM these into a fully developed, polished blog post.

TEXT-SPECIFIC RULES:
1. The input is typed notes — they're meant to be expanded, not just cleaned up
2. ${styleGuides[style] || styleGuides.editorial}
3. Tone: ${toneGuides[tone] || toneGuides.thoughtful}
4. Add depth — if they mention a point briefly, develop it with examples, analogies, or context
5. Create a strong, SEO-friendly title
6. Write an engaging summary (1-2 sentences) that would work as a meta description
7. Use rich markdown: headings (##, ###), bold for emphasis, bullet lists, blockquotes for key takeaways
8. Add a "Key Takeaways" or "TL;DR" section at the bottom
9. Add 3-5 relevant tags (more specific than generic)
10. If the input is sparse, be creative in expanding — but stay true to their original intent
11. Do NOT include image placeholders in the content. Focus purely on text.

The output should feel like the user spent hours writing and editing, not like AI-generated content.

Respond ONLY with a JSON object (no markdown code fences):
{
  "title": "The Post Title",
  "summary": "An engaging meta-description style summary",
  "tags": ["tag1", "tag2", "tag3"],
  "content": "Full markdown content (not including the title)",
  "needsImage": false,
  "imagePrompt": ""
}

IMPORTANT: Set "needsImage" to false by default. Only set to true in RARE cases where the post is meaningless without a visual (e.g. a photography post, a travel photo diary, or a visual design showcase). 99% of posts should be text-only. If needsImage is true, provide a single imagePrompt string. Otherwise leave it empty.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Here are my notes/ideas:\n\n${text}` },
    ],
    temperature: 0.7,
    max_tokens: 4096,
  });

  return parseAIResponse(response);
}

/**
 * Parse and validate AI JSON response
 */
function parseAIResponse(response) {
  const choice = response.choices[0];
  const raw = (choice.message.content || '').trim();

  // Check if response was truncated
  if (choice.finish_reason === 'length') {
    console.warn('AI response truncated (hit token limit). Attempting JSON repair...');
  }

  if (!raw) {
    throw new Error('AI returned an empty response. Please try again.');
  }

  let cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

  // First try: parse as-is
  try {
    return JSON.parse(cleaned);
  } catch (_) {
    // ignore, try repair
  }

  // Second try: repair truncated JSON by closing open braces/brackets/strings
  try {
    let repaired = cleaned;
    // Close any unclosed string
    const quoteCount = (repaired.match(/(?<!\\)"/g) || []).length;
    if (quoteCount % 2 !== 0) repaired += '"';
    // Close any unclosed brackets/braces
    const opens = (repaired.match(/[{\[]/g) || []).length;
    const closes = (repaired.match(/[}\]]/g) || []).length;
    for (let i = 0; i < opens - closes; i++) {
      repaired += repaired.lastIndexOf('[') > repaired.lastIndexOf('{') ? ']' : '}';
    }
    const parsed = JSON.parse(repaired);
    console.warn('Repaired truncated JSON successfully');
    // Ensure required fields exist
    if (!parsed.title || !parsed.content) {
      throw new Error('Repaired JSON missing required fields');
    }
    return parsed;
  } catch (_) {
    // ignore repair failure
  }

  // Third try: extract partial JSON object up to last complete field
  try {
    // Find the last complete "key": "value" or "key": [...] and close the object
    const lastComma = cleaned.lastIndexOf(',\n');
    if (lastComma > 0) {
      const truncated = cleaned.substring(0, lastComma) + '\n}';
      const parsed = JSON.parse(truncated);
      if (parsed.title && parsed.content) {
        console.warn('Recovered partial JSON (truncated at last complete field)');
        return parsed;
      }
    }
  } catch (_) {
    // ignore
  }

  console.error('Failed to parse AI response:', raw.substring(0, 500));
  throw new Error('AI response was incomplete. Please try again with shorter input.');
}

/**
 * Generate an image using DALL-E 3
 */
export async function generateImage(prompt) {
  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `Blog illustration: ${prompt}. Style: modern, clean, minimal, suitable for a personal blog.`,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });
    return response.data[0].url;
  } catch (e) {
    console.error('Image generation failed:', e.message);
    return null;
  }
}
