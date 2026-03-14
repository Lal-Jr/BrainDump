# Brain Dump Blog

A personal brain dump blog — record a voice note or type your thoughts and AI turns them into polished blog posts with titles, formatting, tags, and images. One-button publish to go live. Works as a PWA so you can install it on your phone.

## How It Works

1. **Record or Type** — Open the app, hit record, and start talking (or type your raw thoughts)
2. **AI Generates** — OpenAI Whisper transcribes your voice, then GPT-4o turns it into a formatted Markdown post with title, tags, headings, and image suggestions
3. **Edit** — Review the generated post. Edit in rich mode, raw Markdown, or preview it
4. **Publish** — One button to go live. Your post is instantly viewable at `/blog`

## Stack

- **Backend:** Node.js + Express — stores posts as Markdown files with YAML frontmatter
- **Frontend:** React + Vite + Tailwind CSS — PWA installable on phone
- **AI:** OpenAI (Whisper for transcription, GPT-4o for post generation, DALL-E 3 for images)

## Setup

### 1. Clone & Install

```bash
git clone <your-repo-url> blogpage
cd blogpage
npm run install:all
```

### 2. Configure OpenAI API Key

```bash
cp server/.env.example server/.env
# Edit server/.env and add your OpenAI API key
```

Get an API key at https://platform.openai.com/api-keys

### 3. Run Development

```bash
npm run dev
```

This starts both the server (port 3001) and client (port 5173) concurrently.

- **Dashboard:** http://localhost:5173
- **Public blog:** http://localhost:5173/blog

### 4. Production Build

```bash
npm run build   # builds the client
npm start       # serves everything from the Express server on port 3001
```

## Install on Phone (PWA)

1. Open the app URL in Safari (iOS) or Chrome (Android)
2. Tap "Add to Home Screen"
3. The app will work like a native app with offline support

## Project Structure

```
blogpage/
├── server/
│   ├── index.js              # Express server
│   ├── routes/posts.js       # API routes
│   ├── services/
│   │   ├── ai.js             # OpenAI (Whisper + GPT-4o + DALL-E)
│   │   └── markdown.js       # Markdown file management
│   ├── posts/                # Generated markdown posts (auto-created)
│   └── uploads/              # Generated images (auto-created)
├── client/
│   ├── src/
│   │   ├── pages/            # Home, Create, Edit, View, PublicFeed
│   │   ├── components/       # VoiceRecorder, PostEditor, MarkdownRenderer, etc.
│   │   ├── api.js            # API client
│   │   └── App.jsx           # Routes
│   └── public/               # PWA icons
└── package.json              # Root scripts
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts` | List all posts |
| GET | `/api/posts?published=true` | List published posts |
| GET | `/api/posts/:id` | Get post by ID |
| GET | `/api/posts/view/:slug` | Get post by slug |
| GET | `/api/posts/:id/raw` | Get raw markdown |
| POST | `/api/posts/from-voice` | Create post from voice (multipart audio) |
| POST | `/api/posts/from-text` | Create post from text |
| PUT | `/api/posts/:id` | Update post fields |
| PUT | `/api/posts/:id/raw` | Save raw markdown |
| POST | `/api/posts/:id/publish` | Toggle publish state |
| DELETE | `/api/posts/:id` | Delete post |
