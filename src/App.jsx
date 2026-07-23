import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { db } from "./firebaseConfig";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

const BUILTIN_QUOTES = [
  // Easy — simple, immediately clear, no unpacking required
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", difficulty: "Easy" },
  { text: "It's not that I'm so smart, it's just that I stay with problems longer.", author: "Albert Einstein", difficulty: "Easy" },
  { text: "Slow and steady wins the race.", author: "Aesop, \"The Tortoise and the Hare\"", difficulty: "Easy" },
  { text: "Life is what happens to you while you're busy making other plans.", author: "Allen Saunders", difficulty: "Easy" },
  { text: "You must do the thing you think you cannot do.", author: "Eleanor Roosevelt", difficulty: "Easy" },
  { text: "It is not too late to seek a newer world.", author: "Alfred, Lord Tennyson", difficulty: "Easy" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky", difficulty: "Easy" },
  { text: "The most difficult thing is the decision to act, the rest is merely tenacity.", author: "Amelia Earhart", difficulty: "Easy" },
  { text: "A journey of a thousand miles begins with a single step.", author: "Laozi", difficulty: "Easy" },
  { text: "The unexamined life is not worth living.", author: "Socrates", difficulty: "Easy" },
  // Medium — pointed in a few different directions at once
  { text: "Habit is habit, and not to be flung out of the window by any man, but coaxed downstairs a step at a time.", author: "Mark Twain", difficulty: "Medium" },
  { text: "Some books are to be tasted, others to be swallowed, and some few to be chewed and digested.", author: "Francis Bacon", difficulty: "Medium" },
  { text: "Only the wisest and the stupidest of men never change.", author: "Confucius", difficulty: "Medium" },
  { text: "Not everything that is faced can be changed, but nothing can be changed until it is faced.", author: "James Baldwin", difficulty: "Medium" },
  { text: "The chains of habit are too weak to be felt until they are too strong to be broken.", author: "Samuel Johnson", difficulty: "Medium" },
  { text: "I am not afraid of storms, for I am learning how to sail my ship.", author: "Louisa May Alcott", difficulty: "Medium" },
  { text: "To be great is to be misunderstood.", author: "Ralph Waldo Emerson", difficulty: "Medium" },
  { text: "We must always take sides. Neutrality helps the oppressor, never the victim.", author: "Elie Wiesel", difficulty: "Medium" },
  { text: "I know that I know nothing.", author: "Socrates", difficulty: "Medium" },
  { text: "Bad men need nothing more to compass their ends than that good men should look on and do nothing.", author: "John Stuart Mill", difficulty: "Medium" },
  { text: "The question is not what you look at, but what you see.", author: "Henry David Thoreau", difficulty: "Medium" },
  { text: "Against stupidity the gods themselves contend in vain.", author: "Friedrich Schiller", difficulty: "Medium" },
  // Hard — abstract and dense, takes real work to unpack
  { text: "Our inventions are wont to be pretty toys, which distract our attention from serious things. They are but improved means to an unimproved end.", author: "Henry David Thoreau", difficulty: "Hard" },
  { text: "We abuse land because we regard it as a commodity belonging to us. When we see land as a community to which we belong, we may begin to use it with love and respect.", author: "Aldo Leopold", difficulty: "Hard" },
  { text: "The fundamental cause of the trouble is that in the modern world the stupid are cocksure, while the intelligent are full of doubt.", author: "Bertrand Russell", difficulty: "Hard" },
  { text: "Integrity without knowledge is weak and useless, and knowledge without integrity is dangerous and dreadful.", author: "Samuel Johnson", difficulty: "Hard" },
  { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche", difficulty: "Hard" },
  { text: "We are all atheists about most of the gods humanity has ever believed in. Some of us just go one god further.", author: "Richard Dawkins", difficulty: "Hard" },
  { text: "We alone regard a man who takes no interest in public affairs, not as a harmless, but as a useless character.", author: "Pericles", difficulty: "Hard" },
  { text: "Life can only be understood backwards; but it must be lived forwards.", author: "Søren Kierkegaard", difficulty: "Hard" },
  { text: "They are normal only in relation to a profoundly abnormal society. Their perfect adjustment to that abnormal society is a measure of their mental sickness.", author: "Aldous Huxley", difficulty: "Hard" },
  { text: "The good we secure for ourselves is precarious and uncertain until it is secured for all of us and incorporated into our common life.", author: "Jane Addams", difficulty: "Hard" },
  { text: "Cowardice asks the question: is it safe? Expediency asks the question: is it politic? Vanity asks the question: is it popular? But conscience asks the question: is it right?", author: "Martin Luther King Jr.", difficulty: "Hard" },
  { text: "The unleashed power of the atom has changed everything save our modes of thinking, and we thus drift toward unparalleled catastrophe.", author: "Albert Einstein", difficulty: "Hard" },
  // Insane-O Crazy — completely unhinged, barely makes sense, that's the point
  { text: "Bro WHAT ARE YOU DOING??", author: "CS:GO Players", difficulty: "Insane-O Crazy" },
  { text: "Bruh, bruh.", author: "Oliver, Invincible", difficulty: "Insane-O Crazy" },
  { text: "Numbers, Mason. What do they mean?", author: "Call of Duty: Black Ops", difficulty: "Insane-O Crazy" },
  { text: "It's Wednesday, my dudes.", author: "The Bushy-Brow Kid, Vine", difficulty: "Insane-O Crazy" },
  { text: "Road work ahead? Uh, yeah, I sure hope it does.", author: "Vine", difficulty: "Insane-O Crazy" },
  { text: "Hi, welcome to Chili's.", author: "Vine", difficulty: "Insane-O Crazy" },
  { text: "This is fine.", author: "The Dog, Sitting In A Burning Room", difficulty: "Insane-O Crazy" },
  { text: "Big Chungus.", author: "Bugs Bunny, Probably", difficulty: "Insane-O Crazy" },
  { text: "Ight, imma head out.", author: "SpongeBob SquarePants", difficulty: "Insane-O Crazy" },
  { text: "Skill issue.", author: "Anonymous, Constantly", difficulty: "Insane-O Crazy" },
  { text: "Sir, this is a Wendy's.", author: "Every Group Chat, Eventually", difficulty: "Insane-O Crazy" },
  { text: "Poggers.", author: "Twitch Chat, Always", difficulty: "Insane-O Crazy" },
  { text: "E.", author: "Someone, Somewhere, For No Reason", difficulty: "Insane-O Crazy" },
  { text: "The floor is lava. It always has been.", author: "Every Little Sibling, Ever", difficulty: "Insane-O Crazy" },
  { text: "One does not simply walk into the dining hall after 8pm.", author: "Boromir, Lord of the Rings", difficulty: "Insane-O Crazy" },
];

const DIFFICULTY_CONFIG = {
  Easy: { color: "#34d399", glow: "#34d39940" },
  Medium: { color: "#fbbf24", glow: "#fbbf2440" },
  Hard: { color: "#fb923c", glow: "#fb923c40" },
  "Insane-O Crazy": { color: "#e879f9", glow: "#e879f940" },
  Random: { color: "#22d3ee", glow: "#22d3ee40" },
};

// Quotes saved before the tier was renamed still carry the old spelling in
// Firestore. The rules forbid update/delete, so those documents can never be
// rewritten — remap them on read instead, or they belong to no tier at all
// and show up in "All" while being unreachable from every difficulty filter.
const LEGACY_DIFFICULTY = {
  "Insaneo CRAZY": "Insane-O Crazy",
  "Insane-o Crazy": "Insane-O Crazy",
  "Insane-O crazy": "Insane-O Crazy",
};

// ── Update log ──────────────────────────────────────────────────
// Newest first. Written for students using the site, not for developers:
// say what changed for *them*, not which component was refactored.
// `tag` drives the dot colour — "new" | "fix" | "big".
const CHANGELOG = [
  {
    date: "2026-07-23",
    title: "About page & update log",
    tag: "new",
    items: [
      "Added this About page, so you know who's behind the site.",
      "Added the update log you're reading right now.",
      "Fixed community submissions for the Insane-O Crazy tier — they were being silently rejected.",
      "Two community quotes that had gone missing from the Insane-O Crazy filter are back.",
    ],
  },
  {
    date: "2026-07-22",
    title: "Smoother launch, better practice controls",
    tag: "big",
    items: [
      "Rebuilt the Start Session animation from scratch.",
      "You can now pick your reading time: none, 5, 10, or 15 seconds.",
      "A beep every 30 seconds for the first 90, so you can pace your intro without watching the clock.",
      "Prep tips now show while you wait for the timer to start.",
      "Recording starts at reading time instead of speaking time, so you catch your whole run.",
    ],
  },
  {
    date: "2026-07-19",
    title: "The mascots fight back",
    tag: "new",
    items: [
      "Atlas and the dragon now react when you click them. Go find out.",
    ],
  },
  {
    date: "2026-07-17",
    title: "Record yourself",
    tag: "big",
    items: [
      "Optional video recording of your speech, downloadable when you finish.",
      "Nothing is ever uploaded — the recording stays in your browser and disappears when you leave.",
      "Added a Finish Now button for when you wrap early.",
      "Rewrote the whole Insane-O Crazy tier.",
    ],
  },
  {
    date: "2026-07-16",
    title: "The big redesign",
    tag: "big",
    items: [
      "Completely new look — violet and cyan on deep navy.",
      "Added the All Quotations tab so you can browse the whole pool.",
      "Added community submissions, so anyone can grow the quote pool.",
      "Went live at edwardspracticewebsite.com.",
    ],
  },
  {
    date: "2026-02-26",
    title: "The first version",
    tag: "new",
    items: [
      "The original build. It looked like crap. Everything above is what happened next.",
    ],
  },
];

const CHANGELOG_TAGS = {
  new: { label: "New", color: "var(--accent-2)" },
  fix: { label: "Fixed", color: "var(--good)" },
  big: { label: "Big update", color: "var(--accent)" },
};

const PHASES = {
  IDLE: "IDLE",
  BUFFER: "BUFFER",
  READING: "READING",
  SPEAKING: "SPEAKING",
  DONE: "DONE",
};

// Rotating tips shown during the "get ready" buffer, researched from
// real NFA/college-circuit impromptu coaching resources
const IMPROMPTU_TIPS = [
  "Remember to say quotation, not quote — quote is a verb!",
  "Open with a hook, not a summary — grab them in the first ten seconds.",
  "Signpost your roadmap in minute one so the judge knows exactly where you're headed.",
  "Pick your structure fast — chronological, categorical, or compare-contrast — then commit.",
  "Budget your 7 minutes evenly so your conclusion doesn't get rushed at the end.",
  "Every point needs a \"so what\" — tell them why it actually matters.",
  "Try the PREP method: Point, Reason, Example, Point.",
  "Concrete examples beat abstract claims every time — get specific.",
  "Bridge your points with real transitions, like \"which brings me to...\"",
  "Your notecard is a backup, not a script — talk to the judge, don't read to them.",
  "Eye contact equals confidence — look up, not down at your card.",
  "Swap \"um\" for a confident pause — silence beats a filler word.",
  "Nail your thesis in one clear sentence before you dive into your points.",
  "Take a breath. You've got this — the timer starts soon.",
  "Make sure you're ready to go — you'll start speaking any second.",
];

const LEGAL_CONTENT = {
  terms: {
    label: "Terms",
    title: "Terms of Service",
    body: [
      "This site is a free practice tool built for the Simpson College Speech & Debate team. Use it to practice — that's it.",
      "It's provided as-is, with no guarantees of uptime, accuracy, or availability. Things may change, break, or disappear without notice.",
      "Don't submit offensive, harassing, or inappropriate content through the quotation submission form. Submissions are visible to everyone using the site and may be removed at any time.",
    ],
  },
  privacy: {
    label: "Privacy",
    title: "Privacy",
    body: [
      "There are no accounts, logins, or tracking on this site. We don't collect analytics or personal data.",
      "The only data we store is what you type into the \"Submit a Quotation\" form (the quote text and author) — that's saved to a shared database visible to everyone using the site.",
      "Practice recordings (video/audio) never leave your browser. Nothing is uploaded or stored anywhere — the recording exists only in your browser tab and is gone for good the moment you refresh or close the page.",
    ],
  },
  copyright: {
    label: "Copyright",
    title: "Copyright",
    body: [
      "This site's design, code, and original artwork (including Atlas and the dragon mascots) belong to the Simpson College Speech & Debate team.",
      "Quotations submitted or included on this site remain the property of their original speakers or authors. They're used here for practice and educational purposes, not for commercial gain.",
      "If you believe something on this site infringes your rights, let us know and we'll take a look.",
    ],
  },
};

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getRandomQuote(difficulty, pool, lastQuoteText = null) {
  let filtered =
    difficulty === "Random"
      ? pool
      : pool.filter((q) => q.difficulty === difficulty);
  if (!filtered.length) filtered = pool;
  // Remove the last used quote to avoid back-to-back repeats (only if pool has more than 1)
  const noRepeat = filtered.filter((q) => q.text !== lastQuoteText);
  const candidates = noRepeat.length > 0 ? noRepeat : filtered;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// ── Circular progress ring used for every countdown ─────────────
function CircularTimer({ value, max, color, size = 220, strokeWidth = 6, big, calm }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const offset = circumference * (1 - progress);
  const stroke = calm ? "url(#timerGradient)" : color;

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        margin: "0 auto 2.5rem",
        filter: `drop-shadow(0 0 30px ${color}35)`,
      }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", display: "block" }}>
        <defs>
          <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--accent-2)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border-soft)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.4s ease" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{
          fontFamily: "var(--font-display)",
          fontSize: big ? "4.4rem" : "3.2rem",
          fontWeight: 600,
          color,
          letterSpacing: "-0.02em",
          textShadow: `0 0 30px ${color}70`,
          transition: "color 0.4s",
        }}>
          {big ? value : formatTime(value)}
        </span>
      </div>
    </div>
  );
}

// ── Flying mascot #1: a laser-eyed cyborg dog ────────────────────
function CyborgDog() {
  const legXs = [56, 76, 116, 136];
  return (
    <svg width="210" height="160" viewBox="0 0 210 160" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="dogTan" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F0B27A" />
          <stop offset="100%" stopColor="#C9844B" />
        </linearGradient>
        <linearGradient id="dogTanDark" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#B5723A" />
          <stop offset="100%" stopColor="#8A5A2C" />
        </linearGradient>
        <linearGradient id="dogMetal" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#B9D4F0" />
          <stop offset="100%" stopColor="#5A7DA0" />
        </linearGradient>
        <radialGradient id="dogEyeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e0f7ff" />
          <stop offset="45%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </radialGradient>
      </defs>

      {/* LEFT LASER */}
      <line x1="40" y1="82" x2="-600" y2="82" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round">
        <animate attributeName="opacity" values="0;0;1;1;1;0" dur="2.8s" repeatCount="indefinite" />
      </line>
      <line x1="40" y1="82" x2="-600" y2="82" stroke="#f8717133" strokeWidth="12" strokeLinecap="round">
        <animate attributeName="opacity" values="0;0;1;1;1;0" dur="2.8s" repeatCount="indefinite" />
      </line>
      {/* RIGHT LASER */}
      <line x1="152" y1="82" x2="800" y2="82" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round">
        <animate attributeName="opacity" values="0;0;1;1;1;0" dur="2.8s" repeatCount="indefinite" begin="1.4s" />
      </line>
      <line x1="152" y1="82" x2="800" y2="82" stroke="#f8717133" strokeWidth="12" strokeLinecap="round">
        <animate attributeName="opacity" values="0;0;1;1;1;0" dur="2.8s" repeatCount="indefinite" begin="1.4s" />
      </line>

      {/* TAIL */}
      <path d="M43,82 Q16,62 22,42 Q28,24 46,34" stroke="url(#dogTanDark)" strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M43,82 Q16,62 22,42 Q28,24 46,34" stroke="url(#dogTan)" strokeWidth="7" strokeLinecap="round" fill="none" />

      {/* BODY */}
      <ellipse cx="97" cy="82" rx="58" ry="27" fill="url(#dogTan)" />

      {/* NECK */}
      <ellipse cx="146" cy="72" rx="19" ry="16" fill="url(#dogTan)" />

      {/* HEAD */}
      <ellipse cx="160" cy="59" rx="29" ry="24" fill="url(#dogTan)" />

      {/* SNOUT */}
      <ellipse cx="181" cy="67" rx="15" ry="10" fill="url(#dogTanDark)" />
      <ellipse cx="193" cy="68" rx="5" ry="4" fill="#1A0F08" />
      <circle cx="192" cy="66.5" r="1.5" fill="white" opacity="0.55" />

      {/* EARS */}
      <polygon points="141,50 149,22 161,50" fill="url(#dogTanDark)" />
      <polygon points="142,50 149,29 159,50" fill="#EAA07888" />
      <polygon points="158,47 166,19 175,47" fill="url(#dogTanDark)" />
      <polygon points="159,47 166,25 174,47" fill="#EAA07888" />

      {/* METAL ARMOR PLATE */}
      <rect x="50" y="68" width="52" height="27" rx="6" fill="url(#dogMetal)" />
      <rect x="50" y="68" width="52" height="8" rx="4" fill="#3A5570" />
      <line x1="50" y1="81.5" x2="102" y2="81.5" stroke="#3A5570" strokeWidth="1.2" opacity="0.6" />
      <line x1="76" y1="68" x2="76" y2="95" stroke="#3A5570" strokeWidth="1.2" opacity="0.6" />
      <circle cx="57" cy="73" r="2.2" fill="#3A5570" />
      <circle cx="95" cy="73" r="2.2" fill="#3A5570" />
      <circle cx="57" cy="89" r="2.2" fill="#3A5570" />
      <circle cx="95" cy="89" r="2.2" fill="#3A5570" />

      {/* LASER EMITTER PORTS */}
      <circle cx="40" cy="82" r="6.5" fill="#3A5570" />
      <circle cx="40" cy="82" r="4" fill="#f87171"><animate attributeName="opacity" values="0.45;1;0.45" dur="2.8s" repeatCount="indefinite" /></circle>
      <circle cx="152" cy="82" r="6.5" fill="#3A5570" />
      <circle cx="152" cy="82" r="4" fill="#f87171"><animate attributeName="opacity" values="0.45;1;0.45" dur="2.8s" repeatCount="indefinite" begin="1.4s" /></circle>

      {/* NORMAL EYE */}
      <ellipse cx="173" cy="56" rx="5.5" ry="5" fill="#1A0F08" />
      <circle cx="174.5" cy="54.5" r="1.5" fill="white" />

      {/* CYBORG EYE — glowing accent core, tied to site palette */}
      <circle cx="150" cy="57" r="9.5" fill="#0A0A12" />
      <circle cx="150" cy="57" r="7.5" fill="url(#dogEyeGlow)" />
      <circle cx="151" cy="56" r="1.4" fill="white" opacity="0.9" />
      <circle cx="150" cy="57" r="9.5" stroke="#B9D4F0" strokeWidth="1.3" fill="none" />
      <circle cx="150" cy="57" r="14" fill="#22d3ee14">
        <animate attributeName="r" values="11;15;11" dur="1.3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0.75;0.4" dur="1.3s" repeatCount="indefinite" />
      </circle>

      {/* MOUTH */}
      <path d="M179,75 Q185,79 189,75" stroke="#1A0F08" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* LEGS */}
      {legXs.map((x, i) => (
        <rect key={i} x={x - 7} y={104} width="13" height="22" rx="4" fill="url(#dogTanDark)" />
      ))}

      {/* ROCKET BOOSTERS */}
      {legXs.map((cx, i) => (
        <g key={i}>
          <rect x={cx - 8} y={123} width="16" height="11" rx="3" fill="url(#dogMetal)" />
          <rect x={cx - 8} y={123} width="16" height="4" rx="2" fill="#3A5570" />
          <path d={`M${cx-6},134 L${cx-9},138 L${cx+9},138 L${cx+6},134 Z`} fill="#3A4658" />
          <ellipse cx={cx} cy={145} rx="8" ry="12">
            <animate attributeName="fill" values="#FF5500;#FF8800;#FF3300;#FF7700" dur="0.13s" repeatCount="indefinite" />
            <animate attributeName="ry" values="12;16;9;14;12" dur="0.13s" repeatCount="indefinite" />
          </ellipse>
          <ellipse cx={cx} cy={143} rx="5" ry="7">
            <animate attributeName="fill" values="#FFCC00;#FFEE00;#FF9900;#FFDD00" dur="0.13s" repeatCount="indefinite" />
            <animate attributeName="ry" values="7;10;5;9;7" dur="0.13s" repeatCount="indefinite" />
          </ellipse>
          <ellipse cx={cx} cy={140} rx="2.5" ry="3" fill="white" opacity="0.88" />
        </g>
      ))}
    </svg>
  );
}

// ── Flying mascot #2: an improv dragon with a glowing eye ────────
function ImprovDragon() {
  return (
    <svg width="270" height="230" viewBox="0 0 270 230" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="dragonBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2dd4a7" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>
        <linearGradient id="dragonDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#115e59" />
          <stop offset="100%" stopColor="#053b36" />
        </linearGradient>
        <linearGradient id="dragonWing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5eead4" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0f766e" stopOpacity="0.75" />
        </linearGradient>
        <linearGradient id="dragonGold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <radialGradient id="dragonEyeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f5f3ff" />
          <stop offset="45%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#22d3ee" />
        </radialGradient>
      </defs>

      {/* LEFT WING */}
      <path d="M108,100 Q68,55 25,32 Q48,72 80,94 Q94,100 108,100 Z" fill="url(#dragonWing)" stroke="url(#dragonDark)" strokeWidth="1.5" />
      <line x1="108" y1="100" x2="25" y2="32" stroke="#053b36" strokeWidth="1" opacity="0.5" />
      <line x1="103" y1="95" x2="55" y2="56" stroke="#053b36" strokeWidth="1" opacity="0.3" />
      <line x1="97"  y1="91" x2="72" y2="70" stroke="#053b36" strokeWidth="1" opacity="0.3" />

      {/* RIGHT WING */}
      <path d="M162,100 Q202,55 248,28 Q228,68 196,93 Q179,100 162,100 Z" fill="url(#dragonWing)" stroke="url(#dragonDark)" strokeWidth="1.5" />
      <line x1="162" y1="100" x2="248" y2="28" stroke="#053b36" strokeWidth="1" opacity="0.5" />
      <line x1="167" y1="95" x2="218" y2="52" stroke="#053b36" strokeWidth="1" opacity="0.3" />
      <line x1="172" y1="91" x2="204" y2="68" stroke="#053b36" strokeWidth="1" opacity="0.3" />

      {/* TAIL */}
      <path d="M92,115 Q45,125 26,104 Q8,82 18,56 Q28,32 46,42"
        stroke="url(#dragonDark)" strokeWidth="16" fill="none" strokeLinecap="round" />
      <path d="M92,115 Q45,125 26,104 Q8,82 18,56 Q28,32 46,42"
        stroke="url(#dragonBody)" strokeWidth="10" fill="none" strokeLinecap="round" />
      <polygon points="44,40 38,28 57,38" fill="url(#dragonGold)" stroke="#b45309" strokeWidth="1" />

      {/* BODY */}
      <ellipse cx="135" cy="115" rx="55" ry="32" fill="url(#dragonBody)" />
      <ellipse cx="135" cy="120" rx="38" ry="20" fill="#5eead4" opacity="0.22" />

      {/* NECK */}
      <ellipse cx="174" cy="99" rx="20" ry="18" fill="url(#dragonBody)" />

      {/* HEAD */}
      <ellipse cx="196" cy="82" rx="30" ry="24" fill="url(#dragonBody)" />

      {/* SNOUT */}
      <ellipse cx="218" cy="89" rx="17" ry="11" fill="url(#dragonDark)" />
      <ellipse cx="233" cy="90" rx="5" ry="4" fill="#03211d" />
      <circle cx="232" cy="88.5" r="1.5" fill="white" opacity="0.4" />

      {/* HORNS */}
      <path d="M186,65 L178,37 L192,63 Z" fill="url(#dragonGold)" stroke="#b45309" strokeWidth="1" />
      <path d="M202,61 L197,32 L210,58 Z" fill="url(#dragonGold)" stroke="#b45309" strokeWidth="1" />

      {/* EYE — glowing accent core, matches CyborgDog's motif */}
      <ellipse cx="212" cy="79" rx="8" ry="7" fill="#03211d" />
      <ellipse cx="212" cy="79" rx="5.5" ry="5" fill="url(#dragonEyeGlow)" />
      <circle cx="213.5" cy="77.5" r="1.4" fill="white" opacity="0.85" />
      <ellipse cx="212" cy="79" rx="11" ry="10" fill="#a78bfa14">
        <animate attributeName="rx" values="9;13;9" dur="2.2s" repeatCount="indefinite" />
        <animate attributeName="ry" values="8;12;8" dur="2.2s" repeatCount="indefinite" />
      </ellipse>

      {/* MOUTH — grin */}
      <path d="M218,94 Q227,101 234,95" stroke="#03211d" strokeWidth="2" fill="none" strokeLinecap="round" />
      <polygon points="221,96 224,103 227,96" fill="white" />
      <polygon points="228,95 231,102 234,95" fill="white" />

      {/* CLAWS */}
      <path d="M150,141 L144,154 M150,141 L149,155 M150,141 L155,153" stroke="url(#dragonDark)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M115,141 L109,154 M115,141 L114,155 M115,141 L120,153" stroke="url(#dragonDark)" strokeWidth="2.5" strokeLinecap="round" />

      {/* CHAIN */}
      <path d="M183,113 Q180,135 177,158 Q175,172 170,182"
        stroke="url(#dragonGold)" strokeWidth="4.5" fill="none" strokeLinecap="round"
        strokeDasharray="9,6" />

      {/* MEDALLION */}
      <rect x="60" y="182" width="210" height="54" rx="14" fill="#06181a" stroke="url(#dragonGold)" strokeWidth="2.5" />
      <rect x="63" y="185" width="204" height="48" rx="11" fill="none" stroke="#b45309" strokeWidth="1" opacity="0.45" />
      <text x="165" y="204" textAnchor="middle"
        fill="#fde68a" fontFamily="'Space Mono', monospace" fontSize="10.5" fontWeight="700" letterSpacing="1.5">
        THE DRAGON WHO ALWAYS WINS
      </text>
      <text x="165" y="221" textAnchor="middle"
        fill="#fde68a" fontFamily="'Space Mono', monospace" fontSize="10.5" fontWeight="700" letterSpacing="2">
        DUO IMPROV
      </text>
      <ellipse cx="80" cy="198" rx="9" ry="5" fill="#fde68a" opacity="0.12" />
    </svg>
  );
}

// ── Cute little burst shown when a mascot gets clicked ────────────
function MascotReaction({ label, emojis }) {
  return (
    <>
      <div className="mascot-label">{label}</div>
      {emojis.map((e, i) => (
        <span
          key={i}
          className="mascot-particle"
          style={{
            left: `${22 + i * (56 / Math.max(emojis.length - 1, 1))}%`,
            "--dx": `${(i - (emojis.length - 1) / 2) * 22}px`,
            animationDelay: `${i * 0.07}s`,
          }}
        >
          {e}
        </span>
      ))}
    </>
  );
}

// ── The dragon's click reaction: a little dance + a fire-breath ──
// that spells out "HENRY", letter by letter, made of flame ────────
const HENRY_LETTERS = ["H", "E", "N", "R", "Y"];

function DragonFireBreath() {
  return (
    <div className="dragon-fire" aria-hidden="true">
      {/* Ember puffs licking out ahead of the letters */}
      {["🔥", "✨", "🔥", "✨"].map((e, i) => (
        <span
          key={`ember-${i}`}
          className="fire-ember"
          style={{
            left: `${i * 14}px`,
            top: `${(i % 2) * 10 - 6}px`,
            animationDelay: `${i * 0.09}s`,
          }}
        >
          {e}
        </span>
      ))}
      {/* The word itself, ignited one letter at a time */}
      <div className="fire-word">
        {HENRY_LETTERS.map((ch, i) => (
          <span
            key={ch + i}
            className="fire-letter"
            style={{ animationDelay: `${0.35 + i * 0.14}s` }}
          >
            {ch}
          </span>
        ))}
      </div>
    </div>
  );
}

function PracticeTab({ allQuotes, onPhaseChange }) {
  const [difficulty, setDifficulty] = useState("Random");
  const [phase, setPhase] = useState(PHASES.IDLE);
  const [countdown, setCountdown] = useState(0);
  const [currentQuote, setCurrentQuote] = useState(null);
  const [showCameraNotice, setShowCameraNotice] = useState(true);
  const [recordingEnabled, setRecordingEnabled] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState(null);
  const [tipIndex, setTipIndex] = useState(0);
  const [launching, setLaunching] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [readingSeconds, setReadingSeconds] = useState(10);

  const intervalRef = useRef(null);
  const launchTimerRef = useRef(null);
  const flashTimerRef = useRef(null);
  const orbRef = useRef(null);
  const audioCtxRef = useRef(null);
  const phaseRef = useRef(phase);
  const lastQuoteRef = useRef(null);
  const streamRef = useRef(null);
  const liveVideoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  phaseRef.current = phase;

  // Attach the live stream to the preview <video> once it's mounted — only
  // when it actually changes, so the element doesn't restart every render
  useEffect(() => {
    if (liveVideoRef.current && streamRef.current && liveVideoRef.current.srcObject !== streamRef.current) {
      liveVideoRef.current.srcObject = streamRef.current;
    }
  });

  // Request the camera as soon as this tab opens
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 },
            facingMode: "user",
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000,
          },
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        setRecordingEnabled(true);
        if (liveVideoRef.current) liveVideoRef.current.srcObject = stream;
      } catch (e) {
        if (!cancelled) setCameraError(true);
      }
    })();
    const dismissTimer = setTimeout(() => setShowCameraNotice(false), 9000);
    return () => {
      cancelled = true;
      clearTimeout(dismissTimer);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm")
      ? "video/webm"
      : "";
    const options = {
      ...(mimeType ? { mimeType } : {}),
      videoBitsPerSecond: 5_000_000,
      audioBitsPerSecond: 128_000,
    };
    const recorder = new MediaRecorder(streamRef.current, options);
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      setRecordingBlob(new Blob(chunksRef.current, { type: "video/webm" }));
    };
    recorder.start(1000);
    mediaRecorderRef.current = recorder;
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const clearTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const startCountdown = useCallback((seconds, onDone, onTick) => {
    clearTimer();
    setCountdown(seconds);
    let remaining = seconds;
    intervalRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      onTick && onTick(remaining);
      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        onDone();
      }
    }, 1000);
  }, []);

  const unlockAudio = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
    } catch (e) { /* Web Audio unsupported — beeps just won't play */ }
  };

  const playBeep = () => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } catch (e) { /* ignore playback errors */ }
  };

  const beginSpeaking = useCallback(() => {
    setPhase(PHASES.SPEAKING);
    startCountdown(420, () => {
      stopRecording();
      setPhase(PHASES.DONE);
    }, (remaining) => {
      // Beep every 30s, but only within the first 90s of the speech
      const elapsed = 420 - remaining;
      if (elapsed > 0 && elapsed <= 90 && elapsed % 30 === 0) playBeep();
    });
  }, [startCountdown]);

  const beginReading = useCallback(() => {
    startRecording();
    if (readingSeconds <= 0) {
      // No reading time — go straight into speaking
      beginSpeaking();
      return;
    }
    setPhase(PHASES.READING);
    startCountdown(readingSeconds, beginSpeaking);
  }, [startCountdown, readingSeconds, beginSpeaking]);

  const launchSession = () => {
    const quote = getRandomQuote(difficulty, allQuotes, lastQuoteRef.current);
    lastQuoteRef.current = quote.text;
    onPhaseChange && onPhaseChange("ACTIVE");
    setCurrentQuote(quote);
    setRecordingBlob(null);
    setPhase(PHASES.BUFFER);
    setTipIndex(Math.floor(Math.random() * IMPROMPTU_TIPS.length));
    startCountdown(10, beginReading);
  };

  const startSession = () => {
    if (launching) return;
    unlockAudio();

    // The orb can sit below the fold on short viewports. Bring it into view
    // first, and anchor the iris wipe to wherever it actually ends up, so the
    // transition always radiates out of the thing the user just pressed.
    const orb = orbRef.current;
    if (orb) {
      const r = orb.getBoundingClientRect();
      if (r.bottom > window.innerHeight || r.top < 0) {
        orb.scrollIntoView({ block: "center", behavior: "auto" });
      }
      const after = orb.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const cx = ((after.left + after.width / 2) / vw) * 100;
      const cy = ((after.top + after.height / 2) / vh) * 100;
      const root = document.documentElement.style;
      if (Number.isFinite(cx) && Number.isFinite(cy)) {
        root.setProperty("--iris-x", `${cx.toFixed(2)}%`);
        root.setProperty("--iris-y", `${cy.toFixed(2)}%`);
      } else {
        // Degenerate viewport — drop the vars so the CSS fallback centre applies.
        root.removeProperty("--iris-x");
        root.removeProperty("--iris-y");
      }
    }

    setLaunching(true);
    setShowFlash(true);
    clearTimeout(launchTimerRef.current);
    clearTimeout(flashTimerRef.current);
    // The phase swap happens while the flash is still covering the screen —
    // that's what makes it read as one continuous wipe instead of a hard cut.
    // Swap phases at the moment the iris is fully covering the viewport.
    launchTimerRef.current = setTimeout(() => {
      setLaunching(false);
      launchSession();
    }, 400);
    flashTimerRef.current = setTimeout(() => setShowFlash(false), 660);
  };

  const skipBuffer = () => {
    if (phaseRef.current !== PHASES.BUFFER) return;
    clearTimer();
    beginReading();
  };

  const finishNow = () => {
    if (phaseRef.current !== PHASES.SPEAKING) return;
    clearTimer();
    stopRecording();
    setPhase(PHASES.DONE);
  };

  const reset = () => {
    clearTimer();
    stopRecording();
    setPhase(PHASES.IDLE);
    setCurrentQuote(null);
    setCountdown(0);
    onPhaseChange && onPhaseChange("IDLE");
  };

  useEffect(() => () => {
    clearTimer();
    clearTimeout(launchTimerRef.current);
    clearTimeout(flashTimerRef.current);
  }, []);

  const videoUrl = useMemo(() => (recordingBlob ? URL.createObjectURL(recordingBlob) : null), [recordingBlob]);

  const handleDownload = () => {
    if (!videoUrl) return;
    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = `impromptu-speech-${Date.now()}.webm`;
    a.click();
  };

  const phaseLabel = {
    [PHASES.BUFFER]: "GET READY",
    [PHASES.READING]: "READ YOUR QUOTE",
    [PHASES.SPEAKING]: "SPEAKING",
    [PHASES.DONE]: "TIME'S UP",
  }[phase] || "";

  const isUrgent = phase === PHASES.SPEAKING && countdown <= 30;
  const isMedium = phase === PHASES.SPEAKING && countdown <= 60 && countdown > 30;

  const timerColor = isUrgent ? "var(--danger)" : isMedium ? "var(--warn)" : "var(--accent-2)";
  const timerCalm = !isUrgent && !isMedium;
  const timerMax = phase === PHASES.BUFFER ? 10 : phase === PHASES.READING ? readingSeconds : 420;

  const stepIndex = { [PHASES.BUFFER]: 0, [PHASES.READING]: 1, [PHASES.SPEAKING]: 2, [PHASES.DONE]: 3 }[phase] ?? -1;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1.5rem" }}>
      {showCameraNotice && createPortal(
        <div className="camera-notice" role="status">
          <div className="eyebrow" style={{ color: "var(--accent-2)", marginBottom: "0.5rem", fontSize: "0.65rem" }}>
            ↑ Allow camera & mic up here
          </div>
          <p style={{ fontFamily: "var(--font-body)", color: "var(--text)", fontSize: "0.85rem", lineHeight: 1.5, margin: "0 0 0.6rem" }}>
            We record your speech so you can download it and send it to Marisa, Tiana, or any other coach or UGA for feedback.
          </p>
          <p style={{ fontFamily: "var(--font-body)", color: "var(--text-dim)", fontSize: "0.78rem", lineHeight: 1.5, margin: "0 0 0.85rem" }}>
            Nothing is uploaded — the recording lives only in this tab and is deleted the moment you refresh or leave.
          </p>
          <button onClick={() => setShowCameraNotice(false)} className="chip-toggle">
            Got it
          </button>
        </div>,
        document.body
      )}

      {showFlash && createPortal(<div className="launch-flash" />, document.body)}

      {phase === PHASES.IDLE && (
        <div style={{
          marginBottom: "3rem",
          animation: "fadeUp 0.6s ease both",
          opacity: launching ? 0 : 1,
          transition: "opacity 0.3s ease",
        }}>
          <p className="eyebrow" style={{ marginBottom: "1.2rem", textAlign: "center" }}>
            Select Difficulty
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center", marginBottom: "2rem" }}>
            {Object.keys(DIFFICULTY_CONFIG).map((d) => {
              const active = difficulty === d;
              const cfg = DIFFICULTY_CONFIG[d];
              return (
                <button
                  key={d}
                  className="diff-btn"
                  onClick={() => setDifficulty(d)}
                  style={{
                    background: active ? cfg.color : "transparent",
                    color: active ? "#05060a" : cfg.color,
                    borderColor: cfg.color,
                    boxShadow: active ? `0 0 18px ${cfg.glow}` : "none",
                  }}
                >
                  {d}
                </button>
              );
            })}
          </div>

          <p className="eyebrow" style={{ marginBottom: "1.2rem", textAlign: "center" }}>
            Reading Time
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
            {[0, 5, 10, 15].map((secs) => {
              const active = readingSeconds === secs;
              return (
                <button
                  key={secs}
                  className="diff-btn diff-btn--sm"
                  onClick={() => setReadingSeconds(secs)}
                  style={{
                    background: active ? "var(--accent-2)" : "transparent",
                    color: active ? "#05060a" : "var(--accent-2)",
                    borderColor: "var(--accent-2)",
                    boxShadow: active ? "0 0 14px #22d3ee40" : "none",
                  }}
                >
                  {secs === 0 ? "None" : `${secs}s`}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {phase === PHASES.IDLE ? (
        <div style={{ textAlign: "center", animation: "fadeUp 0.8s ease 0.2s both" }}>
          <div ref={orbRef} className={launching ? "start-orb start-orb--launch" : "start-orb"} aria-hidden="true">
            {launching && (
              <>
                <span className="launch-ring launch-ring-1" />
                <span className="launch-ring launch-ring-2" />
              </>
            )}
            <svg width="56" height="56" viewBox="0 0 64 64" fill="none" className={launching ? "launch-icon" : ""}>
              <circle cx="32" cy="32" r="30" stroke="var(--accent-2)" strokeWidth="1" opacity="0.4" />
              <path d="M26 20 L26 44 L48 32 Z" fill="url(#playGrad)" />
              <defs>
                <linearGradient id="playGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--accent)" />
                  <stop offset="100%" stopColor="var(--accent-2)" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div style={{ opacity: launching ? 0 : 1, transition: "opacity 0.35s ease" }}>
            <button onClick={startSession} className="btn btn-primary start-btn" disabled={launching}>
              {launching ? "Launching..." : "Start Session"}
            </button>
          </div>
          <p style={{ marginTop: "1.5rem", fontFamily: "var(--font-body)", color: "var(--text-dim)", fontSize: "0.95rem", opacity: launching ? 0 : 1, transition: "opacity 0.35s ease" }}>
            {difficulty === "Random" ? "Any difficulty" : `${difficulty} quotes only`} · {allQuotes.filter(q => difficulty === "Random" || q.difficulty === difficulty).length} available
          </p>
        </div>
      ) : (
        <div className="buffer-content" style={{ textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: "0.4rem", marginBottom: "1.1rem" }}>
            {["Ready", "Read", "Speak"].map((label, i) => (
              <span key={label} className="step-dot" style={{
                background: i <= stepIndex ? timerColor : "var(--border-soft)",
                boxShadow: i === stepIndex ? `0 0 10px ${timerColor}` : "none",
              }} />
            ))}
          </div>

          {recordingEnabled && phase !== PHASES.DONE && (
            <div className="camera-preview" style={{
              borderColor: (phase === PHASES.READING || phase === PHASES.SPEAKING) ? "var(--danger)" : "var(--border)",
              boxShadow: (phase === PHASES.READING || phase === PHASES.SPEAKING) ? "0 0 24px #f8717140" : "0 8px 24px #00000080",
            }}>
              {(phase === PHASES.READING || phase === PHASES.SPEAKING) && (
                <div style={{
                  position: "absolute", top: 8, left: 10, zIndex: 10,
                  display: "flex", alignItems: "center", gap: 5,
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%", background: "var(--danger)",
                    animation: "pulse 1s ease infinite",
                  }} />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--danger)", letterSpacing: "0.1em" }}>REC</span>
                </div>
              )}
              <video
                ref={liveVideoRef}
                autoPlay
                muted
                playsInline
                style={{ width: "100%", display: "block", transform: "scaleX(-1)" }}
              />
            </div>
          )}

          <div className="eyebrow" style={{
            color: phase === PHASES.DONE ? "var(--accent-2)" : isUrgent ? "var(--danger)" : "var(--text-dim)",
            marginBottom: "2rem",
            animation: "pulse 1s ease infinite",
          }}>
            {phaseLabel}
          </div>

          {phase !== PHASES.DONE && (
            <CircularTimer
              value={countdown}
              max={timerMax}
              color={timerColor}
              size={220}
              big={phase === PHASES.BUFFER || phase === PHASES.READING}
              calm={timerCalm}
            />
          )}

          {phase === PHASES.BUFFER && (
            <div className="card tip-card" style={{ padding: "1.5rem 1.75rem", marginBottom: "2rem" }}>
              <div className="eyebrow" style={{ color: "var(--accent-2)", marginBottom: "0.6rem", fontSize: "0.62rem" }}>
                💡 Tip
              </div>
              <p key={tipIndex} className="tip-text" style={{
                fontFamily: "var(--font-body)",
                fontSize: "1.05rem",
                lineHeight: 1.5,
                color: "var(--text)",
                margin: 0,
              }}>
                {IMPROMPTU_TIPS[tipIndex]}
              </p>
            </div>
          )}

          {phase === PHASES.BUFFER && (
            <p style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.68rem",
              color: "var(--text-faint)",
              letterSpacing: "0.03em",
              lineHeight: 1.6,
              marginBottom: "2rem",
              maxWidth: 420,
              marginLeft: "auto",
              marginRight: "auto",
            }}>
              🔔 You'll hear a beep every 30 seconds for the first 90 seconds of your speech — then it stops.
            </p>
          )}

          {(phase === PHASES.READING || phase === PHASES.SPEAKING || phase === PHASES.DONE) && currentQuote && (
            <div className="card quote-box" style={{
              padding: "2.5rem 2rem",
              marginBottom: "2rem",
              animation: "fadeUp 0.5s ease both",
              position: "relative",
            }}>
              <div style={{ color: "var(--accent-2)", fontSize: "4rem", lineHeight: 0.5, fontFamily: "Georgia, serif", opacity: 0.3, marginBottom: "0.5rem" }}>"</div>
              <p className="quote-text" style={{
                fontFamily: "var(--font-body)",
                fontSize: "1.5rem",
                lineHeight: 1.6,
                color: "var(--text)",
                fontStyle: "italic",
                margin: "0 0 1.5rem",
              }}>
                {currentQuote.text}
              </p>
              <p style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.8rem",
                color: "var(--text-dim)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}>
                — {currentQuote.author}
              </p>
              <div className="tag-pill" style={{
                position: "absolute", top: "1rem", right: "1rem",
                background: `${DIFFICULTY_CONFIG[currentQuote.difficulty]?.color}18`,
                borderColor: `${DIFFICULTY_CONFIG[currentQuote.difficulty]?.color}50`,
                color: DIFFICULTY_CONFIG[currentQuote.difficulty]?.color,
              }}>
                {currentQuote.difficulty}
              </div>
            </div>
          )}

          {phase === PHASES.BUFFER && (
            <button onClick={skipBuffer} className="btn btn-ghost" style={{ padding: "0.65rem 1.75rem", marginBottom: "2rem" }}>
              Ready now? →
            </button>
          )}

          {cameraError && (phase === PHASES.BUFFER || phase === PHASES.READING) && (
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-faint)", letterSpacing: "0.04em", marginBottom: "1.5rem" }}>
              Camera/mic access wasn't granted — this session won't be recorded.
            </p>
          )}

          {phase === PHASES.DONE && (
            <div className="card" style={{ padding: "2.5rem 2rem", marginBottom: "2rem", animation: "fadeUp 0.5s ease both", textAlign: "center" }}>
              <div className="eyebrow" style={{ color: "var(--good)", marginBottom: "0.75rem" }}>
                ✓ Speech Complete
              </div>
              <p style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.5rem",
                fontWeight: 600,
                color: "var(--text)",
                marginBottom: recordingBlob ? "1.5rem" : "1.75rem",
              }}>
                Nice work. {recordingBlob ? "Here's your recording." : "Ready for another one?"}
              </p>

              {recordingBlob && videoUrl && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <video
                    src={videoUrl}
                    controls
                    style={{ width: "100%", maxHeight: 340, borderRadius: "var(--radius-sm)", background: "#000", display: "block" }}
                  />
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-faint)", letterSpacing: "0.04em", margin: "0.85rem 0 1.25rem" }}>
                    Download it now — this recording disappears the moment you refresh or leave this page.
                  </p>
                  <button onClick={handleDownload} className="btn btn-primary" style={{ padding: "0.85rem 2rem", width: "100%" }}>
                    ↓ Download Recording
                  </button>
                </div>
              )}

              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
                <button onClick={startSession} className="btn btn-primary" style={{ padding: "0.9rem 2rem" }}>
                  Practice Again
                </button>
                <button onClick={reset} className="btn btn-ghost" style={{ padding: "0.9rem 1.75rem" }}>
                  Done
                </button>
              </div>
            </div>
          )}

          {phase === PHASES.SPEAKING && (
            <div style={{ margin: "0 auto 2rem", maxWidth: 400 }}>
              <div style={{ height: 3, background: "var(--border-soft)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${(countdown / 420) * 100}%`,
                  background: timerColor,
                  transition: "width 1s linear, background 0.5s",
                  boxShadow: `0 0 8px ${timerColor}`,
                }} />
              </div>
            </div>
          )}

          {phase === PHASES.SPEAKING && (
            <button onClick={finishNow} className="btn btn-primary" style={{ padding: "0.7rem 2rem", marginRight: "0.75rem" }}>
              Finish Now
            </button>
          )}

          {phase !== PHASES.DONE && (
            <button onClick={reset} className="btn btn-ghost" style={{ padding: "0.65rem 2rem" }}>
              ← Reset
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const BROWSE_PAGE_SIZE = 10;

function BrowseTab({ allQuotes }) {
  const [difficulty, setDifficulty] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("pool");
  const [visibleCount, setVisibleCount] = useState(BROWSE_PAGE_SIZE);
  const [showJump, setShowJump] = useState(false);

  useEffect(() => {
    setVisibleCount(BROWSE_PAGE_SIZE);
  }, [difficulty, search, sort]);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setShowJump(window.scrollY > 600);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const counts = allQuotes.reduce((acc, q) => {
    acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
    return acc;
  }, {});

  const filtered = allQuotes.filter(q => {
    const matchesDifficulty = difficulty === "All" || q.difficulty === difficulty;
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || q.text.toLowerCase().includes(term) || q.author.toLowerCase().includes(term);
    return matchesDifficulty && matchesSearch;
  });

  const sorted = sort === "author"
    ? [...filtered].sort((a, b) => a.author.localeCompare(b.author))
    : filtered;

  const visible = sorted.slice(0, visibleCount);

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 1.5rem 2rem" }}>
      <div className="browse-filter-bar" style={{
        position: "sticky",
        top: "1rem",
        zIndex: 20,
        padding: "1.1rem",
        marginBottom: "1.75rem",
        borderRadius: "var(--radius-md)",
        background: "#121320f2",
        border: "1px solid var(--border)",
        boxShadow: "0 20px 40px -20px rgba(0,0,0,0.7)",
      }}>
        <input
          type="text"
          className="input"
          placeholder="Search by quote or author..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: "1rem" }}
        />
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", justifyContent: "center", marginBottom: "0.9rem" }}>
          {["All", ...Object.keys(DIFFICULTY_CONFIG).filter(d => d !== "Random")].map(d => {
            const active = difficulty === d;
            const cfg = d === "All" ? { color: "var(--accent-2)", glow: "#22d3ee40" } : DIFFICULTY_CONFIG[d];
            const count = d === "All" ? allQuotes.length : (counts[d] || 0);
            return (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className="diff-btn diff-btn--sm"
                style={{
                  background: active ? cfg.color : "transparent",
                  color: active ? "#05060a" : cfg.color,
                  borderColor: cfg.color,
                  boxShadow: active ? `0 0 14px ${cfg.glow}` : "none",
                }}
              >
                {d} · {count}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
          {[["pool", "Pool Order"], ["author", "A–Z by Author"]].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setSort(id)}
              className={`chip-toggle ${sort === id ? "chip-toggle--active" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="eyebrow" style={{ textAlign: "center", marginBottom: "1.25rem" }}>
        {filtered.length} {filtered.length === 1 ? "quote" : "quotes"}
        {filtered.length > 0 && ` · showing ${visible.length}`}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {visible.map((q, i) => {
          const cfg = DIFFICULTY_CONFIG[q.difficulty] || DIFFICULTY_CONFIG.Random;
          return (
            <div key={q.id || `${q.text}-${i}`} className="card list-card" style={{ padding: "1.5rem 1.75rem", position: "relative" }}>
              <div className="tag-pill" style={{
                position: "absolute", top: "1.1rem", right: "1.1rem",
                background: `${cfg.color}18`,
                borderColor: `${cfg.color}50`,
                color: cfg.color,
              }}>
                {q.difficulty}
              </div>
              <p style={{
                fontFamily: "var(--font-body)",
                fontSize: "1.1rem",
                lineHeight: 1.55,
                color: "var(--text)",
                fontStyle: "italic",
                margin: "0 0 0.75rem",
                paddingRight: "6rem",
              }}>
                "{q.text}"
              </p>
              <p style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "var(--text-dim)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}>
                — {q.author}
              </p>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--text-faint)", fontFamily: "var(--font-body)", fontStyle: "italic", padding: "2rem 0" }}>
            No quotes match your search.
          </p>
        )}
      </div>

      {visibleCount < sorted.length && (
        <div style={{ textAlign: "center", marginTop: "1.75rem" }}>
          <button onClick={() => setVisibleCount(c => c + BROWSE_PAGE_SIZE)} className="btn btn-ghost" style={{ padding: "0.75rem 2rem" }}>
            Show More ({sorted.length - visibleCount} left)
          </button>
        </div>
      )}

      {showJump && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="btn btn-primary jump-top-btn"
          aria-label="Back to top"
        >
          ↑ Top
        </button>
      )}
    </div>
  );
}

function SubmitTab({ onSubmit }) {
  const [form, setForm] = useState({ text: "", author: "", difficulty: "Medium" });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.text.trim() || !form.author.trim()) {
      setError("Please fill in both the quotation and the author.");
      return;
    }
    if (form.text.length < 15) {
      setError("The quotation seems too short. Please enter a full quote.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({ ...form, text: form.text.trim(), author: form.author.trim() });
      setSubmitted(true);
      setError("");
      setTimeout(() => {
        setSubmitted(false);
        setSaving(false);
        setForm({ text: "", author: "", difficulty: "Medium" });
      }, 3000);
    } catch (e) {
      console.error("Failed to save quote:", e);
      setError(
        e?.code === "permission-denied"
          ? "Saving is temporarily disabled by the site's database rules. Let Edward know."
          : "Failed to save. Check your connection and try again."
      );
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1.5rem", animation: "fadeUp 0.6s ease both" }}>
      <div className="card submit-card" style={{ padding: "2.5rem" }}>
        <h2 style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.8rem",
          color: "var(--text)",
          fontWeight: 600,
          marginBottom: "0.4rem",
        }}>
          Contribute a <span className="grad-text">Quotation</span>
        </h2>
        <p style={{ fontFamily: "var(--font-body)", color: "var(--text-dim)", fontSize: "1rem", marginBottom: "2rem" }}>
          Help grow the practice pool for everyone.
        </p>

        <div style={{ marginBottom: "1.5rem" }}>
          <label className="label">The Quotation</label>
          <textarea
            value={form.text}
            onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
            placeholder="Enter the full quotation..."
            rows={4}
            className="input"
          />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label className="label">Who Said It</label>
          <input
            type="text"
            value={form.author}
            onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
            placeholder="e.g. Maya Angelou"
            className="input"
          />
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <label className="label">Difficulty</label>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            {["Easy", "Medium", "Hard", "Insane-O Crazy"].map(d => {
              const active = form.difficulty === d;
              const cfg = DIFFICULTY_CONFIG[d];
              return (
                <button
                  key={d}
                  onClick={() => setForm(f => ({ ...f, difficulty: d }))}
                  className="diff-btn diff-btn--sm"
                  style={{
                    background: active ? cfg.color : "transparent",
                    color: active ? "#05060a" : cfg.color,
                    borderColor: cfg.color,
                    boxShadow: active ? `0 0 14px ${cfg.glow}` : "none",
                  }}
                >
                  {d}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: "0.75rem" }}>
            {["Easy", "Medium", "Hard", "Insane-O Crazy"].map(d => (
              <p key={d} style={{ color: "var(--text-faint)", fontFamily: "var(--font-body)", fontSize: "0.85rem", margin: "0.2rem 0" }}>
                <span style={{ color: DIFFICULTY_CONFIG[d].color, fontWeight: 700 }}>{d}</span>{" "}
                {{
                  Easy: "— Simple and immediately clear. No unpacking required.",
                  Medium: "— Pointed in a few different directions at once. Room to pick an angle.",
                  Hard: "— Abstract and dense. Takes real work to unpack.",
                  "Insane-O Crazy": "— Completely unhinged. Barely makes sense, and that's the point.",
                }[d]}
              </p>
            ))}
          </div>
        </div>

        {error && (
          <p style={{ color: "var(--danger)", fontFamily: "var(--font-mono)", fontSize: "0.78rem", marginBottom: "1rem" }}>
            ⚠ {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="btn"
          style={{
            width: "100%",
            padding: "0.95rem",
            background: submitted ? "#0f3d2e" : saving ? "var(--border-soft)" : "var(--accent-grad)",
            color: submitted ? "var(--good)" : saving ? "var(--text-dim)" : "#05060a",
            border: submitted ? "1px solid var(--good)" : "none",
            fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
            boxShadow: submitted ? "0 0 20px #34d39930" : saving ? "none" : "0 8px 30px -8px #8b5cf680",
          }}
        >
          {submitted ? "✓ Added to the Pool!" : saving ? "Saving..." : "Submit Quotation"}
        </button>
      </div>
    </div>
  );
}

function UpdateLog() {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? CHANGELOG : CHANGELOG.slice(0, 3);
  const hidden = CHANGELOG.length - shown.length;

  return (
    <div className="card about-card" style={{ padding: "2.25rem" }}>
      <p className="eyebrow" style={{ marginBottom: "0.5rem" }}>Update Log</p>
      <h3 className="about-h3">What&apos;s <span className="grad-text">changed</span></h3>
      <p className="about-p" style={{ marginBottom: "2rem" }}>
        Every update to the site, newest first. It gets better because people tell
        me what&apos;s annoying — so if something bugs you, say so.
      </p>

      <div className="log">
        {shown.map((entry) => {
          const tag = CHANGELOG_TAGS[entry.tag] || CHANGELOG_TAGS.new;
          return (
            <div key={entry.date + entry.title} className="log-entry">
              <span className="log-dot" style={{ background: tag.color, boxShadow: `0 0 10px ${tag.color}` }} />
              <div className="log-body">
                <div className="log-meta">
                  <time className="log-date">{entry.date}</time>
                  <span className="log-tag" style={{ color: tag.color, borderColor: tag.color }}>
                    {tag.label}
                  </span>
                </div>
                <h4 className="log-title">{entry.title}</h4>
                <ul className="log-list">
                  {entry.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {hidden > 0 && (
        <button onClick={() => setExpanded(true)} className="btn btn-ghost" style={{ marginTop: "1.5rem" }}>
          Show {hidden} Older Update{hidden === 1 ? "" : "s"}
        </button>
      )}
    </div>
  );
}

function AboutTab() {
  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "2rem 1.5rem", animation: "fadeUp 0.6s ease both" }}>

      <div className="card about-card about-hero">
        <div className="about-photo-wrap">
          <img
            src="/edward.jpg"
            alt="Edward Kent in a suit, giving two thumbs up outside a building on the Simpson College campus"
            className="about-photo"
            width="800"
            height="1000"
          />
        </div>
        <div className="about-hero-text">
          <p className="eyebrow" style={{ marginBottom: "0.6rem" }}>Who made this</p>
          <h2 className="about-h2">
            Hi, I&apos;m <span className="grad-text">Edward Kent</span>
          </h2>
          <p className="about-p">
            I&apos;m a college student at <strong>Simpson College</strong> in Indianola, Iowa,
            majoring in <strong>Political Science</strong>. I also do a lot of agentic
            coding — and I wanted to point those skills at something that would
            actually help my team.
          </p>
          <p className="about-p">
            So I built this. One mission: <strong>help the Simpson College speech and
            debate team practice Impromptu.</strong>
          </p>
        </div>
      </div>

      <div className="card about-card" style={{ padding: "2.25rem" }}>
        <p className="eyebrow" style={{ marginBottom: "0.5rem" }}>The story</p>
        <h3 className="about-h3">From <span className="grad-text">crap to competition-ready</span></h3>
        <p className="about-p">
          I didn&apos;t want another timer with a random quote generator bolted on. I
          wanted something genuinely <em>useful</em> — a tool you&apos;d actually reach for
          before a tournament, that would make you better at Impromptu instead of
          just counting down at you.
        </p>
        <p className="about-p">
          The first version looked like crap. I&apos;m happy to admit that. But I kept
          upgrading it, and upgrading it, and upgrading it — and now here we are.
          Real difficulty tiers. Reading time you control. Beeps that teach you to
          pace your intro. Recording so you can send a run to Marisa, Tiana, or any
          coach or UGA for feedback. A quote pool that anyone can add to.
        </p>
        <p className="about-p">
          I bought a domain for it, and now I&apos;m trying to get more speech and debate
          teams using it — not just Simpson. If you&apos;re on another team and this is
          useful to you, that&apos;s the whole point. Take it.
        </p>
      </div>

      <div className="card about-card about-next">
        <p className="eyebrow" style={{ marginBottom: "0.5rem", color: "var(--accent-2)" }}>Coming soon</p>
        <h3 className="about-h3">Automatic <span className="grad-text">Extemp practice</span></h3>
        <p className="about-p" style={{ marginBottom: 0 }}>
          I&apos;m building an Extemp mode that pulls from current events and generates
          practice questions automatically. It&apos;ll be the biggest update to this site
          yet — and it&apos;s in the works right now.
        </p>
      </div>

      <UpdateLog />

      <p style={{
        textAlign: "center", fontFamily: "var(--font-body)", color: "var(--text-faint)",
        fontSize: "0.85rem", lineHeight: 1.6, margin: "2rem 0 0",
      }}>
        Built by a Simpson College student, for speech and debate teams everywhere.
      </p>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("practice");
  const [dogVisible, setDogVisible] = useState(true);
  const [userQuotes, setUserQuotes] = useState([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [dogReacting, setDogReacting] = useState(false);
  const [dogReactKey, setDogReactKey] = useState(0);
  const [dragonReacting, setDragonReacting] = useState(false);
  const [dragonReactKey, setDragonReactKey] = useState(0);
  const [legalTab, setLegalTab] = useState(null);
  const dogReactTimer = useRef(null);
  const dragonReactTimer = useRef(null);

  const petDog = () => {
    clearTimeout(dogReactTimer.current);
    setDogReacting(true);
    setDogReactKey(k => k + 1);
    dogReactTimer.current = setTimeout(() => setDogReacting(false), 1400);
  };

  const petDragon = () => {
    clearTimeout(dragonReactTimer.current);
    setDragonReacting(true);
    setDragonReactKey(k => k + 1);
    dragonReactTimer.current = setTimeout(() => setDragonReacting(false), 2600);
  };

  useEffect(() => () => {
    clearTimeout(dogReactTimer.current);
    clearTimeout(dragonReactTimer.current);
  }, []);

  useEffect(() => {
    const q = query(collection(db, "quotes"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const fetched = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            difficulty: LEGACY_DIFFICULTY[data.difficulty] || data.difficulty,
          };
        });
        setUserQuotes(fetched);
        setDbLoading(false);
        setDbError(false);
      },
      (err) => {
        console.error("Firestore listener failed:", err);
        setDbLoading(false);
        setDbError(true);
      }
    );
    return () => unsub();
  }, []);

  const allQuotes = [...BUILTIN_QUOTES, ...userQuotes];

  const handleSubmit = async (quote) => {
    await addDoc(collection(db, "quotes"), {
      ...quote,
      createdAt: serverTimestamp(),
    });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:ital,wght@0,400;0,500;0,600;1,400&family=Space+Mono:wght@400;700&display=swap');

        :root {
          --bg: #07070d;
          --bg-raised: #121320;
          --bg-input: #0a0b14;
          --border: #262a40;
          --border-soft: #171827;
          --accent: #8b5cf6;
          --accent-2: #22d3ee;
          --accent-grad: linear-gradient(135deg, var(--accent), var(--accent-2));
          --text: #edeffb;
          --text-dim: #8d90ac;
          --text-faint: #4b4e66;
          --good: #34d399;
          --warn: #fb923c;
          --danger: #f87171;
          --radius-sm: 10px;
          --radius-md: 18px;
          --radius-lg: 28px;
          --font-display: 'Space Grotesk', sans-serif;
          --font-body: 'Inter', sans-serif;
          --font-mono: 'Space Mono', monospace;
          --shadow-card: 0 1px 0 rgba(255,255,255,0.04) inset, 0 24px 60px -18px rgba(0,0,0,0.75);
        }

        * { box-sizing: border-box; }
        body {
          background:
            radial-gradient(ellipse 55% 40% at 12% -8%, #8b5cf62c 0%, transparent 60%),
            radial-gradient(ellipse 55% 40% at 92% 6%, #22d3ee22 0%, transparent 60%),
            radial-gradient(ellipse 60% 45% at 50% 110%, #8b5cf61c 0%, transparent 60%),
            var(--bg);
          color: var(--text);
        }
        textarea, input { color-scheme: dark; }

        .grad-text {
          background: var(--accent-grad);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .card {
          background: var(--bg-raised);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-card);
        }
        .card--flat { box-shadow: none; background: #0d0e1a; }
        .list-card { transition: border-color 0.2s ease, transform 0.2s ease; }
        .list-card:hover { border-color: var(--accent); transform: translateY(-1px); }

        .btn {
          font-family: var(--font-mono);
          letter-spacing: 0.09em;
          text-transform: uppercase;
          font-size: 0.8rem;
          font-weight: 700;
          border-radius: var(--radius-sm);
          border: none;
          cursor: pointer;
          transition: box-shadow 0.2s ease, transform 0.2s ease, color 0.2s ease, border-color 0.2s ease;
        }
        .btn-primary {
          background: var(--accent-grad);
          color: #05060a;
          box-shadow: 0 8px 30px -10px #8b5cf675;
        }
        .btn-primary:hover:not(:disabled) { box-shadow: 0 10px 40px -8px #8b5cf6a0; transform: translateY(-1px); }
        .btn-ghost {
          background: transparent;
          color: var(--text-dim);
          border: 1px solid var(--border);
        }
        .btn-ghost:hover { color: var(--text); border-color: var(--accent-2); }

        .input, textarea.input {
          width: 100%;
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 0.85rem 1rem;
          color: var(--text);
          font-family: var(--font-body);
          font-size: 1.02rem;
          outline: none;
          resize: vertical;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .input:focus { border-color: var(--accent-2) !important; }

        .label {
          display: block;
          font-family: var(--font-mono);
          font-size: 0.68rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--text-dim);
          margin-bottom: 0.55rem;
        }

        .eyebrow {
          font-family: var(--font-mono);
          font-size: 0.74rem;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--text-dim);
        }

        .tag-pill {
          padding: 0.25rem 0.65rem;
          border: 1px solid;
          border-radius: var(--radius-sm);
          font-family: var(--font-mono);
          font-size: 0.65rem;
          letter-spacing: 0.05em;
        }

        .chip-toggle {
          background: transparent;
          color: var(--text-dim);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          font-family: var(--font-mono);
          font-size: 0.62rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 0.3rem 0.65rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .chip-toggle--active { background: #22d3ee1f; color: var(--accent-2); border-color: var(--accent-2); }

        .btn-pill {
          padding: 0.55rem 1.15rem;
          background: transparent;
          color: var(--text-dim);
          border: 1.5px solid var(--border);
          border-radius: var(--radius-sm);
          font-family: var(--font-mono);
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-pill--active { background: var(--accent-grad); color: #05060a; border-color: transparent; }

        .diff-btn {
          padding: 0.65rem 1.5rem;
          border: 1.5px solid currentColor;
          border-radius: var(--radius-sm);
          font-family: var(--font-mono);
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .diff-btn:hover { transform: translateY(-1px); }
        .diff-btn--sm { padding: 0.5rem 1.1rem; font-size: 0.72rem; }

        /* ── Universal press feedback ── */
        .btn:active:not(:disabled),
        .diff-btn:active,
        .chip-toggle:active,
        .btn-pill:active,
        .tab-btn:active,
        .jump-top-btn:active {
          transform: scale(0.94) !important;
          transition: transform 0.08s ease !important;
        }

        .start-orb {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 190px; height: 190px;
          border-radius: 50%;
          margin: 0 auto 2.75rem;
          background: radial-gradient(circle, #171a2c 0%, #0a0a12 72%);
          border: 1px solid var(--border);
          box-shadow: 0 0 80px #8b5cf622, inset 0 0 40px #00000080;
        }

        /* ── Launch sequence ──
           Reads as: coil (anticipation) → release → an iris wipe in the site's
           own background colour. Deliberately no white flash and no spin. */
        .start-orb--launch {
          animation: orbCoilRelease 0.36s cubic-bezier(0.34, 1.4, 0.44, 1) both;
        }
        @keyframes orbCoilRelease {
          0%   { transform: scale(1);    border-color: var(--border); box-shadow: 0 0 80px #8b5cf622, inset 0 0 40px #00000080; }
          30%  { transform: scale(0.93); border-color: #8b5cf6aa;     box-shadow: 0 0 40px #8b5cf644, inset 0 0 60px #00000090; }
          70%  { transform: scale(1.06); border-color: #22d3eeee;     box-shadow: 0 0 90px #22d3ee55, inset 0 0 10px #00000040; opacity: 1; }
          100% { transform: scale(1.1);  border-color: #22d3ee00;     box-shadow: 0 0 0 #22d3ee00, inset 0 0 0 transparent; opacity: 0; }
        }

        /* One thin shockwave, plus a softer echo — not a three-ring pileup. */
        .launch-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1.5px solid var(--accent-2);
          opacity: 0;
          pointer-events: none;
          animation: launchRing 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .launch-ring-1 { animation-delay: 0.11s; }
        .launch-ring-2 { animation-delay: 0.19s; border-color: var(--accent); }
        @keyframes launchRing {
          0%   { transform: scale(0.96); opacity: 0.75; }
          70%  { opacity: 0.18; }
          100% { transform: scale(2.1); opacity: 0; }
        }

        /* The play triangle takes off in the direction it points, instead of
           spinning like a stuck loading indicator. */
        .launch-icon {
          animation: launchIconGo 0.36s cubic-bezier(0.5, 0, 0.75, 0) both;
        }
        @keyframes launchIconGo {
          0%   { transform: translateX(0) scale(1); opacity: 1; }
          30%  { transform: translateX(-7px) scale(0.96); opacity: 1; }
          100% { transform: translateX(70px) scale(1.06); opacity: 0; }
        }

        /* Iris wipe: a disc of the page's own background grows out of the orb
           and covers the screen, so the phase swap underneath is invisible.
           Tinted only at its leading edge — no full-screen white blowout. */
        .launch-flash {
          position: fixed;
          inset: 0;
          z-index: 500;
          pointer-events: none;
          /* Anchored to the orb's live position (set in startSession) so the
             scale-up doesn't drag the wipe's origin off the button. */
          transform-origin: var(--iris-x, 50%) var(--iris-y, 44%);
          background: radial-gradient(circle at var(--iris-x, 50%) var(--iris-y, 44%),
            var(--bg) 0%,
            var(--bg) 52%,
            #8b5cf633 62%,
            #22d3ee22 68%,
            transparent 74%);
          animation: launchIris 0.66s linear both;
        }
        /* Held invisible for the first ~165ms so the orb's coil-and-release
           beat plays in the clear, then rushes out and covers by 400ms —
           exactly when the phase swap happens underneath. */
        @keyframes launchIris {
          0%   { transform: scale(0.05); opacity: 0; }
          25%  { transform: scale(0.3);  opacity: 0; }
          40%  { transform: scale(1.15); opacity: 0.9; }
          60%  { transform: scale(3.4);  opacity: 1; }
          100% { transform: scale(3.6);  opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .start-orb--launch,
          .launch-ring,
          .launch-icon { animation: none; }
          .start-orb--launch { opacity: 0; transition: opacity 0.2s linear; }
          .launch-flash { animation: launchFade 0.5s linear both; transform: scale(4); }
          @keyframes launchFade { 0%, 70% { opacity: 1; } 100% { opacity: 0; } }
        }

        /* ── About page ── */
        .about-card { margin-bottom: 1.5rem; }

        .about-hero {
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 2rem;
          align-items: center;
          padding: 2.25rem;
        }
        .about-photo-wrap {
          position: relative;
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 1px solid var(--border);
          /* the violet/cyan rim ties the photo into the rest of the theme */
          box-shadow: 0 0 0 1px #8b5cf633, 0 18px 40px -12px #000000cc;
        }
        .about-photo-wrap::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(160deg, #8b5cf61f 0%, transparent 45%, #22d3ee1f 100%);
          pointer-events: none;
        }
        .about-photo {
          display: block;
          width: 100%;
          height: auto;
          aspect-ratio: 4 / 5;
          object-fit: cover;
        }

        .about-h2 {
          font-family: var(--font-display);
          font-size: 1.9rem;
          font-weight: 700;
          color: var(--text);
          line-height: 1.15;
          margin: 0 0 1rem;
        }
        .about-h3 {
          font-family: var(--font-display);
          font-size: 1.35rem;
          font-weight: 700;
          color: var(--text);
          line-height: 1.2;
          margin: 0 0 1rem;
        }
        .about-p {
          font-family: var(--font-body);
          color: var(--text-dim);
          font-size: 0.97rem;
          line-height: 1.7;
          margin: 0 0 1rem;
        }
        .about-p:last-child { margin-bottom: 0; }
        .about-p strong { color: var(--text); font-weight: 600; }
        .about-p em { color: var(--text); font-style: italic; }

        .about-next {
          padding: 2.25rem;
          border-color: #22d3ee44;
          background:
            radial-gradient(ellipse 80% 120% at 100% 0%, #22d3ee14 0%, transparent 60%),
            var(--bg-raised);
        }

        /* ── Update log timeline ── */
        .log { position: relative; }
        .log-entry {
          position: relative;
          display: grid;
          grid-template-columns: 22px 1fr;
          gap: 0.9rem;
          padding-bottom: 1.75rem;
        }
        /* the connecting rail, drawn behind the dots and stopped on the last row */
        .log-entry::before {
          content: "";
          position: absolute;
          left: 5px;
          top: 16px;
          bottom: 0;
          width: 1px;
          background: var(--border);
        }
        .log-entry:last-child { padding-bottom: 0; }
        .log-entry:last-child::before { display: none; }

        .log-dot {
          width: 11px; height: 11px;
          border-radius: 50%;
          margin-top: 5px;
          position: relative;
          z-index: 1;
        }
        .log-meta {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          flex-wrap: wrap;
          margin-bottom: 0.35rem;
        }
        .log-date {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          color: var(--text-faint);
          letter-spacing: 0.05em;
        }
        .log-tag {
          font-family: var(--font-mono);
          font-size: 0.6rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border: 1px solid;
          border-radius: 999px;
          padding: 0.14rem 0.5rem;
          opacity: 0.85;
        }
        .log-title {
          font-family: var(--font-display);
          font-size: 1rem;
          font-weight: 700;
          color: var(--text);
          margin: 0 0 0.5rem;
        }
        .log-list {
          margin: 0;
          padding-left: 1.1rem;
          font-family: var(--font-body);
          color: var(--text-dim);
          font-size: 0.9rem;
          line-height: 1.65;
        }
        .log-list li { margin-bottom: 0.3rem; }
        .log-list li::marker { color: var(--text-faint); }

        .buffer-content { animation: fadeUp 0.45s ease both; }

        .start-btn { padding: 1.05rem 3.5rem; font-size: 1rem; letter-spacing: 0.14em; }

        .step-dot { width: 7px; height: 7px; border-radius: 50%; transition: all 0.3s ease; }

        .jump-top-btn {
          position: fixed;
          bottom: 1.5rem;
          right: 1.5rem;
          padding: 0.7rem 1.2rem;
          border-radius: 999px;
          z-index: 60;
          animation: fadeUp 0.3s ease both;
        }

        .quote-box { position: relative; }

        .camera-preview {
          position: relative;
          width: 220px;
          aspect-ratio: 4 / 3;
          margin: 0 auto 1.5rem;
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 2px solid;
          background: #0a0a12;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .camera-preview video { width: 100%; height: 100%; object-fit: cover; }

        .camera-notice {
          position: fixed;
          top: 1.25rem;
          left: 1.25rem;
          z-index: 9999;
          width: min(300px, calc(100vw - 2.5rem));
          padding: 1.1rem 1.25rem;
          border-radius: var(--radius-md);
          background: #121320f5;
          border: 1px solid var(--border);
          box-shadow: 0 20px 50px -15px rgba(0,0,0,0.8);
          animation: fadeUp 0.3s ease both;
        }

        /* ── Mobile ── */
        @media (max-width: 600px) {
          .header-title { font-size: 0.85rem !important; max-width: 160px !important; }
          .header-subtitle { display: none !important; }
          .tab-btn { padding: 0.4rem 0.7rem !important; font-size: 0.62rem !important; }
          .hero-h1 { font-size: 1.9rem !important; }
          .hero-sub { font-size: 0.85rem !important; }
          .diff-btn { padding: 0.5rem 0.9rem !important; font-size: 0.68rem !important; }
          .quote-box { padding: 1.5rem 1rem !important; }
          .quote-text { font-size: 1.2rem !important; }
          .flying-char { display: none !important; }
          .submit-card { padding: 1.5rem 1rem !important; }
          .start-orb { width: 150px !important; height: 150px !important; }
          .float-header {
            margin: 0 !important;
            border-radius: 0 !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.85rem !important;
          }
          .header-nav { width: 100% !important; flex-wrap: wrap !important; }
          .about-hero {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
            padding: 1.5rem 1.25rem !important;
            text-align: center;
          }
          /* keep the portrait from eating the whole screen on a phone */
          .about-photo-wrap { max-width: 220px; margin: 0 auto; }
          .about-card { padding: 1.5rem 1.25rem !important; }
          .about-h2 { font-size: 1.55rem !important; }
          .about-h3 { font-size: 1.2rem !important; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tip-card { animation: fadeUp 0.4s ease both; }
        .tip-text { animation: tipFade 0.45s ease both; }
        @keyframes tipFade {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: var(--bg); }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
        @keyframes flyDog {
          0%   { transform: translate(6vw,  14vh); }
          13%  { transform: translate(35vw, 7vh);  }
          26%  { transform: translate(68vw, 11vh); }
          39%  { transform: translate(80vw, 42vh); }
          52%  { transform: translate(74vw, 76vh); }
          65%  { transform: translate(42vw, 83vh); }
          78%  { transform: translate(8vw,  72vh); }
          91%  { transform: translate(4vw,  40vh); }
          100% { transform: translate(6vw,  14vh); }
        }
        @keyframes flyDragon {
          0%   { transform: translate(68vw, 9vh);  }
          13%  { transform: translate(42vw, 4vh);  }
          26%  { transform: translate(10vw, 11vh); }
          39%  { transform: translate(3vw,  44vh); }
          52%  { transform: translate(8vw,  74vh); }
          65%  { transform: translate(40vw, 82vh); }
          78%  { transform: translate(72vw, 70vh); }
          91%  { transform: translate(82vw, 38vh); }
          100% { transform: translate(68vw, 9vh);  }
        }

        .mascot {
          position: relative;
          display: inline-block;
          pointer-events: auto;
          cursor: pointer;
          transform-origin: 50% 50%;
          transition: opacity 0.3s ease;
        }
        .mascot-pop { animation: mascotPop 0.6s cubic-bezier(.34,1.56,.64,1) both; }
        @keyframes mascotPop {
          0%   { transform: scale(1) rotate(0deg); }
          30%  { transform: scale(1.25) rotate(-6deg); }
          55%  { transform: scale(0.92) rotate(4deg); }
          100% { transform: scale(1) rotate(0deg); }
        }

        .mascot-label {
          position: absolute;
          bottom: 100%;
          left: 50%;
          margin-bottom: 0.5rem;
          white-space: nowrap;
          background: var(--bg-raised);
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 0.35rem 0.85rem;
          font-family: var(--font-mono);
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text);
          box-shadow: 0 10px 24px -8px rgba(0,0,0,0.7);
          pointer-events: none;
          animation: labelPop 1.4s ease both;
        }
        @keyframes labelPop {
          0%   { opacity: 0; transform: translateX(-50%) translateY(8px) scale(0.85); }
          15%  { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          80%  { opacity: 1; }
          100% { opacity: 0; transform: translateX(-50%) translateY(-10px) scale(1); }
        }

        .mascot-particle {
          position: absolute;
          top: 20%;
          font-size: 1.15rem;
          pointer-events: none;
          animation: particleFloat 1.2s ease-out both;
        }
        @keyframes particleFloat {
          0%   { transform: translate(0, 0) scale(0.6); opacity: 0; }
          15%  { opacity: 1; }
          100% { transform: translate(var(--dx), -70px) scale(1); opacity: 0; }
        }

        /* ── Dragon click reaction: a little dance + fire breath ── */
        .dragon-dance { animation: dragonDance 1.8s ease-in-out both; }
        @keyframes dragonDance {
          0%   { transform: scale(1)    rotate(0deg)  translateY(0); }
          8%   { transform: scale(1.08) rotate(-7deg) translateY(-5px); }
          16%  { transform: scale(1.04) rotate(7deg)  translateY(-9px); }
          24%  { transform: scale(1.1)  rotate(-6deg) translateY(-3px); }
          32%  { transform: scale(1.04) rotate(6deg)  translateY(-10px); }
          40%  { transform: scale(1.08) rotate(-4deg) translateY(-4px); }
          50%  { transform: scale(1.03) rotate(3deg)  translateY(-7px); }
          62%  { transform: scale(1.05) rotate(-2deg) translateY(-2px); }
          75%  { transform: scale(1.02) rotate(1deg)  translateY(-4px); }
          100% { transform: scale(1)    rotate(0deg)  translateY(0); }
        }

        .dragon-fire {
          position: absolute;
          left: 82%;
          top: 34%;
          display: flex;
          align-items: center;
          pointer-events: none;
        }

        .fire-word { display: flex; gap: 0.08em; }

        .fire-letter {
          position: relative;
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 1.5rem;
          line-height: 1;
          background: linear-gradient(180deg, #fff8d6 0%, #ffd23f 22%, #ff9d1a 50%, #ff4d00 75%, #b31500 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          filter: drop-shadow(0 0 5px #ff7a0090) drop-shadow(0 0 12px #ff3d0060);
          opacity: 0;
          white-space: nowrap;
          animation: fireLetterIn 1.9s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes fireLetterIn {
          0%   { opacity: 0; transform: translateY(10px) scale(0.3) rotate(-12deg); filter: blur(3px) drop-shadow(0 0 0 transparent); }
          14%  { opacity: 1; transform: translateY(-5px) scale(1.2) rotate(5deg); filter: blur(0) drop-shadow(0 0 10px #ff8a0acc); }
          24%  { transform: translateY(0) scale(1) rotate(-2deg); }
          36%  { transform: translateY(-2px) scale(1.04) rotate(2deg); }
          48%  { transform: translateY(0) scale(0.98) rotate(-1deg); }
          60%  { transform: translateY(-3px) scale(1.02) rotate(1deg); }
          78%  { opacity: 1; transform: translateY(-4px) scale(1) rotate(0deg); }
          100% { opacity: 0; transform: translateY(-30px) scale(0.82) rotate(3deg); filter: blur(4px) drop-shadow(0 0 0 transparent); }
        }

        .fire-ember {
          position: absolute;
          font-size: 0.85rem;
          pointer-events: none;
          animation: emberPuff 1s ease-out both;
        }
        @keyframes emberPuff {
          0%   { opacity: 0; transform: translate(0, 0) scale(0.4); }
          20%  { opacity: 1; transform: translate(6px, -8px) scale(1); }
          100% { opacity: 0; transform: translate(26px, -22px) scale(0.6); }
        }
      `}</style>

      <div style={{ minHeight: "100vh", width: "100%", fontFamily: "var(--font-body)" }}>
        {/* Floating glass header — scrolls away with the page, not pinned */}
        <div style={{ position: "relative", zIndex: 100, padding: "1.1rem 1.25rem 0" }}>
          <header className="float-header" style={{
            maxWidth: 1240,
            margin: "0 auto",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)",
            background: "rgba(18,19,32,0.72)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            padding: "1.1rem 1.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 20px 50px -20px rgba(0,0,0,0.8)",
          }}>
            <div>
              <div className="header-title" style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "var(--text)",
                letterSpacing: "-0.01em",
                lineHeight: 1.2,
                maxWidth: 240,
              }}>
                Edward's really cool and awesome <span className="grad-text">Impromptu</span> practice website
              </div>
              <div className="header-subtitle" style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.6rem",
                color: "var(--text-faint)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                marginTop: "0.3rem",
              }}>
                Impromptu Speaking Practice
              </div>
            </div>

            <nav className="header-nav" style={{ display: "flex", gap: "0.4rem" }}>
              {[["practice", "Practice"], ["browse", "All Quotations"], ["submit", "Submit A Quotation"], ["about", "About"]].map(([id, label]) => (
                <button
                  className="tab-btn"
                  key={id}
                  onClick={() => { setActiveTab(id); if (id === "practice") setDogVisible(true); }}
                  style={{
                    padding: "0.5rem 1.1rem",
                    background: activeTab === id ? "var(--accent-grad)" : "transparent",
                    color: activeTab === id ? "#05060a" : "var(--text-dim)",
                    border: `1px solid ${activeTab === id ? "transparent" : "var(--border)"}`,
                    borderRadius: "999px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {label}
                </button>
              ))}
            </nav>
          </header>
        </div>

        {/* Floating stat pill */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: "1.5rem", position: "relative", zIndex: 3 }}>
          <div className="card" style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "1.5rem",
            padding: "0.6rem 1.6rem",
            borderRadius: "999px",
          }}>
            <div style={{ textAlign: "center" }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "1rem", color: "var(--text)", fontWeight: 700 }}>
                {dbLoading ? "..." : allQuotes.length}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", marginLeft: "0.5rem" }}>
                Quotes in Pool
              </span>
            </div>
            {dbError && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--danger)", letterSpacing: "0.04em" }}>
                ⚠ Live pool unavailable
              </span>
            )}
          </div>
        </div>

        {/* Hero area */}
        {activeTab === "practice" && (
          <div style={{ textAlign: "center", padding: "3rem 2rem 1rem", width: "100%", position: "relative", zIndex: 3 }}>
            <h1 className="hero-h1" style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.1rem, 5vw, 3.4rem)",
              fontWeight: 700,
              color: "var(--text)",
              lineHeight: 1.12,
              letterSpacing: "-0.01em",
              marginBottom: "0.75rem",
            }}>
              Good luck bro.<br />
              <span className="grad-text">You got this gang.</span>
            </h1>
            <p className="hero-sub" style={{
              color: "var(--text-dim)",
              fontSize: "1rem",
              maxWidth: 460,
              margin: "0 auto",
            }}>
              10-second read · 7 minutes to speak your truth
            </p>
          </div>
        )}

        {activeTab === "submit" && (
          <div style={{ textAlign: "center", padding: "3rem 2rem 1rem", width: "100%", position: "relative", zIndex: 3 }}>
            <h1 className="hero-h1" style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.1rem, 5vw, 3.4rem)",
              fontWeight: 700,
              color: "var(--text)",
              lineHeight: 1.12,
              letterSpacing: "-0.01em",
              marginBottom: "0.75rem",
            }}>
              Submit whatever quotation,<br />
              <span className="grad-text">just make sure someone said it at some point lol</span>
            </h1>
            <p style={{ color: "var(--text-dim)", fontSize: "1rem" }}>
              Your submissions are saved instantly for everyone.
            </p>
          </div>
        )}

        {activeTab === "browse" && (
          <div style={{ textAlign: "center", padding: "3rem 2rem 1rem", width: "100%", position: "relative", zIndex: 3 }}>
            <h1 className="hero-h1" style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.1rem, 5vw, 3.4rem)",
              fontWeight: 700,
              color: "var(--text)",
              lineHeight: 1.12,
              letterSpacing: "-0.01em",
              marginBottom: "0.75rem",
            }}>
              Every quote in the <span className="grad-text">pool.</span>
            </h1>
            <p style={{ color: "var(--text-dim)", fontSize: "1rem" }}>
              Updates live the moment someone submits a new one.
            </p>
          </div>
        )}

        {/* Floating Characters */}
        {activeTab === "practice" && dogVisible && (
          <div className="flying-char" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 4, overflow: "visible" }}>
            <div style={{ position: "absolute", top: 0, left: 0, animation: "flyDog 22s linear infinite", willChange: "transform" }}>
              <div
                key={dogReactKey}
                onClick={petDog}
                className={dogReacting ? "mascot mascot-pop" : "mascot"}
                style={{ opacity: dogReacting ? 1 : 0.55 }}
                role="button"
                aria-label="Pet Atlas"
              >
                <CyborgDog />
                {dogReacting && <MascotReaction label="Atlas says hi! 🐾" emojis={["🦴", "✨", "🐾"]} />}
              </div>
            </div>
          </div>
        )}
        {activeTab === "submit" && (
          <div className="flying-char" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 4, overflow: "visible" }}>
            <div style={{ position: "absolute", top: 0, left: 0, animation: "flyDragon 26s linear infinite", willChange: "transform" }}>
              <div
                key={dragonReactKey}
                onClick={petDragon}
                className={dragonReacting ? "mascot dragon-dance" : "mascot"}
                style={{ opacity: dragonReacting ? 1 : 0.55 }}
                role="button"
                aria-label="Cheer on the dragon"
              >
                <ImprovDragon />
                {dragonReacting && <DragonFireBreath />}
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <main style={{ padding: "2rem 1rem 4rem", width: "100%", position: "relative", zIndex: 3 }}>
          {activeTab === "practice" && <PracticeTab allQuotes={allQuotes} onPhaseChange={p => setDogVisible(p === "IDLE")} />}
          {activeTab === "browse" && <BrowseTab allQuotes={allQuotes} />}
          {activeTab === "submit" && <SubmitTab onSubmit={handleSubmit} />}
          {activeTab === "about" && <AboutTab />}
        </main>

        {/* Footer */}
        <footer style={{
          borderTop: "1px solid var(--border-soft)",
          padding: "1.5rem 2rem",
          textAlign: "center",
          fontFamily: "var(--font-mono)",
          fontSize: "0.65rem",
          color: "var(--text-faint)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          position: "relative",
          zIndex: 3,
        }}>
          <div>Built for collegiate impromptu speakers · {allQuotes.length} quotes in the pool</div>
          <div style={{ marginTop: "0.75rem", display: "flex", gap: "1rem", justifyContent: "center" }}>
            {Object.entries(LEGAL_CONTENT).map(([key, section]) => (
              <button
                key={key}
                onClick={() => setLegalTab(key)}
                style={{
                  background: "none", border: "none", padding: 0,
                  fontFamily: "var(--font-mono)", fontSize: "0.65rem",
                  color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase",
                  cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "3px",
                }}
              >
                {section.label}
              </button>
            ))}
          </div>
        </footer>

        {legalTab && createPortal(
          <div
            style={{
              position: "fixed", inset: 0, zIndex: 400,
              background: "rgba(5,6,10,0.75)", backdropFilter: "blur(4px)",
              display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem",
            }}
            onClick={() => setLegalTab(null)}
          >
            <div
              className="card"
              style={{ maxWidth: 520, width: "100%", padding: "2rem", animation: "fadeUp 0.3s ease both", maxHeight: "80vh", overflowY: "auto" }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
                {Object.entries(LEGAL_CONTENT).map(([key, section]) => (
                  <button
                    key={key}
                    onClick={() => setLegalTab(key)}
                    className={`chip-toggle ${legalTab === key ? "chip-toggle--active" : ""}`}
                  >
                    {section.label}
                  </button>
                ))}
              </div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "var(--text)", fontWeight: 700, marginBottom: "1rem" }}>
                {LEGAL_CONTENT[legalTab].title}
              </h3>
              {LEGAL_CONTENT[legalTab].body.map((p, i) => (
                <p key={i} style={{ fontFamily: "var(--font-body)", fontSize: "0.92rem", lineHeight: 1.65, color: "var(--text-dim)", marginBottom: "0.9rem" }}>
                  {p}
                </p>
              ))}
              <button onClick={() => setLegalTab(null)} className="btn btn-ghost" style={{ padding: "0.65rem 1.5rem", marginTop: "0.5rem" }}>
                Close
              </button>
            </div>
          </div>,
          document.body
        )}
      </div>
    </>
  );
}
