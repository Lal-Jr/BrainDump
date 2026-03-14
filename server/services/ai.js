import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
 * Generate a full blog post from a voice transcript using GPT-4
 */
export async function generateBlogPost(transcript) {
  const systemPrompt = `You are a personal blog post generator. The user will give you a raw brain dump / voice transcript. Your job is to turn it into a polished markdown blog post.

Rules:
1. Generate a compelling, concise title
2. Add a short summary/subtitle (1-2 sentences)
3. Structure the content with proper markdown headings (##, ###)
4. Add annotations, callouts, or highlights where relevant using blockquotes (>)
5. Suggest 1-3 relevant image descriptions in the format: ![description](PLACEHOLDER_IMAGE)
6. Keep the author's voice and personality — don't make it sound corporate
7. Add relevant tags/categories
8. Format everything as valid Markdown

Respond ONLY with a JSON object (no markdown code fences) in this exact format:
{
  "title": "The Post Title",
  "summary": "A short summary of the post",
  "tags": ["tag1", "tag2"],
  "content": "Full markdown content of the post (not including the title)",
  "imagePrompts": ["description of image 1", "description of image 2"]
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Here's my brain dump:\n\n${transcript}` },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  });

  const raw = response.choices[0].message.content.trim();

  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse AI response:', raw);
    throw new Error('AI returned invalid JSON. Please try again.');
  }
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
      size: '1792x1024',
      quality: 'standard',
    });
    return response.data[0].url;
  } catch (e) {
    console.error('Image generation failed:', e.message);
    return null;
  }
}

/**
 * Generate blog post from raw text (for text-based input)
 */
export async function generateFromText(text) {
  return generateBlogPost(text);
}
