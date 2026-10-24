# Telegram Together: Pitch & Master Prompt

An unofficial concept for the Telegram Design team.
Code: this repository. Demo video: [`Telegram-Together-Demo.mp4`](Telegram-Together-Demo.mp4).

**One line:** Telegram is where friends already talk. *Together* makes it where they play and watch, without ever leaving the conversation.

**Tagline options:** "One tap. Same room." · "Don't just chat. Do something." · "Every chat, a place to hang out."

---

## Part 1: The message to send (ready to paste)

**Subject:** Concept: "Together", a shared-activity layer for every Telegram chat

Hi Telegram Design team,

I am a fan of how Telegram feels: fast, clean and a little playful. I built a small concept to show where that personality could go next, and I would love your honest reaction.

**The problem.** Today, when two friends want to play chess or watch something at the same time, the conversation stops. They share a link, count "3, 2, 1, press play," switch apps, and come back to find the chat has gone quiet. Shared moments are exactly what make people open a messenger every day, and right now they happen elsewhere.

**The idea.** One ✦ button beside the message box opens a sheet with Games, a Knowledge Challenge and Cinema. Pick one and your friend gets an invitation. When she accepts, the activity opens in a dock above the same screen while the chat keeps running underneath. You tease, send voice notes and react while a game is on or a film is playing. Hearts float across the screen, counters tick up, and the result lands back in the thread as a card everyone can see.

**Why it belongs in Telegram.**
1. **It extends what Telegram already is.** Mini Apps have proven that people want to play inside Telegram. Together does not compete with them; it is the missing social layer: presence ("Maya is in the room"), invitations, synchronised state and a shared result in the chat. Any Mini App could plug into it.
2. **It turns a message into a reason to return.** A chat with a game in progress or a film night planned is a chat people open again tonight. That is retention built from friendship, not notifications.
3. **Every invitation is a growth loop.** To join, your friend has to be on Telegram. Inviting becomes the most natural way to bring someone in and keep them.
4. **It differentiates Telegram in one demo.** Most messengers send messages. Few let you share an evening. The idea explains itself in ten seconds of video.
5. **It fits Telegram's business model.** Premium could unlock extra game themes and private rooms, Stars could power tips and tournaments, and creators and communities could host events in their groups.
6. **It stays light and private.** Nothing new is stored beyond the session; the dock is dismissible; the activity is a guest, and the conversation stays the main character.

**What the prototype shows (static web files, no backend).** Light and dark themes in Telegram's visual language; a profile page; Chess with a full rules engine; Backgammon with real dice; Tic-Tac-Toe; a three-question quiz with XP; a cinema picker with a movie-night vote; a cinematic intro with an original synthesised score; live reactions with a double-tap heart; and a shareable result card.

**What is simulated, to be clear.** The second participant (Maya) and all opponents are scripted. Invitations and synchronisation are simulated. The cinema shows a poster preview, not real streaming. Nothing is connected to Telegram. Posters and portraits are AI-generated.

**What I would suggest.** A small pilot in one-to-one chats: two games plus reactions, measured by invitation acceptance rate, sessions per active chat, and chats that return within seven days. I am happy to refine, simplify or redesign any part.

Thank you for your time and for building something worth designing for.


---

## Part 2: Master prompt (for a designer, engineer or AI assistant extending the concept)

```
ROLE
You are a senior product designer and front-end engineer working on "Telegram Together",
an unofficial concept for the Telegram Design team.

GOAL
Turn a chat into a place where friends do things together, without leaving the
conversation. The feature must feel native to Telegram: calm, fast, friendly, and visually
consistent with its bubbles, reactions, voice messages and themes.

POSITIONING
Together is a social layer on top of Mini Apps, not a rival to them. It adds presence,
invitations, synchronised state and a shared result card. Any Mini App could register
with it.

CORE INTERACTION
1. A gradient ✦ button beside the message field opens a bottom sheet:
   Games (Chess, Backgammon, Tic-Tac-Toe, Knowledge Challenge, More games) and
   Cinema (search, poster grid, "Vote with a friend").
2. Choosing an activity posts an invitation card in the chat and pings the friend.
3. On accept, the activity opens in a dock ABOVE the chat. The chat keeps scrolling,
   typing and reacting underneath. The dock can be minimised or ended.
4. The result is posted back to the chat as a card, with a shareable XP card.
5. Cinema reactions: four reaction buttons with live counters, floating emoji from both
   people, and a double-tap heart on the screen.

DESIGN RULES
- The conversation is primary; the activity is secondary and dismissible.
- One invitation flow for every activity. A new game registers with:
  registerGame({ id, title, mount(el, session), onRemoteMove(move) })
- Light, dark and system themes through CSS variables only; no hard-coded colours.
  Dark palette: #151e27 background, #1d2733 surfaces, #229af0 accent, purple outgoing bubbles.
- Board squares must always be perfectly square. Highlights (selected, last move, check,
  legal target) are overlays and never replace the base colour of a square.
- Dice must show their pips and the result in words ("You rolled 5 & 2").
- Touch targets of at least 44px. Respect safe areas. Portrait first.
- Motion is short and purposeful (under 400ms), except the cinema intro (5s).

CONVERSATION QUALITY (the friend, "Maya")
- Reacts to what is happening: captures, checks, doubles, hits, quiz results, film moments.
- Human pacing: "typing..." or "recording voice message..." before each message, a delay
  proportional to length, and read receipts on the user's messages.
- Mixes text, voice notes, big-emoji stickers and reactions.
- Shows genuine enthusiasm for the shared experience (the same-room feeling, no link or
  countdown, the result landing in the chat) in varied, non-repeating language.
- Tone: warm, playful, short sentences. Never salesy.

AUDIO
- Original, synthesised score only (strings, tribal drums, flute, wind, reverb).
  No third-party music. It must pause and resume with the film, and be mutable.

HONESTY CONSTRAINTS
- Label everything simulated: opponents, invitations, synchronisation, streaming.
- Use only licensed or original artwork before any public sharing.
- Never show personal data (for example a phone number) in demo screens.

DELIVERABLES
A static web prototype, a short screen recording, and the pitch message.
```

---

## Part 3: Anticipated objections and answers

| Objection | Answer |
|---|---|
| "This can already be a Mini App." | Mini Apps launch a separate experience. Together adds what they lack: presence, invitations, a dock above the live chat, synchronised state and a result card. It is a layer Mini Apps can use. |
| "Cinema has licensing problems." | The concept syncs playback of content the participants already have or that a licensed partner provides. Telegram would not host or stream films. |
| "Invitations could become spam." | Invitations are limited to existing contacts and group members, can be muted per chat, and expire after a short time. |
| "Games need cheat protection." | Game state must be server-authoritative in production. The prototype is client-side by design. |
| "It adds clutter to the chat screen." | One button, one sheet, one dismissible dock. Nothing appears unless a person starts it. |
