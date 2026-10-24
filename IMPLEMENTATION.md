# Implementation readiness

This document separates what the prototype **does**, what it **simulates**, and what a **real** implementation needs. Nothing here claims native Telegram integration. File names for the official clients were checked against their public repositories (see [Native client](#path-b-native-client)); everything marked *proposed* is a design recommendation, not verified behaviour.

## 1. What is real and what is simulated

| Area | Real in this prototype | Simulated or local-only |
|---|---|---|
| Chess, backgammon, tic-tac-toe, quiz | Rules, turn logic, results, XP | The opponent is a local bot |
| Chat | UI, message list, voice-note player, read-receipt animation | The friend's messages are scripted and react to local events |
| Invitation | Card, accept/decline UI | "Maya accepts" is a timer |
| Cinema | Vote, intro clip, shared-screen UI, synthesised score, reactions | No film playback, no shared timeline |
| Presence ("2 in the room") | Label | Static |
| Persistence | Theme only (`localStorage`) | Sessions, scores and XP are lost on reload |

## 2. Code map and integration seams

All behaviour is in `js/app.js` (about 2,000 lines, no dependencies). Line numbers refer to this commit.

| Seam | Function (line) | Replace or extend with |
|---|---|---|
| Start an activity | `invite()` (1123) → `openAct()` (1160) | Send a real invitation; open the dock when the other person accepts |
| Game registry | `registerGame()` (1153), `GAMES` | A game is `{ id, title, mount(dh, me) }` |
| End and cleanup | `endDock()` (1110) | Close the session on the server |
| Result card | `done()` (1751) | Post the result as a message everyone sees |
| Opponent logic | `bot()` inside `chess` (1178), bot turns in the backgammon and `xo` (1307) modules | Apply the **remote participant's** move instead of a bot move |
| Friend's behaviour | `mq()` (405), `mstep()` (422), `EVP`, `SC`, `OPEN` | Replaced by real messages; keep the typing and voice-note UI |
| Cinema timeline | `filmP()` (1890), schedules `CM` (chat) and `MR` (reactions) | Drive from a shared `{ state, position, timestamp }` |
| Audio | `scoreFilm()` (904), `cueFilm()` (1082) | Keep; it exposes `stop`, `mute` and `pause` |

**Lifecycle contract.** Every asynchronous callback checks the session token (`me !== sess`) before touching the UI. `endDock()` invalidates it.

## 3. Verified behaviour

Run `node smoke-test.js` and `node lifecycle-test.js` (see README, Tests). Results on this commit, headless Chromium:

- **Smoke test:** 4 of 4 checks pass (equal chess squares, opponent replies, dice shown, no errors).
- **Lifecycle test:** after two rounds of opening and ending chess, backgammon, tic-tac-toe, quiz and cinema: 0 active intervals, 0 animation-frame callbacks per second, every `AudioContext` closed, 0 messages arriving after the sessions ended, 0 console errors.

Not verified: physical phones, real Telegram, intro-clip playback on every browser, audio by ear.

## 4. What real synchronisation needs

**Proposed event schema** (JSON, one room per activity):

```
invite    { room, kind, from }
accept    { room, by }                     decline { room, by }
move      { room, seq, payload }           // payload depends on the game
roll      { room, seq, dice }              // backgammon, generated on the server
result    { room, outcome, scores }
reaction  { room, emoji, at }
playback  { room, state: "playing"|"paused", position, sentAt }
presence  { room, members }
```

- **Games:** the server owns the state, validates every move with the same rules, and generates dice. Clients only render.
- **Cinema:** one participant is the host. Others compute `position + (now - sentAt)` and seek only when the drift is larger than about half a second (*proposed*). Content must come from the participants or a licensed partner.
- **Sessions:** a room id, an expiry, reconnection with the last `seq`, and a rate limit on invitations.

## Path A: Mini App

Based on <https://core.telegram.org/bots/webapps>: a Mini App can be opened from a direct link in any chat, with `startapp` and `mode=compact`; direct-link launches expose `chat_type` and `chat_instance`; launch data is signed and must be validated on a server with the bot token.

Steps: (1) wrap the app with `Telegram.WebApp`; (2) use the `startapp` value as the room id; (3) add a small WebSocket relay that implements section 4; (4) validate launch data on the server; (5) create the bot in BotFather and host the static files and the relay over HTTPS.

Limits: a Mini App opens as a sheet and **cannot dock above a live chat**. Native invitation cards and presence are not available to it.

## Path B: Native client

Required for the docked layout. Entry points below were found by listing the official repositories.

**iOS** (`TelegramMessenger/Telegram-iOS`)

| Purpose | File |
|---|---|
| Chat screen and layout (where a dock above the message list would go) | `submodules/TelegramUI/Sources/ChatController.swift`, `submodules/TelegramUI/Sources/ChatControllerNode.swift` |
| ✦ button beside the input | `submodules/TelegramUI/Components/Chat/ChatTextInputPanelNode/Sources/ChatTextInputPanelNode.swift` |
| Alternative entry (attachment menu) | `submodules/AttachmentUI/Sources/AttachmentController.swift` |
| Existing Mini App container (could host a game inside the dock) | `submodules/WebUI/Sources/WebAppController.swift` |
| Invitation and result cards | `submodules/TelegramUI/Components/Chat/ChatMessageBubbleItemNode/Sources/ChatMessageBubbleItemNode.swift` |

Build (from the repository README): install Xcode, copy and edit `build-system/template_minimal_development_configuration.json` with your own `api_id` data, then generate the project with `python3 build-system/Make/Make.py` (Bazel).

**Android** (`DrKLO/Telegram`)

| Purpose | File |
|---|---|
| Chat screen | `TMessagesProj/src/main/java/org/telegram/ui/ChatActivity.java` |
| Input bar (✦ button) | `TMessagesProj/src/main/java/org/telegram/ui/Components/ChatActivityEnterView.java` |
| Attachment menu | `TMessagesProj/src/main/java/org/telegram/ui/Components/ChatAttachAlert.java` |
| Existing Mini App containers | `TMessagesProj/src/main/java/org/telegram/ui/bots/BotWebViewSheet.java`, `TMessagesProj/src/main/java/org/telegram/ui/web/BotWebViewContainer.java` |
| Invitation and result cards | `TMessagesProj/src/main/java/org/telegram/ui/Cells/ChatMessageCell.java` |

Build (from the repository README): Android Studio 2025.1.4, Android NDK 27.2.12479018, Android SDK 36; clone with submodules; fill `BuildVars.java`; provide your own `api_id`, keystore and `google-services.json`.

**Licence and naming rules from both READMEs:** obtain your own `api_id`; do not present the app as Telegram or use its logo; publish your code under the licence terms.

**Needs Telegram itself (likely, not verified):** new message or service-message types for invitations and session state, server-side presence, abuse and rate limits, and clearance for any film content.

## 5. Roadmap with exit criteria

1. **Mini App pilot.** Exit: two real phones play a full chess game and a backgammon game through the relay; illegal moves are rejected by the server.
2. **Film room.** Exit: two clients stay within about 0.5 s while one pauses, seeks and resumes.
3. **Native dock prototype** in a fork. Exit: the dock opens above a live chat on a simulator or device and the chat stays usable.
4. **Telegram-side work.** Exit: invitation and session messages exist in the protocol, with moderation limits.

## 6. Known limitations

Web prototype only. No server, accounts, anti-cheat or persistence. Posters and portraits are AI-generated; film titles are placeholders. Not affiliated with Telegram.
