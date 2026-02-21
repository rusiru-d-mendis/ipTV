# Flux TV | Modern IPTV Player

Flux TV is a premium, high-performance web-based IPTV player designed for the modern era. Built with a focus on speed, reliability, and a "crafted" user experience, it allows you to stream your favorite live channels directly in your browser or as an installed app.

## 📺 Project Description

Flux TV provides a seamless interface for managing and viewing M3U playlists. It solves common IPTV streaming issues like CORS restrictions and Mixed Content blocks through a custom-built recursive proxy system. Whether you're watching on a desktop or a mobile device, Flux TV delivers a native-app feel with advanced playback controls and intuitive navigation.

## ✨ Key Features

- **Adaptive Streaming**: Full HLS support with automatic and manual quality selection (144p to 1080p).
- **Smart Proxy System**: Built-in recursive proxy to bypass CORS and Mixed Content (HTTPS/HTTP) issues.
- **PWA Ready**: Install Flux TV on your home screen for a full-screen, standalone experience.
- **Group Organization**: Automatically categorizes channels based on playlist metadata.
- **Search & Filter**: Quickly find channels across thousands of entries.
- **Modern UI**: Dark-mode first design with smooth animations and responsive layouts.
- **Logo Support**: Automatic channel logo fetching with referrer-policy handling.

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Playback**: HLS.js
- **Backend**: Express (Node.js) for Proxy & API
- **Animations**: Framer Motion

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd flux-tv
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server (includes the proxy backend):
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

### Build

Create a production-ready build:
```bash
npm run build
```

## 🛡 Proxy System

Flux TV includes a sophisticated proxy endpoint (`/api/proxy-manifest`) that:
- Rewrites HLS manifests to force all sub-resources through the proxy.
- Spoofs `Referer` and `Origin` headers to bypass provider-side hotlink protection.
- Supports `Range` headers for efficient video segment streaming.
- Bridges the gap between secure (HTTPS) app hosting and insecure (HTTP) stream sources.

## 📱 PWA Support

Flux TV is a fully compliant Progressive Web App. To install:
1. Open the app in a supported browser (Chrome, Edge, Safari).
2. Click the "Install" icon in the address bar or "Add to Home Screen" in the browser menu.

---

*Note: Flux TV does not provide any content. You must provide your own valid M3U playlist URL.*
