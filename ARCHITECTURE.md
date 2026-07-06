# Yefrison Royal Court — Architecture Overview

This document provides a high-level technical overview of the Yefrison Royal Court web application. It aims to explain how the various systems interact and are implemented, without exposing raw secrets or sensitive operational configurations.

> **Note:** The Church of B.O.B. realm was split out of this codebase into its own repository and Cloudflare Pages deployment (churchofbob.pages.dev). The Gateway landing page (`/`) links to it externally; everything below describes the Yefris site only.

## System Topology & Infrastructure

The application is deployed on **Cloudflare Pages** and utilizes a full-stack Serverless/Edge computing model.

```mermaid
graph TD
    Client[Browser Frontend - React SPA] 
    CF_Pages_Node[Cloudflare Edge Network]
    
    subgraph Cloudflare Environment
        Static[Static Assets / HTML / JS]
        API_Ask[/api/ask - LLM Proxy]
        API_Game[/api/game-session - Anti-Cheat]
        API_Leaderboard[/api/leaderboard - Score Submissions]
        KV_Store[(Cloudflare KV Store)]
    end
    
    Gemini[Google Gemini API]

    Client -->|Loads App| Static
    Client -->|Streaming Chat| API_Ask
    Client -->|Request Session| API_Game
    Client -->|Submit Score| API_Leaderboard
    
    CF_Pages_Node --- Static
    CF_Pages_Node --- API_Ask
    CF_Pages_Node --- API_Game
    CF_Pages_Node --- API_Leaderboard
    
    API_Ask -->|Fetch AI| Gemini
    API_Game -->|Create Token| KV_Store
    API_Leaderboard -->|Verify & Consume Token| KV_Store
    API_Leaderboard -->|Save Top 10| KV_Store
```

---

## 1. Frontend Architecture

The client side is a Single Page Application (SPA) built using **React 19**, **TypeScript**, and **Vite**.

- **Routing Model (`react-router-dom`):** The app uses client-side routing. Cloudflare Pages is configured via a `_redirects` file (`/* /index.html 200`) so all URI requests execute `index.tsx` first, allowing React Router to seamlessly handle navigation between `/` (Gateway), `/cult`, `/oracle`, and `/games/*`.
- **Styling System (`tailwindcss` + `index.css`):** The UI strictly uses Tailwind CSS utility classes combined with custom CSS keyframe animations (like `fade-in-up`) for complex states and route transitions.
- **State Management:** Local React state (`useState`, `useRef`) handles complex interactions like minigame logic and chat text buffering. Long-term state (i.e., Chat Thread History) is aggressively cached inside the browser's `localStorage`.
- **Fault Tolerance (`ErrorBoundary.tsx`):** A class-based React component wraps the entire component tree. It catches unhandled Javascript errors silently crashing components, providing a fallback UI and preventing page-wide white-screens.

---

## 2. Minigames & Anti-Cheat Subsystem

To prevent bad actors from forging malicious HTTP requests directly to the leaderboard API, we implemented a server-side **Session Token Architecture**.

1. **Token Generation:** When a user clicks "Play" on a minigame (e.g. *Yefris Laser Defense*), the client sends a `POST` request to the Cloudflare Edge API (`/api/game-session`). The server generates a highly entropic 32-byte hexadecimal string, caches it inside Cloudflare KV with an expiration TTL (10 minutes), and returns the token.
2. **Gameplay Validation:** The client holds the token in memory while the game proceeds.
3. **Score Submission:** When the game ends, the client sends their final score alongside the session token. The Cloudflare Edge function (`/api/leaderboard`) strictly verifies that the token exists in KV. If valid, the score is accepted and the token is immediately destroyed (nullified), making replay attacks impossible.

---

## 3. The Oracle (AI Proxy Engine)

The core feature—Ask Yefris—relies on a secure bridge to the **Google Gemini API**.

- **Secure Edge Proxy (`/api/ask`):** The frontend never directly talks to Google's API, ensuring `GEMINI_API_KEY` (and the optional `GEMINI_COMPACT_API_KEY` used for history compaction) is completely hidden within Cloudflare Server Secrets. The endpoint is rate-limited per IP (60 req/min, in-memory per isolate).
- **Streaming & Parsing (`geminiService.ts`):**
  - The Cloudflare function generates the full response, strips internal chain-of-thought metadata (`<think>` tags), and pushes it over an SSE stream together with search grounding metadata so the frontend can natively render clickable "Homun Sources".
  - The client-side `askYefrisStream` async generator then re-streams the buffered text as a batched typewriter (~40 ticks at 4ms each) to minimize perceived latency.
  - History compaction: when a thread grows past ~20 messages or ~5,000 characters, older messages are summarized server-side by a cheaper model (`gemma-4-26b-a4b-it`) before the main model (`gemma-4-31b-it`) is queried.

---

## 4. Telemetry & SEO

- **Web Analytics:** Handled entirely by Cloudflare Web Analytics via a lightweight script payload in `index.html`. It uses a privacy-first proxying beacon rather than tracking cookies, keeping bundle sizes thin.
- **Sitemap Indexing:** Crawlers rely on a hardcoded `sitemap.xml` mapping priority weights across the routing paths.
