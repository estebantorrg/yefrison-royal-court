# The Cult of Yefris

An interactive web application built to showcase the full software development lifecycle, from concept to a live, deployed product.

**➡️ LIVE DEMO 🚀**
**[https://yefris.pages.dev/](https://yefris.pages.dev/)**

## Main Features
*   **The Oracle of Yefris:** A fully interactive AI chat interface powered by the Google Gemini API, governed by custom system prompts enforcing the persona of an oblivion-obsessed cult leader.
*   **Persistent Divinations:** Multi-thread session history built entirely with client-side local storage. Threads can be dynamically created, renamed, and deleted.
*   **Responsive Cult UI:** A sleek, fully dark-mode stylized interface that heavily scales from complex desktop grid layouts down to mobile-friendly dropdowns.
*   **Rich Text Rendering:** Full support for Markdown rendering inside the chat logs (bolding, italics, bullet lists, and code blocks).

## Technologies Used
*   **Frontend Framework:** React 18 & TypeScript
*   **Build Tool:** Vite
*   **Styling:** TailwindCSS + Custom Keyframe Animations
*   **AI Integration:** Google Gemini REST API
*   **Hosting/Deployment:** Cloudflare Pages

## Secret Easter Eggs
For initiates wandering through the source code, there are a few hidden rituals you can perform directly in the Oracle input box:
*   `/bloodmoon` - Toggles a permanent, cursed crimson override on all CSS variables for the session.
*   `/whisper` - Invokes the browser's hidden SpeechSynthesis API for an unsettling audio jump scare.
*   **The Loxodontus Scroll:** Descend to the absolute bottom of the page to trigger an intersection observer that unveils El Homun's ultimate form.

## The Development Journey
This project was a masterclass in the real-world software lifecycle.

1. **The Static Origins:** The site originally began as a pure HTML5/CSS3 and Vanilla JS experiment to learn the fundamentals of DOM manipulation and raw web design.
2. **The React Migration:** As "The Oracle" grew from a simple text box into a multi-threaded chat client with local storage parsing, renaming buffers, and API state tracking, the Vanilla Javascript became unmanageable. The entire architecture was ripped out and re-built from scratch using React and TypeScript.
3. **Overcoming Deployment Hurdles:** Early versions failed to deploy due to complex serverless functions attempting to hide API keys on basic tier hosts. The solution was migrating the CI/CD pipeline exclusively to Cloudflare Pages, taking advantage of edge networking for lightning-fast site delivery.
4. **The Final Polish:** Implementing TailwindCSS, dynamic intersection observers for YouTube autoplay, and adding seamless CSS mask-image fades to polish the UI into a fully professional web app. 

## Oracle Error Index

| Ritual Result Message | Translation / Meaning |
|---|---|
| *"yefris went to take a break. come back later."* | The free-tier Gemini API daily limit has been reached. Try again tomorrow. |
| *"yefris cannot authenticate. the API key may be invalid or missing."* | The `VITE_GEMINI_API_KEY` is either missing from the Cloudflare environment variables or has been revoked. |
| *"something went wrong on yefris' end. try again in a moment."* | An unexpected server/Gemini error occurred. |
| *"yefris went for a walk. he cannot be reached at this time."* | The frontend could not reach the Cloudflare Edge network (local network disconnected or CF Pages went down). |
