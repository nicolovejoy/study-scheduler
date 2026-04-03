# Study Scheduler

Paste an assignment description, get an AI time estimate, mark when you're free, and auto-schedule study blocks into your week.

Live at: https://study-scheduler-vert.vercel.app

## Setup

```
npm install
```

Create `.env.local` with your Anthropic API key:

```
ANTHROPIC_API_KEY=your-key-here
```

Or if you have 1Password CLI:

```
op inject -i .env.tpl -o .env.local
```

Then:

```
npm run dev
```

Open http://localhost:3000
