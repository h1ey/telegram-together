# Telegram Together (concept prototype)

One ✦ button in the message bar turns any chat into a shared activity: games or cinema, with the conversation still running underneath.

**Unofficial concept. Not affiliated with, or endorsed by, Telegram.** Everything in the prototype is simulated: the friend ("Maya") and every opponent are scripted, invitations and synchronisation are local, and the cinema is a poster-based preview with no streaming.

## Demo
- **Video:** [`Telegram-Together-Demo.mp4`](Telegram-Together-Demo.mp4) (about 2 minutes, recorded from this exact code).
- **Live page:** enable GitHub Pages (Settings → Pages → Deploy from branch → `main` / root), or simply open `index.html`.

## Feature status

| Feature | Status |
|---|---|
| Dark and light themes, Telegram-style chat, profile page | Working (UI only) |
| Chess: legal moves, check, checkmate, castling, en passant, promotion (always to queen) | **Working** |
| Chess opponent | Local 2-move search, not a human |
| Backgammon: dice, hits, bar, bearing off | **Working** against a local bot |
| Tic-Tac-Toe and the 3-question Knowledge Challenge, XP card | **Working** against a local bot |
| Invitation flow ("Maya accepts") | **Simulated** |
| Friend's messages, voice notes, reactions | **Simulated** (scripted, reacts to game and film events) |
| Cinema: poster intro clip, original synthesised score, reactions, double-tap heart | Working locally |
| Film playback, shared pause and seek | **Not implemented** (no video, no sync) |
| Real two-person multiplayer | **Not implemented** (needs a relay server) |
| Server-side validation, accounts, persistence | Not implemented |

## Run it
- Open `index.html` in a browser (phone or desktop). No build step, no dependencies.
- If your browser blocks local files, serve the folder: `python3 -m http.server`, then open `http://localhost:8000`.
- `Telegram-Together-Prototype.html` is the same prototype as a single file with everything embedded.

## Try this
1. Tap **Maya Hart**, then the **✦** button in the message bar.
2. **Games:** pick Chess, Backgammon, Tic-Tac-Toe or the Knowledge Challenge. Maya gets an invitation; when she accepts, the game opens in a dock above the chat.
3. **Cinema:** pick two films, tap *Vote with Maya*, then the winner plays a 5-second intro followed by a shared screen with live reactions (tap the buttons or double-tap the screen).

## Structure
```
index.html          markup: chat list, chat, settings, profile, bottom sheet
css/styles.css      all styles; themes use CSS variables (dark first, light in Settings)
js/app.js           all behaviour
assets/avatars/     portraits (AI-generated, plus the author's own profile picture)
assets/posters/     film posters (WebP, AI-generated)
assets/intros/      5-second poster-based intro clips (MP4, no audio)
assets/dice/        backgammon die faces (SVG)
smoke-test.js       automated smoke test
```

## How the feature plugs in
- **Invitation flow** (`invite(kind, title, icon)`): posts an invitation card in the chat, pings the friend (simulated), and on accept calls `openAct`.
- **Dock** (`openAct`): opens an activity above the chat. The chat keeps scrolling, typing and reacting. The dock can be minimised or ended, and posts a result card back to the chat.
- **Game registry:** a game is anything that can mount itself into the dock.
  ```js
  registerGame({
    id: "checkers",
    title: "Checkers",
    mount(dh, me) { /* render into the dock */ }
  });
  ```
  `dh(icon, title)` returns the dock header markup; `me` is the session token to check before async work (`if (me !== sess) return`). Then add a button with `data-k="checkers"` to the game picker (`games()` in `js/app.js`). Built-in games (`chess`, `bg`, `xo`, `quiz`) are registered this way.
- **Cinema** (`cinema`, `filmP`): poster grid, vote with a friend, intro clip, then the shared screen. Reactions float up the sides; the friend reacts on her own on a schedule (`MR`).
- **Conversation** (`mq`, scripted lines per activity): the friend types, sends voice notes and reacts with human pacing.

## Telegram integration notes
Checked against Telegram's Mini Apps documentation (<https://core.telegram.org/bots/webapps>):
- Mini Apps can be opened from a direct link in any chat, with the `startapp` and `mode=compact` parameters.
- Direct-link launches expose `chat_type` and `chat_instance`, so an app can tell which chat it was opened from.
- Launch data is signed and must be validated **on a server** with the bot token.

What this means:
1. **A Mini App can host the games and the film room today**, using the `startapp` value as a room id and a small WebSocket relay for moves, play/pause and reactions.
2. **A Mini App cannot dock above a live chat.** It opens as a sheet. The docked layout shown here needs changes inside the Telegram client itself.
3. **Native invitations, presence ("2 in the room") and result cards** need client work, and probably new message types on Telegram's side.

## Notes for implementers
- Game state here is client-side. In production it must be server-authoritative (cheat protection) and synchronised through Telegram's existing real-time layer.
- Cinema sync would use content the participants already have or a licensed partner; Telegram would not host films.
- The intro clips are H.264 MP4. If a clip cannot play, the app falls back to the poster treatment.
- Header buttons (Edit, stories, compose) and the gift icon are visual only.
- Respects `prefers-reduced-motion` for the intro clip.

## Tests
```
npm i playwright
npx playwright install chromium
node smoke-test.js
```
The test checks equal chess squares, the opponent's reply, backgammon dice, and that no console errors occur. It uses two test hooks, `window.__t` (chess) and `window.__bg` (backgammon), which exist only for testing. The prototype was tested in headless Chromium, not on a physical phone.

## Credits and assets
- Film posters and portraits are **AI-generated**. `assets/avatars/me.jpg` is the author's own profile picture.
- Film titles and taglines are fictional placeholders and are not affiliated with any existing film or studio. If a title coincides with a real film, treat it as a placeholder to be renamed.
- The soundtrack is synthesised in the browser (Web Audio API). No third-party music is used.

## License
MIT. See `LICENSE`.
