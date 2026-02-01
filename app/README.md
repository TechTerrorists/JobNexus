# JobNexus Frontend

Next.js application for JobNexus platform with dashboard, authentication, and voice interviews.

## Features

- User authentication (Supabase)
- Dashboard with analytics
- Job listings and saved jobs
- Voice-based mock interviews
- Interview history and scoring
- Employee outreach tracking

## Tech Stack

- Next.js 16 (Turbopack)
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase (Auth & Storage)
- LiveKit (Voice AI)
- ECharts (Charts)

## Setup

```bash
npm install
cp .env.local.example .env.local
```

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
LIVEKIT_URL=wss://your-livekit-url
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
```

## Development

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Lint code
```

## Project Structure

```
app/
├── app/
│   ├── api/                    # API routes
│   │   └── connection-details/ # LiveKit connection
│   ├── auth/                   # Auth pages
│   ├── dashboard/              # Dashboard pages
│   │   ├── interviews/         # Interview pages
│   │   └── page.tsx           # Main dashboard
│   ├── login/                  # Login page
│   ├── signup/                 # Signup page
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Home page
├── components/
│   ├── app/                   # App components
│   ├── agents-ui/             # Voice AI components
│   ├── dashboard/             # Dashboard components
│   └── layout/                # Layout components
├── lib/
│   ├── supabase/              # Supabase client
│   └── jobsData.ts            # Job data utilities
└── styles/
    └── globals.css            # Global styles
```

## Key Pages

- `/` - Landing page
- `/login` - User login
- `/signup` - User registration
- `/dashboard` - Main dashboard
- `/dashboard/interviews` - Voice interview interface

## Components

### Dashboard
- `CardWithIcon` - Metric cards
- `Sidebar` - Navigation sidebar
- `DashboardHeader` - Header with user info

### Voice Interview
- `agent-session-provider` - LiveKit session management
- `agent-control-bar` - Interview controls
- `agent-chat-transcript` - Real-time transcript
- `agent-audio-visualizer-*` - Audio visualizations

## Supabase Setup

Required tables:
- `users` - User profiles
- `resume` - Resume storage references
- `jobs` - Saved jobs

Storage buckets:
- `JobNexusBucket` - Resume PDFs

## LiveKit Setup

1. Create LiveKit account
2. Get API credentials
3. Deploy voice agent (see backend/voiceAI)
4. Configure environment variables

## Deployment

### Vercel (Recommended)

```bash
npm run build
vercel deploy
```

### Docker

```bash
docker build -t jobnexus-frontend .
docker run -p 3000:3000 jobnexus-frontend
```

## Troubleshooting

### Hydration Errors
- Ensure `suppressHydrationWarning` is on `<html>` tag
- Check for client-only code in server components

### LiveKit Connection Issues
- Verify environment variables
- Check voice agent is running
- Ensure API route is accessible

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
