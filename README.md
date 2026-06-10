# BitcoinWebsiteAnimation

An interactive Bitcoin website featuring scroll-driven animations, chapter-based storytelling, and real-time network data. Built with React, Vite, and Express.

## Features

- Chapter-based storytelling with scroll animations
- Reading progress bar and active chapter indicator
- Live Bitcoin block height, mempool, hashrate, difficulty, and price data
- Lightning Network capacity and channel statistics
- Cached and fallback data when external APIs are unavailable
- Responsive design for desktop and mobile devices

## Tech Stack

- React 19
- Vite 6
- Express 5
- JavaScript
- CSS

## Prerequisites

Install the following tools before running the project:

- [Node.js](https://nodejs.org/) 20 or later
- npm, included with Node.js
- Git

Verify your installation:

```bash
node --version
npm --version
git --version
```

## Getting Started

### 1. Clone the repository


```bash
git clone https://github.com/4917281930/BitcoinWebsiteAnimation.git
cd BitcoinWebsiteAnimation
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development environment

```bash
npm run dev
```

This command starts both services:

- Vite frontend: `http://localhost:3000`
- Express API: `http://localhost:4000`

Open `http://localhost:3000` in your browser.

Press `Ctrl+C` in the terminal to stop both services.

## Running in Production Locally

### 1. Build the frontend

```bash
npm run build
```

Vite creates the production build in the `dist/` directory.

### 2. Start the production server

```bash
npm run server
```

Open `http://localhost:4000` in your browser. Express serves both the API and the production frontend.

To use a different port, set the `PORT` environment variable:

```bash
PORT=8080 npm run server
```

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the frontend and API in development mode |
| `npm run build` | Builds the frontend into `dist/` |
| `npm run preview` | Previews the Vite production build |
| `npm run server` | Starts the Express API and serves the production build |

## API

### `GET /api/metrics`

Returns aggregated Bitcoin network data.

```bash
curl http://localhost:4000/api/metrics
```

Example response:

```json
{
  "blockHeight": 899420,
  "mempoolCount": 19243,
  "mempoolVsize": 14800000,
  "hashRate": 852000000000000000000,
  "difficulty": 126980000000000,
  "price": 104250,
  "lightningCapacity": 5180,
  "lightningChannels": 49100,
  "updatedAt": "2026-06-10T00:00:00.000Z",
  "stale": false
}
```

Responses are cached for 60 seconds. If an external API request fails, the server uses the most recently available data or built-in fallback values.

## Data Sources

- [mempool.space API](https://mempool.space/docs/api)
- [CoinGecko API](https://docs.coingecko.com/)

The server requires an internet connection to retrieve current data from these services.

## Project Structure

```text
bitcoin_website_animation/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
├── index.html
├── server.js
├── vite.config.js
├── package.json
└── README.md
```

## Troubleshooting

### Port 3000 or 4000 is already in use

Stop the process using the port, then run `npm run dev` again. Vite is configured to use port `3000` with strict port enforcement.

### The website loads, but the data does not update

Check the API directly:

```bash
curl http://localhost:4000/api/metrics
```

Make sure the Express server is running on port `4000` and that your machine has internet access.

### Dependency installation fails

Install the exact dependency versions from `package-lock.json`:

```bash
npm ci
```

## Contributing

Contributions are welcome. To submit a change:

1. Fork the repository.
2. Create a branch: `git checkout -b feature/your-feature-name`.
3. Make your changes and test the project locally.
4. Commit your changes: `git commit -m "Add your feature"`.
5. Push the branch: `git push origin feature/your-feature-name`.
6. Open a pull request.

When reporting a bug, include your operating system, Node.js version, reproduction steps, expected behavior, actual behavior, and screenshots when relevant.

## License

This repository does not include a license yet. Add a `LICENSE` file before publishing it as open source. The [MIT License](https://opensource.org/license/mit) is a common choice that allows others to use, modify, and redistribute the project.
