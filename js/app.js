const N8 = [
    [-2, -1],
    [-2, 1],
    [-1, -2],
    [-1, 2],
    [1, -2],
    [1, 2],
    [2, -1],
    [2, 1],
  ],
  K8 = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ],
  D4 = [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ],
  S4 = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
const SQ = (i) => "abcdefgh"[i & 7] + (8 - (i >> 3)),
  IX = (s) => (8 - +s[1]) * 8 + "abcdefgh".indexOf(s[0]);
class Chess {
  constructor() {
    const b = Array(64).fill(null),
      k = "RNBQKBNR";
    for (let c = 0; c < 8; c++) {
      b[c] = "b" + k[c];
      b[8 + c] = "bP";
      b[48 + c] = "wP";
      b[56 + c] = "w" + k[c];
    }
    Object.assign(this, { b, t: "w", cs: { wK: 1, wQ: 1, bK: 1, bQ: 1 }, ep: -1, hm: 0, _l: null });
  }
  load(f) {
    const [p, t, c, e, h] = f.split(" "),
      b = [];
    for (const ch of p) {
      if (ch === "/") continue;
      if (/\d/.test(ch)) for (let i = 0; i < +ch; i++) b.push(null);
      else b.push((ch === ch.toUpperCase() ? "w" : "b") + ch.toUpperCase());
    }
    Object.assign(this, {
      b,
      t,
      cs: { wK: +c.includes("K"), wQ: +c.includes("Q"), bK: +c.includes("k"), bQ: +c.includes("q") },
      ep: e === "-" ? -1 : IX(e),
      hm: +h || 0,
      _l: null,
    });
  }
  att(sq, by) {
    const b = this.b,
      r = sq >> 3,
      c = sq & 7,
      d = by === "w" ? 1 : -1,
      ok = (x, y) => x >= 0 && x < 8 && y >= 0 && y < 8;
    for (const dc of [-1, 1]) if (ok(r + d, c + dc) && b[(r + d) * 8 + c + dc] === by + "P") return true;
    for (const [dr, dc] of N8) if (ok(r + dr, c + dc) && b[(r + dr) * 8 + c + dc] === by + "N") return true;
    for (const [dr, dc] of K8) if (ok(r + dr, c + dc) && b[(r + dr) * 8 + c + dc] === by + "K") return true;
    for (const [ds, pc] of [
      [D4, "B"],
      [S4, "R"],
    ])
      for (const [dr, dc] of ds) {
        let rr = r + dr,
          cc = c + dc;
        while (ok(rr, cc)) {
          const x = b[rr * 8 + cc];
          if (x) {
            if (x[0] === by && (x[1] === pc || x[1] === "Q")) return true;
            break;
          }
          rr += dr;
          cc += dc;
        }
      }
    return false;
  }
  pseudo() {
    const b = this.b,
      s = this.t,
      o = s === "w" ? "b" : "w",
      dir = s === "w" ? -1 : 1,
      out = [];
    for (let i = 0; i < 64; i++) {
      const p = b[i];
      if (!p || p[0] !== s) continue;
      const r = i >> 3,
        c = i & 7,
        k = p[1];
      const add = (t, x) => out.push({ f: i, t, p: k, c: b[t] ? b[t][1] : x && x.ep ? "P" : null, ...x });
      if (k === "P") {
        const pr = r + dir === (s === "w" ? 0 : 7),
          t1 = i + dir * 8;
        if (!b[t1]) {
          if (pr) "QRBN".split("").forEach((q) => add(t1, { pr: q }));
          else {
            add(t1);
            if (r === (s === "w" ? 6 : 1) && !b[t1 + dir * 8]) add(t1 + dir * 8, { dp: 1 });
          }
        }
        for (const dc of [-1, 1]) {
          const cc = c + dc;
          if (cc < 0 || cc > 7) continue;
          const t = t1 + dc;
          if (b[t] && b[t][0] === o) {
            if (pr) "QRBN".split("").forEach((q) => add(t, { pr: q }));
            else add(t);
          } else if (t === this.ep) add(t, { ep: 1 });
        }
      } else if (k === "N" || k === "K") {
        for (const [dr, dc] of k === "N" ? N8 : K8) {
          const rr = r + dr,
            cc = c + dc;
          if (rr < 0 || rr > 7 || cc < 0 || cc > 7) continue;
          const t = rr * 8 + cc;
          if (!b[t] || b[t][0] === o) add(t);
        }
        if (k === "K") {
          const h = s === "w" ? 60 : 4;
          if (i === h && !this.att(h, o)) {
            if (
              this.cs[s + "K"] &&
              !b[h + 1] &&
              !b[h + 2] &&
              b[h + 3] === s + "R" &&
              !this.att(h + 1, o) &&
              !this.att(h + 2, o)
            )
              add(h + 2, { ck: 1 });
            if (
              this.cs[s + "Q"] &&
              !b[h - 1] &&
              !b[h - 2] &&
              !b[h - 3] &&
              b[h - 4] === s + "R" &&
              !this.att(h - 1, o) &&
              !this.att(h - 2, o)
            )
              add(h - 2, { cq: 1 });
          }
        }
      } else
        for (const [dr, dc] of k === "B" ? D4 : k === "R" ? S4 : K8) {
          let rr = r + dr,
            cc = c + dc;
          while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) {
            const t = rr * 8 + cc;
            if (!b[t]) add(t);
            else {
              if (b[t][0] === o) add(t);
              break;
            }
            rr += dr;
            cc += dc;
          }
        }
    }
    return out;
  }
  mk(m) {
    const s = this.t,
      n = Object.create(Chess.prototype),
      b = this.b.slice();
    n.b = b;
    n.cs = { ...this.cs };
    b[m.t] = m.pr ? s + m.pr : b[m.f];
    b[m.f] = null;
    if (m.ep) b[m.t + (s === "w" ? 8 : -8)] = null;
    if (m.ck) {
      b[m.t - 1] = b[m.t + 1];
      b[m.t + 1] = null;
    }
    if (m.cq) {
      b[m.t + 1] = b[m.t - 2];
      b[m.t - 2] = null;
    }
    if (m.p === "K") {
      n.cs[s + "K"] = 0;
      n.cs[s + "Q"] = 0;
    }
    for (const q of [m.f, m.t]) {
      if (q === 63) n.cs.wK = 0;
      if (q === 56) n.cs.wQ = 0;
      if (q === 7) n.cs.bK = 0;
      if (q === 0) n.cs.bQ = 0;
    }
    n.ep = m.dp ? (m.f + m.t) >> 1 : -1;
    n.hm = m.p === "P" || m.c ? 0 : this.hm + 1;
    n.t = s === "w" ? "b" : "w";
    n._l = null;
    return n;
  }
  legal() {
    if (this._l) return this._l;
    const s = this.t,
      o = s === "w" ? "b" : "w";
    return (this._l = this.pseudo().filter((m) => {
      const n = this.mk(m);
      return !n.att(n.b.indexOf(s + "K"), o);
    }));
  }
  turn() {
    return this.t;
  }
  get(q) {
    const p = this.b[IX(q)];
    return p ? { type: p[1].toLowerCase(), color: p[0] } : null;
  }
  board() {
    return Array.from({ length: 8 }, (_, r) => Array.from({ length: 8 }, (_, c) => this.get(SQ(r * 8 + c))));
  }
  moves(o = {}) {
    let l = this.legal();
    if (o.square) {
      const f = IX(o.square);
      l = l.filter((m) => m.f === f);
    }
    return l.map((m) => ({
      from: SQ(m.f),
      to: SQ(m.t),
      captured: m.c ? m.c.toLowerCase() : undefined,
      promotion: m.pr ? m.pr.toLowerCase() : undefined,
    }));
  }
  move(o) {
    const f = IX(o.from),
      t = IX(o.to),
      pr = (o.promotion || "q").toUpperCase(),
      m = this.legal().find((x) => x.f === f && x.t === t && (!x.pr || x.pr === pr));
    if (!m) return null;
    const n = this.mk(m);
    this.b = n.b;
    this.cs = n.cs;
    this.ep = n.ep;
    this.hm = n.hm;
    this.t = n.t;
    this._l = null;
    return m;
  }
  in_check() {
    return this.att(this.b.indexOf(this.t + "K"), this.t === "w" ? "b" : "w");
  }
  in_checkmate() {
    return this.in_check() && !this.legal().length;
  }
  ins() {
    const ps = this.b.filter((p) => p && p[1] !== "K");
    return !ps.length || (ps.length === 1 && /[NB]/.test(ps[0][1]));
  }
  in_draw() {
    return (!this.in_check() && !this.legal().length) || this.hm >= 100 || this.ins();
  }
  game_over() {
    return !this.legal().length || this.in_draw();
  }
}
const CLIP = {
  ashes: { mp4: "assets/video/ashes.mp4", webm: "assets/video/ashes.webm" },
  canyon: { mp4: "assets/video/canyon.mp4", webm: "assets/video/canyon.webm" },
};
const DIE = {
  1: "assets/dice/die_1.svg",
  2: "assets/dice/die_2.svg",
  3: "assets/dice/die_3.svg",
  4: "assets/dice/die_4.svg",
  5: "assets/dice/die_5.svg",
  6: "assets/dice/die_6.svg",
};
const IMG = {
  ashes: "assets/posters/ashes_poster.webp",
  canyon: "assets/posters/canyon_poster.webp",
};
const $ = (i) => document.getElementById(i),
  pick = (a) => a[Math.floor(Math.random() * a.length)];
const P = {
  maya: { bg: ["#ff9a9e", "#fad0c4"], sk: "#f6c9a8", hr: "#3b1f14", sh: "#7B61FF", f: 1 },
  leo: { bg: ["#84fab0", "#8fd3f4"], sk: "#c68b5e", hr: "#111", sh: "#e8505b", f: 0 },
  nora: { bg: ["#a18cd1", "#fbc2eb"], sk: "#e9b48f", hr: "#8a3b12", sh: "#1b998b", f: 1 },
  grp: { bg: ["#f6d365", "#fda085"], e: "📚" },
  atlas: { bg: ["#4facfe", "#00f2fe"], e: "🚀" },
  tg: { bg: ["#2AABEE", "#229ED9"], e: "✈️" },
};
P.alex = { bg: ["#8ec5fc", "#e0c3fc"], sk: "#e2b48f", hr: "#2a1a12", sh: "#2AABEE", f: 0 };
const AV = {
  maya: "assets/avatars/maya.jpg",
  leo: "assets/avatars/leo.jpg",
  nora: "assets/avatars/nora.jpg",
  alex: "assets/avatars/alex.webp",
};
function av(k) {
  if (AV[k])
    return (
      '<div class="av"><img src="' + AV[k] + '" alt="" style="width:100%;height:100%;object-fit:cover"></div>'
    );
  const p = P[k];
  if (p.e)
    return `<div class="av" style="background:linear-gradient(135deg,${p.bg[0]},${p.bg[1]})">${p.e}</div>`;
  return `<div class="av"><svg viewBox="0 0 40 40"><defs><linearGradient id="a${k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.bg[0]}"/><stop offset="1" stop-color="${p.bg[1]}"/></linearGradient></defs><rect width="40" height="40" fill="url(#a${k})"/><ellipse cx="20" cy="42" rx="14" ry="11" fill="${p.sh}"/><circle cx="20" cy="18" r="8" fill="${p.sk}"/><path d="M11.5 17c0-9 17-9 17 0c-3-4-14-4-17 0z" fill="${p.hr}"/>${p.f ? `<path d="M11.5 16v10c2 0 3-3 3-6zM28.5 16v10c-2 0-3-3-3-6z" fill="${p.hr}"/>` : ""}<circle cx="17" cy="19" r="1" fill="#222"/><circle cx="23" cy="19" r="1" fill="#222"/><path d="M17 22.5q3 2 6 0" stroke="#a33" fill="none" stroke-width="1"/></svg></div>`;
}
const ROWS = [
  ["maya", "Maya Hart", "Bring it 😏", "9:41", "✓✓"],
  ["leo", "Leo Park", "Voice message (0:14)", "9:12", "2"],
  ["grp", "Study Squad", "Priya: notes are up", "8:55", ""],
  ["nora", "Nora Bennett", "See you at the gallery ✨", "Yesterday", ""],
];
$("list").innerHTML = ROWS.map(
  (r, i) =>
    `<button class="row" data-i="${i}">${av(r[0])}<div class="t"><b${/^\d$/.test(r[4]) ? ' class="un"' : ""}>${r[1]}<i>${r[4] === "✓✓" ? '<span style="color:var(--ac)">✓✓</span> ' : ""}${r[3]}</i></b><p>${r[2]}${/^\d$/.test(r[4]) ? `<span class="badge" style="float:right">${r[4]}</span>` : ""}</p></div></button>`,
).join("");
$("hav").outerHTML = av("maya").replace('class="av"', 'class="av" id="hav"');
document.querySelectorAll(".row").forEach(
  (b) =>
    (b.onclick = () => {
      if (b.dataset.i === "0") {
        $("home").hidden = true;
        $("chat").hidden = false;
        $("tabs").hidden = true;
      } else toast("Demo: only the chat with Maya is open");
    }),
);
$("back").onclick = () => {
  endDock();
  $("chat").hidden = true;
  $("tabs").hidden = false;
  tab("home");
};
function toast(t) {
  const n = $("ntf");
  n.innerHTML = `<div style="flex:1">${t}</div>`;
  n.classList.add("on");
  setTimeout(() => n.classList.remove("on"), 1800);
}
// ---- chat ----
const msgs = $("msgs"),
  dock = $("dock"),
  now = () => {
    const d = new Date();
    return d.getHours() + ":" + String(d.getMinutes()).padStart(2, "0");
  };
function add(h, c = "") {
  const d = document.createElement("div");
  d.className = "m " + c;
  d.innerHTML = c === "sys" ? h : h + `<i>${now()}${c === "me" ? '<span class="tk"> ✓</span>' : ""}</i>`;
  if (c === "me")
    setTimeout(() => {
      const t = d.querySelector(".tk");
      if (t) {
        t.textContent = " ✓✓";
        t.style.color = "var(--ac)";
      }
    }, 750);
  msgs.appendChild(d);
  msgs.scrollTop = msgs.scrollHeight;
  return d;
}
add("Today", "sys");
add("Are you free tonight? 🌙");
add("Always. Want a challenge?", "me");
add("Bring it 😏");
let sess = 0,
  film = null,
  game = null,
  manual = false,
  FA = null,
  LAST = null;
const said = new Set(),
  pu = (a) => {
    const f = a.filter((x) => !said.has(x)),
      x = pick(f.length ? f : a);
    said.add(x);
    return x;
  },
  wait = (ms) => new Promise((r) => setTimeout(r, ms)),
  status = (t) => {
    const e = $("stt");
    if (e) e.textContent = t;
  };
let QT = Promise.resolve(),
  qn = 0,
  lastEv = 0,
  LASTME = null,
  LB = 0;
function mq(steps, pri) {
  const me = sess;
  if (qn > 3 && !pri) return;
  qn++;
  QT = QT.then(async () => {
    try {
      for (const x of steps) {
        if (me !== sess) break;
        await mstep(x, me);
      }
    } catch (e) {
    } finally {
      qn--;
      status("online");
    }
  });
}
async function mstep(x, me) {
  if (typeof x === "number") return wait(x);
  if (x.me) {
    await wait(600);
    if (me === sess) mineMsg(x.me);
    return;
  }
  if (x.x) {
    if (LASTME && LASTME.isConnected) rxn(LASTME, x.x);
    return;
  }
  if (x.v) {
    status("recording voice message…");
    await wait(900 + x.v * 70);
  } else {
    const tx = x.e ? "12345678" : x.t || x;
    status("typing…");
    const b = document.createElement("div");
    b.className = "m tb";
    b.innerHTML = "<span></span><span></span><span></span>";
    msgs.appendChild(b);
    msgs.scrollTop = msgs.scrollHeight;
    await wait(Math.min(2300, 450 + tx.replace(/<[^>]+>/g, "").length * 32));
    b.remove();
  }
  if (me !== sess) return;
  status("online");
  x.v ? voice(x.v) : x.e ? add(`<span class="bigemo">${x.e}</span>`) : add(x.t || x);
}
const OPEN = [
    "Wait. It opened right on top of our chat?! I can still see everything 😳",
    "Hold on, we are not switching apps at all? This is so smooth 👀",
    "Why does this feel like we are in the same room? 🥹",
  ],
  GL = [
    "Not gonna lie, this beats sending screenshots of the board 😂",
    "Best part: we can trash talk while playing. Peak design.",
    "I keep forgetting this is a chat. It feels like a game night.",
  ],
  END = [
    "Honestly the best part is the result landing right here in the chat 🥹",
    "We are doing this every night now. Deal?",
    "Okay, can this be a real Telegram feature? Asking for a friend 😭",
  ];
const EVP = {
  move: [
    "Hmm, okay. I see you 👀",
    "Interesting choice...",
    "You play like someone who reads openings in the shower 😂",
  ],
  capture: ["HEY. That was my piece! 😤", "No mercy, huh? Noted.", "Okay, revenge is loading..."],
  check: ["Check?! Okay okay, I see you 😳", "Wow, straight for the king. Bold."],
  mcap: ["Sorry, not sorry 😌", "Mine now."],
  mcheck: ["Check 😏 breathe."],
  doubles: ["DOUBLES?! That is illegal 😤", "The dice clearly love you today."],
  hit: ["Did you just send me to the bar?! Rude 😤"],
  gothit: ["Back to the start, huh? Fine, brave move."],
};
function ev(k) {
  const n = Date.now();
  if (n - lastEv < 7000 || !EVP[k] || Math.random() < 0.2) return;
  lastEv = n;
  mq([pu(EVP[k])]);
}
const RP = {
  ask: [
    [
      "Honestly? I love it. It feels like we are in the same room, not on two phones 🥹",
      { v: 12 },
      "Telegram should ship this. Like, yesterday.",
    ],
    [
      'Okay real talk: this is the first time a "watch together" thing did not feel awkward 😭',
      'No links, no countdown, no "wait are you ready?". It just works.',
    ],
  ],
  laugh: ["😂😂", "Stop, I am crying", "I cannot with you 😭"],
  thanks: ["Always 💙", "Anytime. Same time tomorrow?"],
  hi: ["Hey you 👋", "Heyyy, ready?"],
  film: {
    boring: ["Give it a minute, the next scene picks up."],
    scary: ["I am hiding behind a pillow 😱", "Do NOT leave me alone with this scene 😭"],
    good: [
      "Totally! The atmosphere is excellent.",
      "Yes! Best scene so far 🔥",
      "Agreed, this is really well shot.",
    ],
  },
  game: { gg: ["Thanks! Rematch? 😄"], q: ["Focus, it is your move 😉"] },
  gen: ["😂 true", "Haha okay", "Ready when you are", "Nice 😄", "Okay you have a point 👀"],
};
function reply(v, nd) {
  LASTME = nd;
  const s = v.toLowerCase();
  if (
    /(do you (like|enjoy|love)|how.*(is it|are you liking)|what do you think|thoughts|you like it|enjoying)/.test(
      s,
    )
  )
    return mq(pick(RP.ask), 1);
  if (
    /(idea|feature|telegram|together|belong|love this|like this|amazing|incredible|so good|genuinely|insane|wow)/.test(
      s,
    ) &&
    !film
  )
    return likeBurst(nd);
  if (film && /(boring|slow|dull|meh|bad)/.test(s)) return mq([pu(RP.film.boring)]);
  if (film && /(scary|creepy|spook|afraid)/.test(s)) return mq([pu(RP.film.scary)]);
  if (film && /(amaz|great|love|awesome|good|nice|cool|wow|beautiful|perfect|incredible)/.test(s))
    return mq([pu(RP.film.good), { x: "🔥" }]);
  if (game && /(gg|well played|good game)/.test(s)) return mq([pu(RP.game.gg)]);
  if (game && /\?/.test(s)) return mq([pu(RP.game.q)]);
  if (/(lol|haha|😂|🤣)/.test(s)) return mq([pu(RP.laugh)]);
  if (/(thank|thanks)/.test(s)) return mq([pu(RP.thanks)]);
  if (/^(hi|hey|hello)/.test(s)) return mq([pu(RP.hi)]);
  mq([pu(RP.gen)]);
}
document
  .querySelectorAll(".ptabs button")
  .forEach(
    (b) =>
      (b.onclick = () =>
        document.querySelectorAll(".ptabs button").forEach((x) => x.classList.toggle("on", x === b))),
  );
function send() {
  const v = $("in").value.trim();
  if (!v) return;
  const nd = add(v.replace(/</g, "&lt;"), "me");
  $("in").value = "";
  reply(v, nd);
}
$("snd").onclick = send;
$("in").onkeydown = (e) => {
  if (e.key === "Enter") send();
};
$("in").onfocus = () => {
  if (!dock.hidden) dock.classList.add("mini");
};
$("in").onblur = () => {
  if (!manual) dock.classList.remove("mini");
};

function tab(t) {
  ["home", "settings", "profile"].forEach((x) => ($(x).hidden = x !== t));
  document.querySelectorAll("#tabs button").forEach((b) => b.classList.toggle("on", b.dataset.t === t));
  if (t === "profile") prof();
}
document.querySelectorAll("#tabs button").forEach((b) => (b.onclick = () => tab(b.dataset.t)));
function prof() {}
const MOON =
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>',
  SUN =
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.500 17.500L5 19"/></svg>';
const isDark = () => {
  const t = document.documentElement.getAttribute("data-theme");
  return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
};
function syncTheme() {
  $("tc").content = isDark() ? "#0e1621" : "#ffffff";
  $("thm").innerHTML = isDark() ? SUN : MOON;
}
function setTheme(v) {
  document.body.classList.add("tx");
  setTimeout(() => document.body.classList.remove("tx"), 450);
  if (v === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", v);
  try {
    localStorage.setItem("tt-theme", v);
  } catch (e) {}
  document.querySelectorAll("#seg button").forEach((x) => x.classList.toggle("on", x.dataset.v === v));
  syncTheme();
}
document.querySelectorAll("#seg button").forEach((b) => (b.onclick = () => setTheme(b.dataset.v)));
$("thm").onclick = () => setTheme(isDark() ? "light" : "dark");
try {
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", syncTheme);
} catch (e) {}
(() => {
  let v = "system";
  try {
    v = localStorage.getItem("tt-theme") || "dark";
  } catch (e) {}
  setTheme(v);
})();
$("swn").onclick = () => {
  notifOn = !notifOn;
  $("swn").classList.toggle("on", notifOn);
};
$("rst").onclick = () => {
  XP = 0;
  ST.played = 0;
  ST.wins = 0;
  toast("XP and stats reset");
};
function bindHdr() {
  $("mn").onclick = () => {
    manual = !dock.classList.contains("mini");
    dock.classList.toggle("mini");
  };
  $("x").onclick = () => {
    endDock();
    add("Session ended", "sys");
  };
}
// ---- sheet ----
const sh = $("sh"),
  sc = $("sc");
sh.onclick = (e) => {
  if (e.target === sh) sh.hidden = true;
};
$("tog").onclick = () => {
  home();
  sh.hidden = false;
};
const hd = (t, b) =>
    `<h2>${b ? '<button id="bk2">‹</button>' : ""}<span>${t}</span><button id="cl">✕</button></h2>`,
  wire = () => {
    $("cl").onclick = () => (sh.hidden = true);
    if ($("bk2")) $("bk2").onclick = home;
  };
function home() {
  sc.innerHTML =
    hd("Together with Maya") +
    `<button class="big g1" id="g"><em>🎮</em><div>Games<small>Chess · Backgammon · Tic-Tac-Toe · Quiz</small></div></button><button class="big g2" id="c"><em>🍿</em><div>Cinema<small>Watch a movie together, inside the chat</small></div></button>`;
  wire();
  $("g").onclick = games;
  $("c").onclick = cinema;
}
function games() {
  sc.innerHTML =
    hd("Choose a game", 1) +
    `<button class="big nb" data-k="chess"><em>♟</em><div>Chess<small>Full rules</small></div></button><button class="big nb" data-k="bg"><em>🎲</em><div>Backgammon<small>Dice, hits, bar, bearing off</small></div></button><button class="big nb" data-k="xo"><em>❌</em><div>Tic-Tac-Toe<small>Quick match</small></div></button><button class="big nb" data-k="quiz"><em>🧠</em><div>Knowledge Challenge<small>3 questions · speed · XP</small></div></button><button class="big dash" id="mg"><em>＋</em><div>More games<small>Open game platform</small></div></button>`;
  wire();
  sc.querySelectorAll("[data-k]").forEach(
    (b) =>
      (b.onclick = () =>
        invite(
          b.dataset.k,
          b.querySelector("div").firstChild.textContent,
          b.querySelector("em").textContent,
        )),
  );
  $("mg").onclick = store;
}
function store() {
  sc.innerHTML =
    hd("More games", 1) +
    `<button class="big nb" disabled><em>⚪</em><div>Checkers<small>Coming soon</small></div></button><button class="big nb" disabled><em>🀄</em><div>Dominoes<small>Coming soon</small></div></button><button class="big nb" disabled><em>🎯</em><div>Ludo<small>Coming soon</small></div></button><p style="color:var(--mu);font-size:13px">A new game registers with one call:</p><pre>registerGame({
  id: "checkers",
  title: "Checkers",
  mount(dh, me) { /* render into the dock */ }
})</pre>`;
  wire();
}
const MV = [
  { id: "ashes", n: "Ashes of Honor", t: "Some battles are fought not for glory, but for what remains." },
  { id: "canyon", n: "The Lost Canyon", t: "Some places are not found, they call you." },
];
const mcard = (m, i, w, s) =>
  `<div class="mi"><button class="mc ${w ? "wc" : ""} ${s ? "sel" : ""}" data-i="${i}" aria-label="${m.n}">${s ? '<span class="ck2">✓</span>' : ""}<div class="mb" style="background-image:url(${IMG[m.id]})"></div><img src="${IMG[m.id]}" alt="${m.n} poster"></button><b>${m.n}</b><small>${m.t}</small></div>`;
function cinema(vote) {
  const sel = [];
  let vm = false;
  sc.innerHTML =
    hd("Cinema", 1) +
    '<input id="q" placeholder="Search any movie or series"><button class="chipb" id="vt">🗳 Vote with Maya</button><div id="gd"></div><div class="vbar" id="vb" hidden><button class="rb" id="vs" disabled style="width:100%"></button></div>';
  wire();
  const up = () => {
    $("vs").disabled = sel.length < 2;
    $("vs").textContent = sel.length < 2 ? `Pick 2 films to vote (${sel.length}/2)` : "Send vote to Maya";
  };
  const r = () => {
    const q = $("q").value.toLowerCase(),
      l = MV.map((m, i) => [m, i]).filter(([m]) => (m.n + " " + m.t).toLowerCase().includes(q)),
      a = l.filter(([m]) => !m.c),
      c = l.filter(([m]) => m.c);
    $("gd").innerHTML = l.length
      ? (a.length
          ? `<div class="sh">Movies</div><div class="gr">${a.map(([m, i]) => mcard(m, i, 0, sel.includes(i))).join("")}</div>`
          : "") +
        (c.length
          ? `<div class="sh">Collections</div><div class="gr one">${c.map(([m, i]) => mcard(m, i, 1, sel.includes(i))).join("")}</div>`
          : "")
      : '<p style="text-align:center;color:var(--mu)">No results</p>';
    $("gd")
      .querySelectorAll(".mc")
      .forEach(
        (b) =>
          (b.onclick = () => {
            const i = +b.dataset.i;
            if (vm) {
              const k = sel.indexOf(i);
              if (k >= 0) sel.splice(k, 1);
              else if (sel.length < 2) sel.push(i);
              up();
              r();
            } else invite("film", MV[i].n, "🍿", MV[i]);
          }),
      );
  };
  $("vt").onclick = () => {
    vm = !vm;
    sel.length = 0;
    $("vt").classList.toggle("on", vm);
    $("vb").hidden = !vm;
    up();
    r();
  };
  $("vs").onclick = () => {
    sh.hidden = true;
    pollCard(MV[sel[0]], MV[sel[1]]);
  };
  $("q").oninput = r;
  up();
  r();
}
function pollCard(a, b) {
  endDock();
  const me = sess,
    v = { a: 0, b: 0 };
  let mine = null;
  const T = (ms, f) =>
    setTimeout(() => {
      if (me === sess) f();
    }, ms);
  const d = add(
    `<b>🗳 Movie night vote</b><div class="po"><button data-o="a"><img src="${IMG[a.id]}" alt=""><span><b>${a.n}</b><small class="vc">0 votes</small></span></button><button data-o="b"><img src="${IMG[b.id]}" alt=""><span><b>${b.n}</b><small class="vc">0 votes</small></span></button></div><small style="color:var(--mu)">Tap to vote</small>`,
    "me card pollc",
  );
  const up = () =>
    d.querySelectorAll(".po button").forEach((x) => {
      const o = x.dataset.o;
      x.querySelector(".vc").textContent = v[o] + (v[o] === 1 ? " vote" : " votes");
      x.classList.toggle("on", mine === o);
    });
  T(1100, () => add("Ooh, tough one. Both look amazing."));
  d.querySelectorAll(".po button").forEach(
    (x) =>
      (x.onclick = () => {
        if (mine) return;
        mine = x.dataset.o;
        v[mine]++;
        up();
        const o = mine === "a" ? "b" : "a",
          mf = mine === "a" ? a : b,
          of = mine === "a" ? b : a;
        T(1600, () => {
          v[o]++;
          up();
          add(`I voted ${of.n}... I cannot help it 😄`);
        });
        T(3100, () => mineMsg(`Seriously? ${mf.n} has to win.`));
        T(4600, () => add("Fine, fine. You pick tonight, I pick next time. Deal?"));
        T(5900, () => mineMsg("Deal 🤝"));
        T(2600, () => {
          add(`🎬 ${mf.n} wins the vote`, "sys");
          invite("film", mf.n, "🍿", mf);
        });
      }),
  );
}
// ---- chat expressions ----
const rxn = (n, e) => {
  const s = document.createElement("span");
  s.className = "rx";
  s.textContent = e;
  n.appendChild(s);
  n.style.marginBottom = "12px";
};
const PL = '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M8 5v14l11-7z" fill="#fff"/></svg>',
  PA =
    '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="#fff"/></svg>';
function voice(sec) {
  const w = Array.from(
    { length: 30 },
    (_, i) => `<i style="height:${4 + Math.abs(Math.sin(i * 1.3) * Math.cos(i * 0.45)) * 22}px"></i>`,
  ).join("");
  const d = add(
    `<div class="vm"><button class="vp" aria-label="Play voice message">${PL}</button><div class="wv">${w}</div><span class="vt">0:${String(sec).padStart(2, "0")}</span></div>`,
  );
  let iv = null,
    e = 0;
  const b = d.querySelector(".vp"),
    bars = d.querySelectorAll(".wv i"),
    tx = d.querySelector(".vt");
  const stop = () => {
    clearInterval(iv);
    iv = null;
    b.innerHTML = PL;
    d.classList.remove("on2");
  };
  b.onclick = () => {
    if (iv) {
      stop();
      return;
    }
    if (e >= sec) {
      e = 0;
      bars.forEach((x) => x.classList.remove("f"));
    }
    b.innerHTML = PA;
    d.classList.add("on2");
    iv = setInterval(() => {
      e += 0.25;
      bars.forEach((x, i) => x.classList.toggle("f", i / bars.length < e / sec));
      tx.textContent = "0:" + String(Math.max(0, Math.ceil(sec - e))).padStart(2, "0");
      if (e >= sec) {
        stop();
        tx.textContent = "0:" + String(sec).padStart(2, "0");
      }
    }, 250);
  };
  return d;
}
function likeBurst(nd) {
  const V = [
    [
      { x: "❤️" },
      900,
      "Okay, this is actually so good.",
      { v: 11 },
      { e: "🤩" },
      "Telegram needs this. Send it to the design team before someone else builds it.",
    ],
    [
      { x: "🔥" },
      "Exactly. Chat is where we already hang out.",
      { e: "😍" },
      { v: 8 },
      "I would use this every single night, honestly.",
    ],
    [
      { x: "😍" },
      "Stop, you are making me want to move all my friends here 😂",
      "Imagine the group chat: chess tournament, movie night, quiz war. All in one thread.",
      { e: "🥹" },
    ],
  ];
  mq(V[LB++ % 3], 1);
}
// ---- XP share ----
const GN = { chess: "Chess", xo: "Tic-Tac-Toe", bg: "Backgammon", quiz: "Knowledge Challenge" },
  ovB = () =>
    '<div class="rbs"><button class="rb" id="rm">Rematch</button><button class="rb alt" id="xp">⭐ XP & Share</button></div>';
function xpCard() {
  if (!LAST) return;
  const L = LAST,
    lv = 1 + Math.floor(XP / 100),
    res = L.w ? "Victory" : L.l ? "Defeat" : "Draw",
    ic = L.w ? "🏆" : L.l ? "🎯" : "🤝";
  sc.innerHTML =
    hd("Your result") +
    `<div class="xc"><div class="xt">TELEGRAM TOGETHER</div><div class="xr">${ic} ${res}</div><div class="xg">${GN[L.g] || "Activity"} · You vs Maya</div><div class="xp2">+${L.gain} <span>XP</span></div><div class="lvb"><i style="width:${XP % 100}%"></i></div><div class="xl">Level ${lv} · ${XP} XP total</div><div class="xf">Simulated opponent · concept</div></div><button class="rb" id="shr" style="width:100%">Share to chat</button>`;
  wire();
  sh.hidden = false;
  $("shr").onclick = () => {
    sh.hidden = true;
    const d = add(
      `<div class="xc mini"><div class="xt">TELEGRAM TOGETHER</div><div class="xr">${ic} ${res} · ${GN[L.g]}</div><div class="xp2">+${L.gain} <span>XP</span></div><div class="xl">Level ${lv} · ${XP} XP</div></div>`,
      "me card2s",
    );
    const me = sess;
    setTimeout(() => {
      if (me === sess) {
        rxn(d, "🔥");
        add(
          pick([
            "Screenshotting this. Rematch soon.",
            "That card is so clean 😍",
            "Okay, now I want a rematch.",
          ]),
        );
      }
    }, 1000);
  };
}
// ---- cinematic score (original, synthesized: strings, tribal drums, flute, wind, reverb) ----
function scoreFilm(a, out, t0, D) {
  const mix = a.createGain(),
    cp = a.createDynamicsCompressor(),
    hz = (n) => 440 * Math.pow(2, (n - 69) / 12);
  mix.gain.setValueAtTime(0.9, t0);
  mix.gain.setValueAtTime(0.9, t0 + D - 4);
  mix.gain.linearRampToValueAtTime(0, t0 + D);
  cp.threshold.value = -20;
  cp.ratio.value = 3;
  mix.connect(cp);
  cp.connect(out);
  const Ln = (a.sampleRate * 2.8) | 0,
    ir = a.createBuffer(2, Ln, a.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c);
    for (let i = 0; i < Ln; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / Ln, 2.6);
  }
  const rv = a.createConvolver(),
    wet = a.createGain(),
    bus = a.createGain();
  rv.buffer = ir;
  wet.gain.value = 0.4;
  rv.connect(wet);
  wet.connect(mix);
  bus.connect(mix);
  bus.connect(rv);
  const nb = a.createBuffer(1, a.sampleRate * 2, a.sampleRate),
    nd = nb.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  const env = (g, t, at, pk, rl, len) => {
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(pk, t + at);
    g.gain.setValueAtTime(pk, t + len);
    g.gain.linearRampToValueAtTime(0, t + len + rl);
  };
  const noise = (t, len, type, f0, f1, pk, at, rl) => {
    const s = a.createBufferSource(),
      f = a.createBiquadFilter(),
      g = a.createGain();
    s.buffer = nb;
    s.loop = true;
    f.type = type;
    f.frequency.setValueAtTime(f0, t);
    f.frequency.linearRampToValueAtTime(f1, t + len);
    env(g, t, at, pk, rl, len);
    s.connect(f);
    f.connect(g);
    g.connect(bus);
    s.start(t);
    s.stop(t + len + rl + 0.1);
  };
  const tone = (t, n, len, type, pk, at, rl, lp, vib) => {
    const o = a.createOscillator(),
      g = a.createGain(),
      f = a.createBiquadFilter();
    o.type = type;
    o.frequency.value = hz(n);
    f.type = "lowpass";
    f.frequency.value = lp;
    if (vib) {
      const l = a.createOscillator(),
        lg = a.createGain();
      l.frequency.value = 5.3;
      lg.gain.setValueAtTime(0, t);
      lg.gain.linearRampToValueAtTime(hz(n) * 0.006, t + len * 0.6);
      l.connect(lg);
      lg.connect(o.frequency);
      l.start(t);
      l.stop(t + len + rl + 0.1);
    }
    env(g, t, at, pk, rl, len);
    o.connect(f);
    f.connect(g);
    g.connect(bus);
    o.start(t);
    o.stop(t + len + rl + 0.1);
  };
  const drum = (t, v, p) => {
    const o = a.createOscillator(),
      g = a.createGain();
    o.frequency.setValueAtTime(p, t);
    o.frequency.exponentialRampToValueAtTime(p * 0.5, t + 0.28);
    g.gain.setValueAtTime(v * 0.6, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    o.connect(g);
    g.connect(bus);
    o.start(t);
    o.stop(t + 0.65);
    noise(t, 0.06, "bandpass", 320, 320, v * 0.8, 0.002, 0.08);
  };
  const CH = [
    [50, 57, 62, 65],
    [46, 53, 58, 62],
    [53, 57, 60, 65],
    [48, 55, 60, 64],
    [50, 57, 62, 65],
    [46, 53, 58, 62],
    [43, 55, 58, 62],
    [45, 57, 61, 64],
  ];
  CH.forEach((ch, ci) => {
    const t = t0 + ci * 7;
    ch.forEach((n) =>
      [-7, 7].forEach((dt) => {
        const o = a.createOscillator(),
          g = a.createGain(),
          f = a.createBiquadFilter(),
          l = a.createOscillator(),
          lg = a.createGain();
        o.type = "sawtooth";
        o.frequency.value = hz(n);
        o.detune.value = dt;
        f.type = "lowpass";
        f.Q.value = 0.3;
        f.frequency.setValueAtTime(450, t);
        f.frequency.linearRampToValueAtTime(1400 + ci * 140, t + 4.5);
        l.frequency.value = 5.1;
        lg.gain.value = hz(n) * 0.004;
        l.connect(lg);
        lg.connect(o.frequency);
        env(g, t, 1.9, 0.05, 2.3, 7);
        o.connect(f);
        f.connect(g);
        g.connect(bus);
        o.start(t);
        l.start(t);
        o.stop(t + 9.4);
        l.stop(t + 9.4);
      }),
    );
    tone(t, CH[ci][0] - 12, 7, "sine", 0.07, 2, 2.3, 300);
  });
  noise(t0, D, "bandpass", 350, 900, 0.05, 3, 3);
  noise(t0, 4.8, "bandpass", 300, 5200, 0.34, 4.4, 0.1);
  tone(t0 + 4.9, 31, 3.2, "sine", 0.5, 0.02, 1.2, 200);
  noise(t0 + 4.9, 1.4, "lowpass", 2600, 500, 0.34, 0.02, 1.6);
  const bar = (60 / 72) * 2;
  for (let t = t0 + 9; t < t0 + D - 7; t += bar)
    [
      [0, 0.8, 95],
      [0.62, 0.4, 70],
      [1.04, 0.55, 95],
      [1.25, 0.4, 70],
      [1.66, 0.5, 110],
    ].forEach(([d, v, p], i) => {
      if (t > t0 + 30 || i !== 4) drum(t + d, v, p);
    });
  [
    [
      14,
      [
        [0, 74, 1.6],
        [1.8, 72, 0.8],
        [2.6, 69, 2.6],
        [5.6, 67, 1.2],
        [6.9, 69, 0.8],
        [7.7, 72, 3.4],
      ],
    ],
    [
      35,
      [
        [0, 77, 1.8],
        [2, 76, 0.8],
        [2.8, 74, 2.6],
        [5.8, 72, 1.2],
        [7, 69, 0.8],
        [7.8, 74, 4],
      ],
    ],
  ].forEach(([o, ph]) =>
    ph.forEach(([d, n, l]) => {
      const t = t0 + o + d;
      tone(t, n, l, "triangle", 0.15, 0.25, 0.5, 2600, 1);
      noise(t, l, "bandpass", 3200, 3200, 0.014, 0.2, 0.4);
    }),
  );
}
function cueFilm() {
  try {
    const A = window.AudioContext || window.webkitAudioContext,
      a = new A(),
      mm = a.createGain();
    mm.connect(a.destination);
    scoreFilm(a, mm, a.currentTime + 0.05, 56);
    if (a.state === "suspended") a.resume();
    return {
      stop() {
        try {
          a.close();
        } catch (e) {}
      },
      mute(v) {
        mm.gain.value = v ? 0 : 1;
      },
      pause(p) {
        try {
          p ? a.suspend() : a.resume();
        } catch (e) {}
      },
    };
  } catch (e) {
    return { stop() {}, mute() {}, pause() {} };
  }
}
// ---- invite ----
function endDock() {
  sess++;
  if (FA) {
    FA.stop();
    FA = null;
  }
  film = null;
  game = null;
  manual = false;
  dock.hidden = true;
  dock.innerHTML = "";
  dock.classList.remove("mini");
}
function invite(k, title, ic, th) {
  sh.hidden = true;
  endDock();
  const me = sess;
  const verb = k === "film" ? "watch" : "play";
  const c = add(
    `<b>${ic} ${title}</b><span style="color:var(--mu);font-size:13px">Together invite · waiting for Maya...</span>`,
    "card",
  );
  const n = $("ntf");
  n.innerHTML = `${av("maya").replace('class="av"', 'class="av" style="width:40px;height:40px"')}<div style="flex:1"><small>MAYA'S PHONE · SIMULATED</small><p>Invitation from you · ${verb} <b>${title}</b></p></div><button id="acc">Accept</button>`;
  setTimeout(() => {
    if (notifOn) n.classList.add("on");
  }, 500);
  setTimeout(() => {
    const b = $("acc");
    if (b) b.classList.add("pr");
  }, 2300);
  setTimeout(() => {
    n.classList.remove("on");
    if (me !== sess) return;
    c.querySelector("span").textContent = "Maya accepted ✓";
    openAct(k, title, th);
    chatter(k);
  }, 2800);
}
/* ---- Game registry ----
   A game is anything that can mount itself into the dock above the chat.
   mount(dh, me): dh(icon, title) returns the dock header markup; me is the session token. */
const GAMES = {};
function registerGame(g) {
  GAMES[g.id] = g;
}
registerGame({ id: "chess", title: "Chess", mount: chess });
registerGame({ id: "bg", title: "Backgammon", mount: bgm });
registerGame({ id: "xo", title: "Tic-Tac-Toe", mount: xo });
registerGame({ id: "quiz", title: "Knowledge Challenge", mount: quiz });
function openAct(k, title, th) {
  dock.hidden = false;
  const me = sess;
  const dh = (i, t) =>
    `<div class="dh"><b>${i} ${t}</b><span class="tag">SIMULATED</span><button id="mn" aria-label="Minimize">▾</button><button id="x" aria-label="End">✕</button></div><div class="db">`;
  game = k !== "film" ? k : null;
  const g = GAMES[k];
  if (g) g.mount(dh, me);
  else filmP(dh, th, me);
  if (k !== "film")
    [16000, 42000].forEach((t) =>
      setTimeout(() => {
        if (me === sess) mq([pu(GL)]);
      }, t),
    );
  bindHdr();
}
// ---- chess ----
function chess(dh, me) {
  const g = new Chess();
  let sel = null,
    tg = [],
    lm = null;
  dock.innerHTML =
    dh("♟", "Chess with Maya") +
    `<svg width="0" height="0" style="position:absolute"><defs><linearGradient id="gW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#cfcfd6"/></linearGradient><linearGradient id="gB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a4a58"/><stop offset="1" stop-color="#14141a"/></linearGradient></defs></svg><div class="xp"><div class="pl1" id="p1">You · White</div><div class="pl1" id="p2">Maya · Black</div></div><div id="st"></div><div class="persp"><div id="bd"></div></div></div><div class="ovl" id="ov" hidden></div>`;
  const PV = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 0 },
    ev0 = (n) => {
      let t = 0;
      for (let i = 0; i < 64; i++) {
        const p = n.b[i];
        if (!p) continue;
        const r = i >> 3,
          c = i & 7,
          v =
            PV[p[1]] +
            (p[1] === "P"
              ? (p[0] === "w" ? 6 - r : r - 1) * 6
              : (3.5 - Math.max(Math.abs(r - 3.5), Math.abs(c - 3.5))) * 5);
        t += p[0] === "w" ? v : -v;
      }
      return t;
    };
  function pickBot(g) {
    let best = null,
      bv = 1e9;
    for (const m of g.legal()) {
      const n = g.mk(m),
        L = n.legal();
      let v;
      if (!L.length) v = n.in_check() ? -1e6 : 0;
      else {
        v = -1e9;
        for (const m2 of L) {
          const n2 = n.mk(m2),
            L2 = n2.legal(),
            w = !L2.length ? (n2.in_check() ? 1e6 : 0) : ev0(n2);
          if (w > v) v = w;
        }
      }
      v += Math.random() * 70;
      if (v < bv) {
        bv = v;
        best = m;
      }
    }
    return best;
  }
  const nm = (r, c) => "abcdefgh"[c] + (8 - r);
  function r() {
    const b = g.board(),
      ck = g.in_check(),
      kt = g.turn();
    let h = "";
    for (let i = 0; i < 8; i++)
      for (let j = 0; j < 8; j++) {
        const q = nm(i, j),
          p = b[i][j];
        h += `<button class="sq ${(i + j) % 2 ? "d" : ""} ${sel === q ? "s" : ""} ${tg.includes(q) ? "t" + (p || q === g.ep ? " cp" : "") : ""} ${lm && (lm[0] === q || lm[1] === q) ? "lm" : ""} ${ck && p && p.type === "k" && p.color === kt ? "kc" : ""}" data-q="${q}" aria-label="${q}">${p ? `<span class="${p.color === "w" ? "pw" : "pb"}">${piece(p.type)}</span>` : ""}${j === 0 ? `<b class="co r">${8 - i}</b>` : ""}${i === 7 ? `<b class="co f">${"abcdefgh"[j]}</b>` : ""}</button>`;
      }
    $("bd").innerHTML = h;
    $("bd")
      .querySelectorAll(".sq")
      .forEach((e) => (e.onclick = () => clk(e.dataset.q)));
    const go = g.game_over();
    $("p1").classList.toggle("on", kt === "w" && !go);
    $("p2").classList.toggle("on", kt === "b" && !go);
    const d = g.in_checkmate()
      ? kt === "w"
        ? "Checkmate. Maya wins"
        : "Checkmate. You win! 🎉"
      : g.in_draw()
        ? "Draw"
        : "";
    $("st").textContent = d || (kt === "w" ? "Your move" : "Maya is thinking...") + (ck ? " · Check!" : "");
    if (d) {
      const w = /you win/i.test(d);
      $("ov").hidden = false;
      $("ov").innerHTML =
        `<div style="font-size:30px;font-weight:800">${w ? "🏆 Victory" : d === "Draw" ? "🤝 Draw" : "Defeat"}</div><div>${d}</div>${ovB()}`;
      $("rm").onclick = () => {
        doneS = -1;
        chess(dh, me);
        bindHdr();
      };
      $("xp").onclick = xpCard;
      done(d);
    }
  }
  function bot() {
    if (me !== sess || g.game_over()) return;
    const m = pickBot(g);
    g.move({ from: SQ(m.f), to: SQ(m.t), promotion: m.pr || "q" });
    lm = [SQ(m.f), SQ(m.t)];
    r();
    if (g.in_checkmate()) {
    } else if (g.in_check()) ev("mcheck");
    else if (m.c) ev("mcap");
  }
  function clk(q) {
    if (g.turn() !== "w" || g.game_over()) return;
    if (sel && tg.includes(q)) {
      const f = sel,
        cap = g.get(q);
      g.move({ from: f, to: q, promotion: "q" });
      lm = [f, q];
      sel = null;
      tg = [];
      r();
      ev(g.in_check() ? "check" : cap ? "capture" : "move");
      if (!g.game_over()) setTimeout(bot, 900);
      return;
    }
    const p = g.get(q);
    if (p && p.color === "w") {
      sel = q;
      tg = g.moves({ square: q }).map((m) => m.to);
    } else {
      sel = null;
      tg = [];
    }
    r();
  }
  window.__t = { g, r };
  r();
}
// ---- tic-tac-toe ----
function xo(dh, me) {
  const b = Array(9).fill(""),
    L = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
  let over = false,
    turn = 1,
    wl = null;
  dock.innerHTML =
    dh("❌", "Tic-Tac-Toe with Maya") +
    '<div class="xp"><div class="pl1" id="p1">You · ✕</div><div class="pl1" id="p2">Maya · ◯</div></div><div id="st"></div><div class="xw"><div id="xo"></div></div></div><div class="ovl" id="ov" hidden></div>';
  const X = '<svg viewBox="0 0 40 40" class="mk x"><path d="M9 9L31 31M31 9L9 31"/></svg>',
    O = '<svg viewBox="0 0 40 40" class="mk o"><circle cx="20" cy="20" r="12"/></svg>',
    win = (p) => L.find((l) => l.every((i) => b[i] === p));
  function fin() {
    let t = "";
    const wx = win("X"),
      wo = win("O");
    if (wx) {
      wl = wx;
      t = "You win! 🎉";
    } else if (wo) {
      wl = wo;
      t = "Maya wins";
    } else if (b.every(Boolean)) t = "Draw";
    if (t) {
      over = true;
      $("st").textContent = t;
      r();
      $("p1").classList.remove("on");
      $("p2").classList.remove("on");
      setTimeout(() => {
        if (me !== sess) return;
        const w = /you win/i.test(t);
        $("ov").hidden = false;
        $("ov").innerHTML =
          `<div style="font-size:30px;font-weight:800">${w ? "🏆 Victory" : t === "Draw" ? "🤝 Draw" : "Defeat"}</div><div>${t}</div>${ovB()}`;
        $("rm").onclick = () => {
          doneS = -1;
          xo(dh, me);
          bindHdr();
        };
        $("xp").onclick = xpCard;
        done(t);
      }, 800);
    } else {
      $("st").textContent = turn ? "Your move" : "Maya is thinking...";
      $("p1").classList.toggle("on", !!turn);
      $("p2").classList.toggle("on", !turn);
    }
  }
  function r() {
    $("xo").innerHTML = b
      .map(
        (v, i) =>
          `<button data-i="${i}" aria-label="cell ${i + 1}" class="${wl && wl.includes(i) ? "w" : ""}">${v === "X" ? X : v === "O" ? O : ""}</button>`,
      )
      .join("");
    $("xo")
      .querySelectorAll("button")
      .forEach(
        (e) =>
          (e.onclick = () => {
            const i = +e.dataset.i;
            if (over || !turn || b[i]) return;
            b[i] = "X";
            turn = 0;
            r();
            fin();
            if (!over) setTimeout(bot, 700);
          }),
      );
  }
  function bot() {
    if (me !== sess || over) return;
    const f = (p) => {
      for (const l of L) {
        const v = l.map((i) => b[i]);
        if (v.filter((c) => c === p).length === 2 && v.includes("")) return l[v.indexOf("")];
      }
      return -1;
    };
    let m = f("O");
    if (m < 0) m = f("X");
    if (m < 0 && !b[4]) m = 4;
    if (m < 0) m = pick(b.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0));
    b[m] = "O";
    turn = 1;
    r();
    fin();
  }
  r();
  fin();
}
// ---- backgammon (white = you, moves 23 -> 0 ; black = Maya, moves 0 -> 23) ----
function bgm(dh, me) {
  const B = Array(24).fill(0);
  B[23] = 2;
  B[12] = 5;
  B[7] = 3;
  B[5] = 5;
  B[0] = -2;
  B[11] = -5;
  B[16] = -3;
  B[18] = -5;
  const bar = { 1: 0, "-1": 0 },
    off = { 1: 0, "-1": 0 };
  let turn = 1,
    dice = [],
    sel = null,
    over = false,
    msg = "Roll the dice to start";
  const inHome = (p, i) => (p === 1 ? i <= 5 : i >= 18);
  const allHome = (p) => {
    if (bar[p]) return false;
    for (let i = 0; i < 24; i++) if (B[i] * p > 0 && !inHome(p, i)) return false;
    return true;
  };
  function legal(p) {
    const o = [];
    for (const d of new Set(dice)) {
      if (bar[p]) {
        const t = p === 1 ? 24 - d : d - 1;
        if (B[t] * p > -2) o.push({ f: "bar", t, d });
        continue;
      }
      for (let i = 0; i < 24; i++) {
        if (B[i] * p <= 0) continue;
        const t = i - p * d;
        if (t >= 0 && t < 24) {
          if (B[t] * p > -2) o.push({ f: i, t, d });
        } else if (allHome(p)) {
          const ex = p === 1 ? i === d - 1 : i === 24 - d;
          let far = true;
          for (let j = 0; j < 24; j++)
            if (B[j] * p > 0 && (p === 1 ? j > i : j < i)) {
              far = false;
              break;
            }
          if (ex || far) o.push({ f: i, t: "off", d });
        }
      }
    }
    return o;
  }
  function apply(m, p) {
    if (m.f === "bar") bar[p]--;
    else B[m.f] -= p;
    if (m.t === "off") off[p]++;
    else {
      if (B[m.t] * p === -1) {
        B[m.t] = 0;
        bar[-p]++;
        ev(p === 1 ? "hit" : "gothit");
      }
      B[m.t] += p;
    }
    dice.splice(dice.indexOf(m.d), 1);
    if (off[p] === 15) {
      over = true;
      msg = p === 1 ? "You win! 🎉" : "Maya wins";
      done(msg);
    }
  }
  const PIP = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] },
    die = (n) => `<img class="dc dsv" src="${DIE[n]}" alt="Die showing ${n}">`,
    ovl = () =>
      `<div class="ovl"><div style="font-size:30px;font-weight:800">${/you win/i.test(msg) ? "🏆 Victory" : "Defeat"}</div><div>${msg}</div>${ovB()}</div>`;
  const roll = () => {
    const a = 1 + Math.floor(Math.random() * 6),
      b = 1 + Math.floor(Math.random() * 6);
    dice = a === b ? [a, a, a, a] : [a, b];
  };
  function endTurn() {
    dice = [];
    sel = null;
    turn = -turn;
    msg = turn === 1 ? "Roll the dice" : "Maya is playing...";
    r();
    if (turn === -1) setTimeout(botTurn, 900);
  }
  function botTurn() {
    if (me !== sess || over) return;
    roll();
    r();
    const step = () => {
      if (me !== sess || over) return;
      const L = legal(-1);
      if (!L.length || !dice.length) {
        endTurn();
        return;
      }
      const hit = L.filter((m) => m.t !== "off" && B[m.t] === 1),
        offm = L.filter((m) => m.t === "off"),
        safe = L.filter((m) => m.t !== "off" && B[m.t] < 0);
      apply(pick(hit.length ? hit : offm.length ? offm : safe.length ? safe : L), -1);
      r();
      setTimeout(step, 650);
    };
    setTimeout(step, 700);
  }
  function rollBtn() {
    if (turn !== 1 || dice.length || over) return;
    roll();
    if (dice.length === 4) ev("doubles");
    if (!legal(1).length) {
      msg = "No legal moves";
      r();
      setTimeout(endTurn, 1200);
    } else {
      msg =
        "You rolled " +
        (dice.length === 4 ? dice[0] + " & " + dice[0] + " (doubles!)" : dice.join(" & ")) +
        " · pick a checker, then a target";
      r();
    }
  }
  function clkPt(i) {
    if (turn !== 1 || !dice.length || over) return;
    const L = legal(1);
    if (sel !== null && sel !== i && L.some((m) => m.f === sel && m.t === i)) {
      apply(
        L.find((m) => m.f === sel && m.t === i),
        1,
      );
      sel = null;
      fin();
    } else if (i === "bar" ? bar[1] > 0 : L.some((m) => m.f === i)) sel = i;
    else sel = null;
    r();
  }
  function bearOff() {
    if (turn !== 1 || sel === null || over) return;
    const L = legal(1)
      .filter((m) => m.f === sel && m.t === "off")
      .sort((a, b) => a.d - b.d);
    if (L.length) {
      apply(L[0], 1);
      sel = null;
      fin();
    }
  }
  function fin() {
    if (over) {
      r();
      return;
    }
    if (!dice.length || !legal(1).length) endTurn();
    else r();
  }
  function pt(i) {
    const n = Math.abs(B[i]),
      c = B[i] > 0 ? "w" : "k";
    const t = sel !== null && legal(1).some((m) => m.f === sel && m.t === i);
    let k = "";
    for (let j = 0; j < Math.min(n, 5); j++) k += `<span class="ck ${c}">${j === 4 && n > 5 ? n : ""}</span>`;
    return `<button class="pt ${i % 2 ? "a" : ""} ${sel === i ? "s" : ""} ${t ? "t" : ""}" data-i="${i}">${k}</button>`;
  }
  function barCell() {
    const k = (b) =>
      Array.from({ length: bar[b] }, () => `<span class="ck ${b === 1 ? "w" : "k"}"></span>`).join("");
    return `<button class="pt bar0 ${sel === "bar" ? "s" : ""}" data-i="bar">${k(1)}${k(-1)}</button>`;
  }
  function r() {
    const top =
        [12, 13, 14, 15, 16, 17].map(pt).join("") + barCell() + [18, 19, 20, 21, 22, 23].map(pt).join(""),
      bot = [11, 10, 9, 8, 7, 6].map(pt).join("") + barCell() + [5, 4, 3, 2, 1, 0].map(pt).join("");
    const canOff = sel !== null && legal(1).some((m) => m.f === sel && m.t === "off");
    dock.innerHTML =
      dh("🎲", "Backgammon with Maya") +
      `<div class="xp"><div class="pl1 ${turn === 1 && !over ? "on" : ""}">You · Ivory · off ${off[1]}/15</div><div class="pl1 ${turn === -1 && !over ? "on" : ""}">Maya · Red · off ${off[-1]}/15</div></div><div id="st">${msg}</div><div class="persp"><div class="bgb" style="transform:rotateX(10deg)"><div class="br">${top}</div><div class="br b">${bot}</div></div></div><div class="dice">${dice.map(die).join("")}<span style="font-size:12px;color:#9fb0c1">Off — you ${off[1]} · Maya ${off[-1]}</span></div><div class="ctl"><button id="rl" ${turn !== 1 || dice.length || over ? "disabled" : ""}>🎲 Roll</button><button id="of" ${canOff ? "" : "disabled"}>Bear off</button></div>${over ? ovl() : ""}</div>`;
    dock
      .querySelectorAll(".pt")
      .forEach((b) => (b.onclick = () => clkPt(b.dataset.i === "bar" ? "bar" : +b.dataset.i)));
    $("rl").onclick = rollBtn;
    $("of").onclick = bearOff;
    if ($("rm"))
      $("rm").onclick = () => {
        doneS = -1;
        bgm(dh, me);
        bindHdr();
      };
    if ($("xp")) $("xp").onclick = xpCard;
    bindHdr();
  }
  window.__bg = {
    B,
    bar,
    off,
    legal,
    clkPt,
    rollBtn,
    bearOff,
    r,
    get dice() {
      return dice;
    },
    set dice(v) {
      dice = v;
    },
    get turn() {
      return turn;
    },
    set turn(v) {
      turn = v;
    },
    get over() {
      return over;
    },
  };
  r();
}
const PC = {
  p: '<circle cx="22.5" cy="13" r="5.2"/><path d="M17.5 34c0-9 3-11.5 5-13.5 2 2 5 4.5 5 13.5z"/><rect x="13.5" y="33.5" width="18" height="4.5" rx="2"/>',
  r: '<path d="M12.5 38v-5h20v5zM15 33V18.5h15V33zM12 18.5V10h4v3.5h4V10h5v3.5h4V10h4v8.5z"/>',
  n: '<path d="M14 38c0-10 2.5-15 8-19l-7-2.5 2.5-5 6-5c7-.5 12 4.5 12 13l1 18.5z"/><circle cx="19.5" cy="14" r="1.2" fill="#888" stroke="none"/>',
  b: '<circle cx="22.5" cy="6.5" r="2.3"/><path d="M22.5 9c-5 3-7 7-7 11 0 3 2 5 4.500 6.500-3 2-5 5-5 11.500h15c0-6.500-2-9.500-5-11.500 2.500-1.500 4.500-3.500 4.500-6.500 0-4-2-8-7-11z"/><rect x="12.5" y="33.500" width="20" height="4.500" rx="2"/><path d="M19.500 14.500l6 6" fill="none"/>',
  q: '<path d="M11.5 35l-2.5-19 7.5 8 2.5-11 3 11 3-11 2.5 11 7.5-8-2.5 19z"/><rect x="11" y="34.5" width="23" height="4" rx="2"/>',
  k: '<path d="M21 4h3v4h4v3h-4v4h-3v-4h-4V8h4z"/><path d="M13.5 35c0-10 3-14 9-16.5 6 2.5 9 6.5 9 16.5z"/><rect x="11.5" y="34.5" width="22" height="4" rx="2"/>',
};
const piece = (t) => `<svg viewBox="0 0 45 45" aria-hidden="true">${PC[t]}</svg>`;
// ---- shared: dialogue, results, confetti ----
let doneS = -1,
  XP = 0,
  notifOn = true;
const ST = { played: 0, wins: 0 };
const mineMsg = (t) => {
  const d = document.createElement("div");
  d.className = "m me";
  d.textContent = t;
  msgs.appendChild(d);
  msgs.scrollTop = msgs.scrollHeight;
};
function say(seq) {
  const me = sess;
  seq.forEach(([w, t], j) =>
    setTimeout(
      () => {
        if (me !== sess) return;
        w === "me" ? mineMsg(t) : add(t);
      },
      1100 * (j + 1),
    ),
  );
}
const SC = {
  chess: [
    [
      ["me", "Fair warning: I have been studying openings all week."],
      ["f", "Bold of you to warn me 😄 Do I get white?"],
      ["me", "Nope, you get the pressure."],
      ["f", "We will see who cracks first."],
    ],
    [
      ["f", "I hope you brought a plan."],
      ["me", "I brought three. One of them is good."],
      ["f", "Ha! Which one?"],
      ["me", "Ask me after move ten."],
    ],
  ],
  xo: [
    [
      ["me", "Quick one while we wait for dinner?"],
      ["f", "Sure, but I always take the middle 😏"],
      ["me", "Then I am taking a corner."],
      ["f", "Predictable. Go."],
    ],
    [
      ["f", "Best of one, no excuses."],
      ["me", "Deal. Winner picks the next film."],
      ["f", "Now you have made it personal."],
      ["me", "Good."],
    ],
  ],
  bg: [
    [
      ["me", "Last time you rolled three doubles in a row."],
      ["f", "Skill, not luck 😌"],
      ["me", "Then roll skillfully. I am ready."],
      ["f", "The dice are warming up."],
    ],
    [
      ["f", "Backgammon? Brave choice."],
      ["me", "I have a lucky checker."],
      ["f", "They are all identical, you know."],
      ["me", "Not to me."],
    ],
  ],
  quiz: [
    [
      ["f", "Be honest: how good is your general knowledge?"],
      ["me", "Pub quiz champion, twice."],
      ["f", "Twice. Okay, three questions, no googling."],
      ["me", "No promises."],
    ],
    [
      ["me", "Three questions, faster correct answers score more."],
      ["f", "So speed matters. Noted."],
      ["me", "Do not panic."],
      ["f", "Me? Never."],
    ],
  ],
  film: [
    [
      ["me", "I have wanted to see this one for ages."],
      ["f", "Same! Lights off, brightness up 🍿"],
      ["me", "Press play whenever you are ready."],
      ["f", "Go, I am here."],
    ],
    [
      ["f", "Did you bring snacks?"],
      ["me", "Obviously."],
      ["f", "Perfect. Start it, I will react loudly."],
      ["me", "I expect nothing less."],
    ],
  ],
};
const chatter = (k) =>
  mq([...pick(SC[k]).flatMap(([w, t]) => (w === "me" ? [500, { me: t }] : [t])), 1400, pu(OPEN)], 1);
const WN = [
    "Clean win. I want a rematch.",
    "Well played! Next round is on me.",
    "Okay, you got me. Rematch?",
  ],
  LS = ["Ha! That one is mine 😏", "Better luck next time. Again?", "Close, but I will take it."],
  DR = ["A fair result. Again?", "A draw. We are too evenly matched."];
function confetti() {
  for (let i = 0; i < 26; i++) {
    const e = document.createElement("span");
    e.className = "cf";
    e.textContent = pick(["🎉", "✨", "🏆", "⭐"]);
    e.style.left = Math.random() * 100 + "vw";
    e.style.animationDelay = Math.random() * 0.6 + "s";
    $("app").appendChild(e);
    setTimeout(() => e.remove(), 3600);
  }
}
function done(t) {
  if (doneS === sess) return;
  doneS = sess;
  const w = /you win/i.test(t),
    l = /wins/i.test(t) && !w,
    gm = /\+(\d+) XP/.exec(t),
    gain = gm ? +gm[1] : w ? 40 : l ? 10 : 15;
  if (!gm) XP += gain;
  LAST = { t, gain, w, l, g: game || "quiz" };
  ST.played++;
  if (w) ST.wins++;
  add(
    `<b>🏁 ${t}</b><span style="color:var(--mu);font-size:13px">Result shared in chat · simulated opponent</span>`,
    "card",
  );
  if (w) confetti();
  mq([900, pick(w ? WN : l ? LS : DR), 1500, pu(END)], 1);
}
// ---- knowledge challenge ----
const QB = [
  [
    "What is the time complexity of building a binary heap from n elements with the bottom-up method?",
    "O(n)",
    "O(n log n)",
    "O(log n)",
    "O(n²)",
  ],
  [
    "Which treaty ended the Thirty Years' War in 1648?",
    "Peace of Westphalia",
    "Treaty of Utrecht",
    "Congress of Vienna",
    "Treaty of Tordesillas",
  ],
  ["Which metal has the highest melting point?", "Tungsten", "Osmium", "Titanium", "Platinum"],
];
function quiz(dh, me) {
  const qs = [...QB]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((q) => ({
      q: q[0],
      o: q
        .slice(1)
        .map((t, k) => [t, k === 0])
        .sort(() => Math.random() - 0.5),
    }));
  let i = 0,
    a = 0,
    m = 0,
    ans = false,
    t0 = 0;
  const LIM = 20000,
    pts = (el) => 10 + Math.round(5 * Math.max(0, 1 - el / LIM));
  dock.innerHTML = dh("🧠", "Knowledge Challenge") + '<div id="st"></div><div id="qa"></div></div>';
  function show() {
    const idx = i,
      q = qs[i];
    ans = false;
    t0 = performance.now();
    $("st").textContent = `Question ${i + 1} of 3 · You ${a} · Maya ${m}`;
    $("qa").innerHTML =
      `<div class="qbar"><i id="qt"></i></div><div class="qq">${q.q}</div>` +
      q.o.map((o, k) => `<button class="qo" data-k="${k}">${o[0]}</button>`).join("");
    $("qa")
      .querySelectorAll(".qo")
      .forEach((b) => (b.onclick = () => res(+b.dataset.k)));
    q.mt = 1500 + Math.random() * 8000;
    q.mr = Math.random() < 0.62;
    q.mp = q.mr ? pts(q.mt) : 0;
    if (i === 1)
      setTimeout(() => {
        if (me === sess)
          add(
            pick([
              "Okay, that last one was sneaky.",
              "I am winning this, by the way 😏",
              "Your turn to sweat, I guess.",
            ]),
          );
      }, 1500);
    (function tk() {
      if (me !== sess || ans || idx !== i) return;
      const el = performance.now() - t0;
      $("qt").style.width = Math.max(0, 100 - (el / LIM) * 100) + "%";
      if (el >= LIM) res(-1);
      else requestAnimationFrame(tk);
    })();
  }
  function res(k) {
    if (ans) return;
    ans = true;
    const q = qs[i],
      el = performance.now() - t0,
      ok = k >= 0 && q.o[k][1];
    if (ok) a += pts(el);
    m += q.mp;
    $("qa")
      .querySelectorAll(".qo")
      .forEach((b, j) => {
        b.disabled = true;
        if (q.o[j][1]) b.classList.add("ok");
        else if (j === k) b.classList.add("no");
      });
    $("st").textContent =
      (ok ? "Correct! " : k < 0 ? "Time is up. " : "Not quite. ") +
      (q.mr ? `Maya got it in ${(q.mt / 1000).toFixed(1)}s` : "Maya missed this one") +
      ` · You ${a} · Maya ${m}`;
    setTimeout(() => {
      if (me !== sess) return;
      i++;
      i < 3 ? show() : fin();
    }, 2300);
  }
  function fin() {
    const w = a > m,
      d = a === m,
      gain = a * 2 + (w ? 20 : 5);
    XP += gain;
    $("st").textContent = "Final score";
    $("qa").innerHTML =
      `<div class="qq" style="font-size:22px">${w ? "🏆 You win!" : d ? "🤝 Draw" : "Maya wins"}</div><div class="qq">You ${a} · Maya ${m}</div><div class="qq" style="color:#ffc864">+${gain} XP · total ${XP} XP</div><div class="rbs"><button class="rb" id="rm">Rematch</button><button class="rb alt" id="xp">⭐ XP & Share</button></div>`;
    $("xp").onclick = xpCard;
    $("rm").onclick = () => {
      doneS = -1;
      quiz(dh, me);
      bindHdr();
    };
    done(
      w
        ? `You win! ${a}–${m} (+${gain} XP)`
        : d
          ? `Draw ${a}–${m} (+${gain} XP)`
          : `Maya wins ${m}–${a} (+${gain} XP)`,
    );
  }
  show();
}
// ---- cinema player ----
function filmP(dh, mv, me) {
  film = mv;
  const u = IMG[mv.id],
    D = 130;
  let on = false,
    tt = 0,
    last = performance.now(),
    mute = false;
  const CM = [
    [2, ["Okay that opening shot?? 😭 The light in this scene is unreal."]],
    [
      10,
      [
        { v: 9 },
        "Sorry, voice note because typing is too slow. You pressed play and I was already there. I can literally feel the room sync 🤯",
      ],
    ],
    [24, ['Also: zero "3, 2, 1, press play" this time. Nobody is ever out of sync again 🙌']],
    [42, ["The sound is giving me goosebumps. Are you wearing headphones? 🎧"]],
    [64, [{ e: "🍿" }, "I have not touched any other app. That never happens 😂"]],
    [
      90,
      [
        "Honest review so far: 10/10, would watch with you again.",
        "Can this be a real feature? Like, now? 😭",
      ],
    ],
  ];
  dock.innerHTML =
    dh("🍿", mv.n) +
    `<div class="scr2" id="sr"><div class="mb" style="background-image:url(${u})"></div><img class="pc" src="${u}" alt="${mv.n} poster"><img class="pv ${mv.id === "list" ? "wide" : ""}" src="${u}" alt=""><div class="ls"></div><div class="dust">${Array.from({ length: 12 }, (_, i) => `<span style="left:${(i * 37) % 100}%;animation-delay:${(i % 6) * 0.5}s"></span>`).join("")}</div><div class="vg"></div><div class="lb t"></div><div class="lb b"></div><span class="now">NOW SHOWING · SIMULATED</span></div>
 <div class="room">${av("alex")}${av("maya")}<span>Watching together · 2 in the room</span></div>
 <div class="prow"><button id="pp" aria-label="Pause" disabled>⏸</button><div class="pg2"><i id="pb"></i></div><span id="tm">0:00</span><button id="mu" aria-label="Sound">🔊</button></div>
 <div class="ctl"><button data-e="🔥"><b>🔥</b><small>0</small></button><button data-e="😱"><b>😱</b><small>0</small></button><button data-e="❤️"><b>❤️</b><small>0</small></button><button data-e="👏"><b>👏</b><small>0</small></button></div><div id="st" style="margin-top:6px">Double-tap the screen for ❤️ · clip preview · sync simulated</div></div>`;
  const sr = $("sr");
  sr.classList.add("run");
  FA = cueFilm();
  let vd = null;
  const CL = CLIP[mv.id];
  if (CL) {
    const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pb = document.createElement("button");
    pb.className = "pbtn";
    pb.setAttribute("aria-label", "Play video");
    pb.textContent = "▶";
    pb.hidden = true;
    vd = document.createElement("video");
    vd.className = "iv";
    vd.muted = true;
    vd.defaultMuted = true;
    vd.loop = true;
    vd.playsInline = true;
    vd.setAttribute("playsinline", "");
    vd.setAttribute("preload", "auto");
    vd.setAttribute("aria-label", mv.n + " clip");
    [["video/mp4", CL.mp4], ["video/webm", CL.webm]].forEach(([t, src]) => {
      const e = document.createElement("source");
      e.type = t;
      e.src = src;
      vd.appendChild(e);
    });
    const fail = () => {
      if (vd) vd.remove();
      pb.remove();
      sr.classList.remove("hasv");
    };
    vd.lastChild.addEventListener("error", fail);
    vd.addEventListener("error", fail);
    const go = () => {
      const pr = vd.play();
      if (pr && pr.then)
        pr.then(() => (pb.hidden = true)).catch(() => (pb.hidden = false));
    };
    pb.onclick = go;
    sr.classList.add("hasv");
    sr.appendChild(vd);
    sr.appendChild(pb);
    if (reduce) pb.hidden = false;
    else go();
    const stopAudio = FA.stop;
    FA.stop = () => {
      stopAudio();
      if (vd) {
        vd.pause();
        vd.removeAttribute("src");
        vd.querySelectorAll("source").forEach((x) => x.remove());
        vd.load();
      }
    };
  }
  setTimeout(() => {
    if (me === sess && sr.isConnected) {
      sr.classList.add("done");
      on = true;
      $("pp").disabled = false;
    }
  }, 4900);
  $("pp").onclick = () => {
    on = !on;
    if (FA && FA.pause) FA.pause(!on);
    if (vd) {
      if (on) vd.play().catch(() => {});
      else vd.pause();
    }
    sr.classList.toggle("paused", !on);
    $("pp").textContent = on ? "⏸" : "▶";
    add((on ? "▶ Resumed" : "⏸ Paused") + " for both of you", "sys");
    if (!on)
      setTimeout(() => {
        if (me === sess) add(pick(["Snack break 🍿", "Pausing is the best feature honestly."]));
      }, 900);
  };
  $("mu").onclick = () => {
    mute = !mute;
    $("mu").textContent = mute ? "🔇" : "🔊";
    if (FA) FA.mute(mute);
  };
  const RC = { "🔥": 0, "😱": 0, "❤️": 0, "👏": 0 },
    rc = (e, n) => {
      RC[e] += n;
      const b = dock.querySelector(`[data-e="${e}"]`);
      if (b) {
        b.querySelector("small").textContent = RC[e];
        b.classList.remove("pop");
        void b.offsetWidth;
        b.classList.add("pop");
      }
    };
  const burst = (e, n, mine) => {
    for (let i = 0; i < n; i++)
      setTimeout(() => {
        if (me !== sess || !sr.isConnected) return;
        const x = document.createElement("span");
        x.className = "rx" + (mine ? "" : " rm");
        x.textContent = e;
        x.setAttribute("aria-hidden", "true");
        x.style.setProperty("--sx", Math.random() * 16 - 8 + "px");
        x.style.setProperty("--d", 2.3 + Math.random() * 0.8 + "s");
        x.style[mine ? "left" : "right"] = 5 + Math.random() * 10 + "%";
        sr.appendChild(x);
        setTimeout(() => x.remove(), 3300);
      }, i * 80);
  };
  dock.querySelectorAll("[data-e]").forEach(
    (b) =>
      (b.onclick = () => {
        const e = b.dataset.e;
        burst(e, e === "❤️" ? 4 : 3, 1);
        rc(e, 1);
        setTimeout(() => {
          if (me !== sess) return;
          burst(pick(e === "❤️" ? ["❤️", "😍", "🥹"] : [e, "🔥", "👏"]), 2, 0);
          rc(e, 1);
          if (Math.random() < 0.45)
            mq([
              pu([
                "That intro was gorgeous.",
                "Okay, this looks incredible.",
                "I would absolutely watch this with you.",
                "Same energy. I am screaming internally 😭",
              ]),
            ]);
        }, 900);
      }),
  );
  let lt = 0;
  sr.addEventListener("pointerdown", (e) => {
    const n = Date.now();
    if (n - lt < 340) {
      const r = sr.getBoundingClientRect(),
        h = document.createElement("span");
      h.className = "bh";
      h.textContent = "❤️";
      h.style.left = e.clientX - r.left + "px";
      h.style.top = e.clientY - r.top + "px";
      sr.appendChild(h);
      setTimeout(() => h.remove(), 1000);
      burst("❤️", 3, 1);
      rc("❤️", 1);
      lt = 0;
    } else lt = n;
  });
  const MR = [
    [7, "❤️", 1],
    [16, "🔥", 1],
    [26, "👏", 1],
    [37, "❤️", 1],
    [50, "😱", 1],
    [64, "❤️", 1],
  ];
  function fl(e, p) {
    const x = document.createElement("span");
    x.className = "rx";
    x.textContent = e;
    x.style.setProperty("--d", "1.9s");
    x.style.left = p + "%";
    sr.appendChild(x);
    setTimeout(() => x.remove(), 2200);
  }
  (function lp(n) {
    if (me !== sess || !$("pb")) return;
    const dt = Math.min(0.1, (n - last) / 1000);
    last = n;
    if (on) {
      tt = Math.min(D, tt + dt);
      for (const c of CM)
        if (tt >= c[0] && !c[2]) {
          c[2] = 1;
          mq(c[1]);
        }
      for (const c of MR)
        if (tt >= c[0] && !c[3]) {
          c[3] = 1;
          burst(c[1], c[2], 0);
          rc(c[1], c[2]);
        }
    }
    $("pb").style.width = (tt / D) * 100 + "%";
    $("tm").textContent = Math.floor(tt / 60) + ":" + String(Math.floor(tt % 60)).padStart(2, "0");
    requestAnimationFrame(lp);
  })(last);
}
