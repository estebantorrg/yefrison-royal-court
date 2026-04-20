# Security & Bug Audit - Yefrison Royal Court

**Date:** 2026-04-20
**Scope:** Exhaustive manual audit of the frontend and backend codebase (`App.tsx`, `components/`, `functions/api/`, `services/`).

## 1. Security Vulnerabilities

### 1.1 Secret Exposure Risk (High)
**Location:** `functions/api/ask.ts` Line 22, `.env` file
**Description:** The application's Gemini API key is prefixed with `VITE_` (`VITE_GEMINI_API_KEY`). Variables with the `VITE_` prefix are automatically exposed to the Vite frontend bundle if they are accidentally referenced anywhere in the frontend code. Best practice dictates that strictly backend secrets must never be prefixed with client-bundler prefixes.
**Recommendation:** Rename the environment variable to `GEMINI_API_KEY` across the Cloudflare Pages environment, `.env` file, and `functions/api/ask.ts`.

### 1.2 Unvalidated URI Execution (Medium/Low)
**Location:** `components/AskYefris.tsx` Line 666
**Description:** The application renders external URIs directly into the `href` attribute of an anchor tag (`<a href={source.uri}>`). If the Gemini model returns a malicious URI payload (e.g., `javascript:alert('XSS')`), execution of arbitrary code within the site's context is possible when clicked.
**Recommendation:** Validate and sanitize `source.uri` to ensure it only starts with `http://` or `https://` before rendering it into the anchor tag.

### 1.3 Missing Rate Limiting and Payload Size Validation (Medium)
**Location:** `functions/api/ask.ts`
**Description:** The API expects `{ question, history }` but performs zero bounds-checking. A malicious actor can send arbitrary massive payloads to exhaust memory or repeatedly query the endpoint to run up Gemini API quotas.
**Recommendation:** Enforce maximum length validation for `question` and `history` arrays. Implement basic rate-limiting middleware or CF Pages bindings if possible.

## 2. Functional Bugs & Code Defects

### 2.1 Complete Loss of Chat History (Critical Functional Bug)
**Location:** `functions/api/ask.ts` Line 19, 43
**Description:** The frontend painstakingly compiles a formatted chat history (`historyPayload`) and sends it to the server. The backend parses `const { question, history } = body;`, but then entirely ignores `history`, sending only `contents: question` to the GoogleGenAI instance. As a result, the "Oracle" has zero conversational memory, breaking the fundamental chat experience.
**Recommendation:** Modify the `contents` payload in the API to properly append the `history` context correctly formatted for the `@google/genai` SDK.

### 2.2 Unhandled JSON Body Parsing (Low)
**Location:** `functions/api/ask.ts` Line 18
**Description:** `const body = await request.json()` assumes the client provides a well-formed JSON object. A malformed request triggers an uncaught exception before the main try-catch logic can cleanly respond, yielding a 500 without a proper error shape to the stream proxy.

### 2.3 Potential DOM Clipping on Massive Share Cards (Edge Case)
**Location:** `components/ShareCard.tsx` Line 23
**Description:** The user requirement dictates absolute perfection on share card rendering regardless of "the oracle's response length". While `max-content` is used, rendering engines (and iOS Safari canvases) will fail to generate data URLs for elements exceedingly tall (typically > 4096px).

### 2.4 Browser Default Styling Bleeding
**Location:** `index.css`
**Description:** Standard CSS resets are applied by Tailwind, but custom scrollbars (`.custom-scrollbar`) fall back poorly on specific non-WebKit browsers causing the popup share UI and oracle card to appear clunky.

## Conclusion
The application is visually stunning but has a critical functional flaw regarding chat memory and minor architectural vulnerabilities concerning API key naming and input validation. Immediate remediation is strongly advised.
