# JobNexus Voice AI Interview

Voice-based AI mock interview system using LiveKit agents.

## Features

- Real-time voice conversations
- AI-powered interview questions
- Speech recognition and synthesis
- Interview feedback and scoring

## Tech Stack

- Python 3.12
- LiveKit Agents SDK
- Google Gemini / Claude / OpenAI
- Real-time audio processing

## Setup

```bash
uv sync
```

## Environment Variables

Create `.env.local`:

```env
LIVEKIT_URL=wss://your-livekit-url
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
GOOGLE_API_KEY=your_google_ai_key
```

## Run Agent

```bash
python src/agent.py
```

## Documentation

- See `AGENTS.md` for agent architecture
- See `GEMINI.md` for Gemini integration
- See `CLAUDE.md` for Claude integration

## Deployment

```bash
docker build -t jobnexus-voice-agent .
docker run jobnexus-voice-agent
```
