# Job Radar

A discovery-centric job hunting tool that automates job searching across multiple platforms and tracks your application pipeline. Job Radar helps you discover, score, and manage job opportunities using customizable search profiles (Radar Zones) with smart scoring based on your preferences.

## Tech Stack

### Frontend
- React 19 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Recharts for data visualization
- Lucide React for icons

### Backend
- Node.js with Express
- Prisma ORM with SQLite database
- Puppeteer for web scraping
- Cheerio for HTML parsing
- Node-cron for scheduled job discovery

## Features

Job Radar includes built-in parsers for the following job boards and ATS platforms:

- **Job Boards**: LinkedIn, Indeed, Otta
- **Applicant Tracking Systems (ATS)**: Greenhouse, Lever, Ashby, Rippling

### Core Capabilities
- Create customizable Radar Zones with search parameters
- Automated job discovery with scheduled sweeps
- Smart scoring system using green/red flags
- Track applications through multiple pipeline stages
- Company profile enrichment
- Multi-source job aggregation

## Prerequisites

- Node.js 18+ (for local development)
- Docker and Docker Compose (for containerized deployment)

## Getting Started

### Using Docker (Recommended)

```bash
# Build and start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:3001
```

The Docker setup includes:
- Automatic database migrations on startup
- Persistent SQLite data storage
- Chrome/Chromium for Puppeteer scraping

### Local Development

```bash
# Install root dependencies
npm install

# Install backend and frontend dependencies
cd backend && npm install
cd ../frontend && npm install

# Run database migrations
cd backend && npm run db:migrate

# Start both frontend and backend in development mode
npm run dev

# Or run them separately:
npm run dev:backend  # Backend on port 3001
npm run dev:frontend # Frontend on port 5173
```

## Project Structure

```
job-radar/
├── backend/
│   ├── src/
│   │   ├── parsers/        # Job board scrapers (LinkedIn, Indeed, etc.)
│   │   ├── services/       # Business logic services
│   │   └── index.js        # Express API server
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   └── App.tsx         # Main application
│   └── Dockerfile
├── docker-compose.yml      # Multi-container orchestration
└── package.json            # Root package with dev scripts
```

## License

MIT
