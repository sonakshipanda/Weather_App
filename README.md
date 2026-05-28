# Weather App — PM Accelerator AI Engineer Intern Assessment

**Author:** Sonakshi Panda
**Assessment:** Tech Assessment #1 + #2 (Full-Stack)

A full-stack weather app that accepts flexible location input (city, zip, GPS, landmark), shows current weather + 5-day forecast, persists user queries to MongoDB with full CRUD, exports data in multiple formats, embeds YouTube + Google Maps for the searched location, and uses the Claude API to parse natural-language queries like _"weather in Tokyo next week"_.

## About PM Accelerator

The Product Manager Accelerator Program is designed to support PM professionals through every stage of their career. From students looking for entry-level jobs to Directors looking to take on a leadership role, the program has helped over hundreds of students fulfill their career aspirations. PM Accelerator's flagship Product Manager Bootcamp program has trained students at top tech companies including Google, Meta, Amazon, Microsoft, and more. See [Product Manager Accelerator](https://www.linkedin.com/school/pmaccelerator/) on LinkedIn.

## Stack

| Layer    | Tech                                                        |
| -------- | ----------------------------------------------------------- |
| Frontend | React 18 + Vite                                             |
| Backend  | Node.js + Express                                           |
| Database | MongoDB (Mongoose)                                          |
| Weather  | [Open-Meteo](https://open-meteo.com) (no key)               |
| Geocode  | [Nominatim](https://nominatim.openstreetmap.org/) (no key)  |
| AI       | Claude API (`claude-sonnet-4-6`) for NL parsing + tips      |
| Embeds   | YouTube IFrame + Google Maps Embed                          |

## Project Structure

```
weather-app/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── api/            # fetch wrappers to talk to server
│   │   ├── components/     # SearchBar, CurrentWeather, ForecastList, etc.
│   │   ├── hooks/          # useGeolocation, useWeather
│   │   └── pages/          # Home, Saved
│   ├── index.html
│   └── vite.config.js
├── server/                 # Node + Express backend
│   ├── src/
│   │   ├── routes/         # /api/weather, /api/export, /api/ai
│   │   ├── controllers/    # request handlers
│   │   ├── models/         # Mongoose schemas
│   │   ├── utils/          # Open-Meteo + Nominatim clients, exporters
│   │   ├── middleware/     # error handler, rate limit
│   │   └── index.js        # entry
│   └── package.json
├── .env.example
├── package.json            # workspace scripts
└── README.md
```

## Setup

```bash
# 1. Install all deps (root + server + client)
npm run install:all

# 2. Copy env template — root .env covers both server and Vite (via VITE_ prefix)
cp .env.example .env
# Fill in MONGODB_URI and ANTHROPIC_API_KEY at minimum

# 3. Start MongoDB locally (or set MONGODB_URI to Atlas)
brew services start mongodb-community  # macOS

# 4. Run both server and client
npm run dev
```

Server listens on `http://localhost:5050`, client on `http://localhost:5173`.

## Features

### Frontend (Assessment #1)
- Flexible location input — city, zip, GPS coords, or landmark, geocoded via Nominatim
- Current weather: temp, feels-like, humidity, wind, UV, condition
- 5-day forecast in horizontal card layout
- Browser geolocation ("use my location")
- Weather icons (Meteocons)
- Graceful error handling — "city not found", API failure with retry
- Responsive (CSS Grid/Flexbox, mobile breakpoints)

### Backend (Assessment #2)
- **CRUD** on weather queries stored in MongoDB:
  - `POST   /api/weather` — create (validates location + date range)
  - `GET    /api/weather` — list all
  - `GET    /api/weather/:id` — read one
  - `PUT    /api/weather/:id` — update (with re-validation)
  - `DELETE /api/weather/:id` — delete
- **Export** `GET /api/export?format=json|csv|xml|md|pdf`
- **API integrations**: YouTube embed + Google Maps embed for the searched location

### AI Differentiator
- Natural-language input: _"What's the weather like in Tokyo next week?"_ → Claude parses → extract location + date range → fetch + display.
- Auto-generated travel tip on save: weather-aware suggestion from Claude (e.g., "95°F — pack sunscreen").

## Endpoints

| Method | Path                       | Purpose                                |
| ------ | -------------------------- | -------------------------------------- |
| GET    | `/api/health`              | health check                           |
| GET    | `/api/weather/lookup`      | one-shot fetch (no persistence)        |
| POST   | `/api/weather`             | create persisted query                 |
| GET    | `/api/weather`             | list persisted queries                 |
| GET    | `/api/weather/:id`         | read one                               |
| PUT    | `/api/weather/:id`         | update                                 |
| DELETE | `/api/weather/:id`         | delete                                 |
| GET    | `/api/export`              | export all queries (`?format=...`)     |
| POST   | `/api/ai/parse`            | parse NL query via Claude              |
| POST   | `/api/ai/tip`              | weather-aware travel tip via Claude    |

## Demo Video

_TODO: add link before submission._
