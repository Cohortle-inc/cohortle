# Cohortle Web

Web application for the Cohortle learning platform, built with Next.js 14.

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Access to the cohortle-api backend

### Environment Variables

Copy `.env.example` to `.env.local` and configure the required variables:

```bash
cp .env.example .env.local
```

Required environment variables:

- `NEXT_PUBLIC_API_URL`: Base URL for the backend API
  - Local development: `http://localhost:3001`
  - Production: Your API server URL

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── lessons/           # Lesson viewer pages
│   ├── login/             # Authentication pages
│   └── ...                # Marketing pages
├── components/            # React components
│   ├── lessons/          # Lesson-related components
│   └── errors/           # Error boundary components
├── lib/                   # Utilities and hooks
│   ├── api/              # API client and functions
│   ├── hooks/            # React Query hooks
│   └── utils/            # Helper functions
└── types/                 # TypeScript type definitions
```

## Features

- Student lesson viewer with support for:
  - Text lessons with rich HTML formatting
  - Video lessons (YouTube and BunnyStream)
  - PDF documents
  - External links
- Lesson completion tracking
- Comments and discussions
- Responsive design for desktop and tablet
- Authentication with token-based auth

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Testing**: Jest + React Testing Library + fast-check
- **HTTP Client**: Axios

## License

Proprietary
