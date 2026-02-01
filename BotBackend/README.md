# JobNexus Backend

FastAPI backend with AI-powered resume analysis, job scraping, and conversational agents.

## Features

- Resume PDF parsing and analysis
- AI-powered profile extraction (Google Gemini)
- Vector embeddings (Pinecone)
- LinkedIn job scraping
- Conversational AI agent (LangGraph)
- Job matching workflow

## Tech Stack

- Python 3.12
- FastAPI
- LangGraph (AI workflows)
- Google Gemini 2.5 Flash
- Pinecone (Vector DB)
- Supabase
- Playwright (Scraping)
- PDFPlumber (PDF parsing)

## Setup

```bash
# Using pip
pip install -r requirements.txt

# Using uv (recommended)
uv sync
```

## Environment Variables

Create `.env`:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_API_KEY=your_supabase_service_key
GOOGLE_API_KEY=your_google_ai_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=jobnexus
```

## Run Server

```bash
python main.py
# Server runs on http://localhost:8000
```

## API Endpoints

### Chat
- `POST /chat/initiate` - Start conversation
- `GET /chat/continue` - Continue chat
- `GET /chat/health` - Health check

### Root
- `GET /` - Server status

## Workflows

### Resume Processing

```
Resume_Loader → Profile_Extractor → Embbeder_and_VectorStorage → Extract_Jobs
```

### Main Agent

```
User Message → Agent → Tool Selection → Resume Tool → Job Results
```

## Job Scraper Usage

```python
from scraper.job_scraper import LinkedInJobsScraper

async with LinkedInJobsScraper() as scraper:
    jobs = await scraper.scrape_jobs(
        keywords="Software Engineer",
        location="Bangalore, India",
        max_jobs=20
    )
```

## Deployment

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```
