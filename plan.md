# @01-vision.md

# Sketch Vibe — @01-vision.md

## Project name
**Sketch Vibe**

## One-line description
A local-first, client-side AI chat + voice app that renders responses into a user-generated, visually rich “canvas” (not plain markdown), with optional web search and BYOK model/voice providers.

---

## Problem statement
Most AI chat experiences present dense information in a uniform, markdown-heavy format that is hard to parse—especially for complex reasoning involving tables, numbers, comparisons, formulas, and structured planning. This forces users to mentally “re-layout” information, increasing cognitive load and reducing comprehension.

**Sketch Vibe** solves this by letting users generate and iterate a beautiful, structured **conversation canvas** (theme + UI components + layout) via an AI-guided studio, then rendering AI outputs as readable visual blocks (cards, tables, charts, callouts, formulas) inside that canvas—while also supporting multimodal interaction (chat + STT/TTS).

---

## Target users
1. **Builders & founders** brainstorming product strategy, requirements, and plans who need structured, skimmable outputs.
2. **Students & researchers** who need tables, explanations, formulas, and sourced summaries with citations.
3. **Analysts & operators** who work with numbers and comparisons and benefit from charts and structured summaries.
4. **Power users of LLMs** who want BYOK control, provider flexibility, and local-first privacy.

---

## Core MVP features (prioritized)
### P0 — Must ship
1. **Canvas Studio (Split Screen) — AI-driven Canvas Generation**
   - Dedicated “New Canvas” experience with:
     - Left: conversational UI to describe desired vibe (tone, colors, typography, density, component styling, background, shapes).
     - Right: live preview of a **full conversation page** populated with realistic placeholder content (user/assistant messages, cards, tables, charts, formulas, loading states).
   - Iterative loop: user chats → AI returns **CanvasSpec JSON patches** → preview updates immediately.
   - User actions: **Approve & Save** to local Canvas Library, Duplicate, Discard.

2. **CanvasSpec Rendering System (Deterministic, Safe UI)**
   - Constrained **CanvasSpec JSON** defines:
     - Design tokens (color roles, typography scale, spacing, radius, shadows)
     - Layout primitives and component styling (cards/callouts/tables/typography)
     - Optional decorative/background elements within constraints
   - App compiles CanvasSpec into a full-page UI system for consistent rendering.

3. **Conversation Experience Inside a Selected Canvas**
   - Standard chat UI enhanced by:
     - **Renderable blocks** (cards, callouts, tables, checklists, step flows, comparisons, code blocks, formulas).
     - **Plain text transcript** always available for copy/accessibility.
     - Streaming-friendly rendering (content appears progressively).

4. **Charts as First-Class Blocks (Chart.js)**
   - AI produces structured chart specs; app renders via **Chart.js**.
   - Supports common chart types: line, bar, stacked bar, area, pie/donut; multi-series; legends/tooltips.
   - Charts appear as styled blocks consistent with the active canvas.

5. **Voice + Chat (STT/TTS)**
   - STT provider toggle:
     - OpenAI Whisper
     - ElevenLabs Scribe
   - TTS provider toggle:
     - OpenAI TTS
     - ElevenLabs TTS
   - Assistant can respond in **text + voice** simultaneously (when enabled).

6. **BYOK Provider Settings (Local-First)**
   - Users bring their own API keys for:
     - OpenAI
     - Anthropic
     - Gemini
     - Grok
   - Keys stored locally in the browser (no server account required).
   - Per-conversation/provider selection support (at minimum: choose active model/provider).

7. **Optional Web Search Tool (Tavily, BYOK)**
   - Setting: **Enable Web Search** + Tavily API key.
   - When enabled: “Web mode” can be toggled per conversation/per message.
   - Responses show citations and a Sources panel only when web search was used.
   - When disabled/no key: tool is unavailable; UI hides web search controls.

8. **Conversation History Sidebar (ChatGPT-like)**
   - Persistent left sidebar:
     - List conversations (title, last updated)
     - **Inline title edit**
     - **Search** (titles + message content)
     - Delete with confirmation (optional undo toast)
     - Basic time-based grouping (Today / Yesterday / Last 7 days / Older)
   - Each conversation stores its associated `canvasId` and settings.

9. **Local-Only Persistence**
   - All user data stored in the browser:
     - IndexedDB: conversations, messages, canvases, canvas library
     - localStorage: UI prefs, toggles, counters (e.g., tip prompt cadence)
   - Export/Import JSON for backup and manual sharing of canvases/conversations.

10. **Hosted vs Self-Hosted Distribution + Tip Prompt Rules**
   - **Self-host (open source):** no tip prompt shown.
   - **Hosted (free):** every ~3 conversations show a **dismissible** tip modal (not gated).
   - Tip via Stripe (e.g., Payment Link); user can dismiss and continue.

---

## Features explicitly cut from MVP
1. **Marketplace / public gallery / community template feed** (no discovery layer in MVP).
2. **Drag-and-drop / WYSIWYG manual canvas editor** (canvas is created/iterated conversationally via AI, not by dragging blocks).
3. **User accounts, cloud sync, team collaboration** (local-first only in MVP).
4. **Advanced analytics/telemetry dashboard** (beyond minimal, privacy-respecting diagnostics if any).
5. **Complex chart authoring UI** (charts are generated via AI chart specs; no manual chart builder UI in MVP).
6. **Fine-grained permissions, multi-device sync, offline cross-device** (not in MVP).
7. **Provider-side prompt marketplace / prompt sharing** (not in MVP).

---

## Success metrics
### Activation & onboarding
- **Time to first saved canvas:** median < 5 minutes from first open.
- **Canvas Studio completion rate:** % users who save at least one canvas in first session.
- **First conversation started rate:** % users who start a conversation after saving/selecting a canvas.

### Engagement & retention
- **D1 / D7 retention** (local-first proxy via returning sessions).
- **Conversations per active user per week.**
- **Canvas reuse rate:** % conversations using an existing saved canvas vs default.

### Product quality (visual comprehension)
- **Block usage distribution:** tables/cards/charts/formulas used per conversation.
- **User edits/iterations per canvas before saving** (healthy iteration indicates the studio is useful).
- **Error rate for render blocks/canvas spec validation** (should trend toward near-zero).

### Voice & tools adoption
- **Voice feature adoption:** % users who enable STT/TTS and complete at least one voice exchange.
- **Web search adoption (when enabled):** % of users with Tavily key who use web mode at least once; citations shown per response.

### Monetization (hosted)
- **Tip prompt dismissal rate vs tip conversion rate** (non-gated, measure sentiment).
- **Tip conversion per 100 active users** (lightweight indicator without harming UX).

### Reliability & performance
- **App responsiveness:** canvas preview updates feel instant (target < 200ms UI update after spec apply).
- **IndexedDB stability:** low incidence of storage corruption or failed loads.
- **Client-side rendering safety:** zero XSS injection vectors via constrained CanvasSpec and block renderer.