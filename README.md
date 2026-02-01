# JobNexus

AI-powered job matching platform with resume analysis, LinkedIn job scraping, and voice-based mock interviews.

## Features

- **Resume Analysis**: Upload PDF resumes for AI-powered skill extraction and profile building
- **Job Matching**: Scrape LinkedIn jobs based on user preferences and match with resume profiles
- **Mock Interviews**: Voice-based AI interviews with real-time feedback using LiveKit
- **Dashboard Analytics**: Track interview scores, saved jobs, and employee outreach
- **Conversational AI**: Chat interface powered by Google Gemini and LangGraph

## Project Structure

```
JobNexus/
├── app/                          # Next.js frontend
├── backend/                      # Python FastAPI backend
├── JobNexusAIInterview/         # Voice AI interview module
└── README.md
```

## Tech Stack

### Frontend
- Next.js 16 (Turbopack)
- React 19
- TypeScript
- Tailwind CSS
- Supabase (Auth & Storage)
- ECharts (Visualizations)
- LiveKit (Voice AI)

### Backend
- Python 3.12
- FastAPI
- LangGraph (AI Workflows)
- Google Gemini 2.5 Flash
- Pinecone (Vector Database)
- Supabase
- Playwright (Web Scraping)

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.12+
- Supabase account
- Google AI API key
- Pinecone account
- LiveKit account (for voice interviews)

### Frontend Setup

```bash
cd app
npm install
cp .env.local.example .env.local
# Add your environment variables
npm run dev
```

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
# or use uv
uv sync
cp .env.example .env
# Add your environment variables
python main.py
```

### Voice AI Setup

```bash
cd backend/voiceAI
uv sync
# Configure LiveKit credentials
python src/agent.py
```

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
LIVEKIT_URL=your_livekit_url
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
```

### Backend (.env)
```
SUPABASE_URL=your_supabase_url
SUPABASE_API_KEY=your_supabase_service_key
GOOGLE_API_KEY=your_google_ai_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_index_name
```

## API Endpoints

### Chat API
- `POST /chat/initiate` - Start new conversation
- `GET /chat/continue` - Continue existing conversation
- `GET /chat/health` - Health check

### Voice Interview API
- `POST /api/connection-details` - Get LiveKit connection details

## Architecture

```
User → Next.js Frontend → FastAPI Backend → LangGraph Agents
         ↓                                      ↓
    Supabase Auth                    Gemini AI + Pinecone
                                            ↓
                                  LinkedIn Job Scraper

Voice Interview: Next.js → LiveKit → Python Voice Agent
```

## Workflow

1. **Resume Upload**: User uploads PDF → Stored in Supabase
2. **Profile Extraction**: AI extracts skills, experience, education
3. **Embedding Generation**: Create vector embeddings → Store in Pinecone
4. **Job Scraping**: Scrape LinkedIn based on preferences
5. **Job Matching**: Match jobs with user profile
6. **Mock Interview**: Voice-based AI interview with feedback

## Development

### Frontend
```bash
cd app
npm run dev      # Development server
npm run build    # Production build
npm run lint     # Lint code
```

### Backend
```bash
cd backend
python main.py   # Start FastAPI server (port 8000)
```

## License

See LICENSE file for details.

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request
