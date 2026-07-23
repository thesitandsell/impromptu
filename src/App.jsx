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
  // Easy: simple, immediately clear, no unpacking required
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
  // Medium: pointed in a few different directions at once
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
  // Hard: abstract and dense, takes real work to unpack
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
  // Insane-O Crazy: completely unhinged, barely makes sense, that's the point
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
// rewritten, so remap them on read instead, or they belong to no tier at all
// and show up in "All" while being unreachable from every difficulty filter.
const LEGACY_DIFFICULTY = {
  "Insaneo CRAZY": "Insane-O Crazy",
  "Insane-o Crazy": "Insane-O Crazy",
  "Insane-O crazy": "Insane-O Crazy",
};

// ── Update log ──────────────────────────────────────────────────
// Newest first. Written for students using the site, not for developers:
// say what changed for *them*, not which component was refactored.
// `tag` drives the dot colour: "new" | "fix" | "big".
const CHANGELOG = [
  {
    date: "2026-07-23",
    title: "About page & update log",
    tag: "new",
    items: [
      "Added this About page, so you know who's behind the site.",
      "Added the update log you're reading right now.",
      "Fixed community submissions for the Insane-O Crazy tier. They were being silently rejected.",
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
      "Nothing is ever uploaded. The recording stays in your browser and disappears when you leave.",
      "Added a Finish Now button for when you wrap early.",
      "Rewrote the whole Insane-O Crazy tier.",
    ],
  },
  {
    date: "2026-07-16",
    title: "The big redesign",
    tag: "big",
    items: [
      "Completely new look: violet and cyan on deep navy.",
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
  "Remember to say quotation, not quote. Quote is a verb!",
  "Open with a hook, not a summary. Grab them in the first ten seconds.",
  "Signpost your roadmap in minute one so the judge knows exactly where you're headed.",
  "Pick your structure fast (chronological, categorical, or compare-contrast), then commit.",
  "Budget your 7 minutes evenly so your conclusion doesn't get rushed at the end.",
  "Every point needs a \"so what\". Tell them why it actually matters.",
  "Try the PREP method: Point, Reason, Example, Point.",
  "Concrete examples beat abstract claims every time. Get specific.",
  "Bridge your points with real transitions, like \"which brings me to...\"",
  "Your notecard is a backup, not a script. Talk to the judge, don't read to them.",
  "Eye contact equals confidence. Look up, not down at your card.",
  "Swap \"um\" for a confident pause. Silence beats a filler word.",
  "Nail your thesis in one clear sentence before you dive into your points.",
  "Take a breath. You've got this. The timer starts soon.",
  "Make sure you're ready to go. You'll start speaking any second.",
];

const LEGAL_CONTENT = {
  terms: {
    label: "Terms",
    title: "Terms of Service",
    body: [
      "This site is a free practice tool built for the Simpson College Speech & Debate team. Use it to practice. That's it.",
      "It's provided as-is, with no guarantees of uptime, accuracy, or availability. Things may change, break, or disappear without notice.",
      "Don't submit offensive, harassing, or inappropriate content through the quotation submission form. Submissions are visible to everyone using the site and may be removed at any time.",
    ],
  },
  privacy: {
    label: "Privacy",
    title: "Privacy",
    body: [
      "There are no accounts, logins, or tracking on this site. We don't collect analytics or personal data.",
      "The only data we store is what you type into the \"Submit a Quotation\" form (the quote text and author). That's saved to a shared database visible to everyone using the site.",
      "Practice recordings (video/audio) never leave your browser. Nothing is uploaded or stored anywhere. The recording exists only in your browser tab and is gone for good the moment you refresh or close the page.",
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

      {/* CYBORG EYE: glowing accent core, tied to site palette */}
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

      {/* EYE: glowing accent core, matches CyborgDog's motif */}
      <ellipse cx="212" cy="79" rx="8" ry="7" fill="#03211d" />
      <ellipse cx="212" cy="79" rx="5.5" ry="5" fill="url(#dragonEyeGlow)" />
      <circle cx="213.5" cy="77.5" r="1.4" fill="white" opacity="0.85" />
      <ellipse cx="212" cy="79" rx="11" ry="10" fill="#a78bfa14">
        <animate attributeName="rx" values="9;13;9" dur="2.2s" repeatCount="indefinite" />
        <animate attributeName="ry" values="8;12;8" dur="2.2s" repeatCount="indefinite" />
      </ellipse>

      {/* MOUTH: grin */}
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

  // Attach the live stream to the preview <video> once it's mounted, only
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
    } catch (e) { /* Web Audio unsupported, beeps just won't play */ }
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
      // No reading time, go straight into speaking
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
        // Degenerate viewport, so drop the vars and let the CSS fallback centre apply.
        root.removeProperty("--iris-x");
        root.removeProperty("--iris-y");
      }
    }

    setLaunching(true);
    setShowFlash(true);
    clearTimeout(launchTimerRef.current);
    clearTimeout(flashTimerRef.current);
    // The phase swap happens while the flash is still covering the screen,
    // which is what makes it read as one continuous wipe instead of a hard cut.
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
            Nothing is uploaded. The recording lives only in this tab and is deleted the moment you refresh or leave.
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
              🔔 You'll hear a beep every 30 seconds for the first 90 seconds of your speech, then it stops.
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
                – {currentQuote.author}
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
              Camera/mic access wasn't granted, so this session won't be recorded.
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
                    Download it now. This recording disappears the moment you refresh or leave this page.
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
                – {q.author}
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
                <span style={{ color: DIFFICULTY_CONFIG[d].color, fontWeight: 700 }}>{d}:</span>{" "}
                {{
                  Easy: "Simple and immediately clear. No unpacking required.",
                  Medium: "Pointed in a few different directions at once. Room to pick an angle.",
                  Hard: "Abstract and dense. Takes real work to unpack.",
                  "Insane-O Crazy": "Completely unhinged. Barely makes sense, and that's the point.",
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

// ── Secret platformer ───────────────────────────────────────────
// Not linked from anywhere in the UI. The only way in is to type the
// dragon's cry on the keyboard, anywhere outside a text field. That cry
// comes from a real quote in the community pool ("I am the dragon who
// always wins Duo Improv! Rwar!"), so it is findable by someone who
// actually reads the quotes and pokes at things, and invisible
// otherwise. Deliberately kept out of the update log.
const SECRET_CODE = "rwar";

// Primary way in: pet Atlas this many times before the combo lapses. The
// labels below escalate so you get told, in plain words, that persisting is
// the point. Five is short enough to stumble into and long enough that a
// single idle click never does it.
const DOG_COMBO_UNLOCK = 5;
const DOG_COMBO_WINDOW = 4000;
const DOG_HINTS = [
  "Atlas says hi! 🐾",
  "Atlas says hi! 🐾",
  "Atlas wags harder... 🐾",
  "Atlas is definitely up to something... ✨",
  "Atlas wants to show you something! One more! 🎮",
];

const GAME_W = 800;
const GAME_H = 450;
const DEATH_Y = 640;

// Tuned so a full jump clears ~96px of height and ~160px of distance at
// run speed. Every gap in LEVELS is sized against those two numbers.
const GRAVITY = 2000;
const MOVE_SPEED = 260;
const JUMP_VEL = -620;
const MAX_FALL = 900;
const COYOTE = 0.1;        // still jumpable just after walking off an edge
const JUMP_BUFFER = 0.12;  // jump pressed just before landing still counts
// Only has to cover reaction-plus-jump, not the whole flight: once you are
// airborne the platform vanishing behind you is harmless.
const CRUMBLE_TIME = 0.55;

// Redesigned maps. Each has a signature idea and more vertical variety than
// the old flat-hop layouts, while every static gap stays inside the base jump.
const LEVELS = [
  {
    // Rolling dawn hills: learn to jump, hit a bounce pad, grab the magnet.
    name: "Warm-Up Round",
    width: 3000,
    spawn: { x: 60, y: 300 },
    platforms: [
      { x: 0, y: 390, w: 420, h: 90 },
      { x: 520, y: 350, w: 150, h: 22 },
      { x: 760, y: 320, w: 150, h: 22 },
      { x: 1000, y: 360, w: 220, h: 22 },
      { x: 1320, y: 390, w: 300, h: 90 },
      { x: 1720, y: 340, w: 150, h: 22 },
      { x: 1960, y: 290, w: 150, h: 22 },
      { x: 2200, y: 240, w: 150, h: 22 },
      { x: 2440, y: 300, w: 150, h: 22 },
      { x: 2660, y: 390, w: 340, h: 90 },
    ],
    hazards: [{ x: 1450, y: 366, w: 70, h: 24 }],
    gems: [[210, 340], [560, 305], [800, 275], [1080, 315], [1460, 340], [1770, 295], [2010, 245], [2250, 195], [2490, 255], [2820, 340]],
    pads: [[1150, 360]],
    powers: [[1080, 300, 'magnet']],
    goal: { x: 2900, y: 310, w: 44, h: 80 },
  },
  {
    // Noon conveyor: two moving platforms and a patrolling spike, plus the
    // first taste of a bounce over a wide pit. Overdrive rewards the sprint.
    name: "Quarterfinals",
    width: 3100,
    spawn: { x: 60, y: 300 },
    platforms: [
      { x: 0, y: 390, w: 340, h: 90 },
      { x: 440, y: 340, w: 130, h: 22 },
      { x: 660, y: 290, w: 120, h: 22 },
      { x: 880, y: 340, w: 120, h: 22, mv: { axis: "x", dist: 150, speed: 60 } },
      { x: 1180, y: 300, w: 120, h: 22 },
      { x: 1400, y: 390, w: 280, h: 90 },
      { x: 1780, y: 340, w: 110, h: 22, mv: { axis: "y", dist: 120, speed: 55 } },
      { x: 2020, y: 300, w: 120, h: 22 },
      { x: 2240, y: 250, w: 120, h: 22 },
      { x: 2460, y: 320, w: 120, h: 22 },
      { x: 2680, y: 390, w: 420, h: 90 },
    ],
    hazards: [
      { x: 1500, y: 366, w: 70, h: 24 },
      { x: 2800, y: 366, w: 60, h: 24, mv: { axis: "x", dist: 160, speed: 65 } },
    ],
    gems: [[180, 340], [500, 295], [720, 245], [1240, 255], [1540, 340], [1835, 290], [2080, 255], [2300, 205], [2520, 275], [2900, 340]],
    pads: [[1560, 390]],
    powers: [[1240, 240, 'overdrive']],
    goal: { x: 2960, y: 310, w: 44, h: 80 },
  },
  {
    // Storm ascent: a crumbling bridge you cannot linger on, then a climb up
    // a moving lift into thin air. Jet Stream turns the climb trivial.
    name: "Semifinals",
    width: 3200,
    spawn: { x: 60, y: 300 },
    platforms: [
      { x: 0, y: 390, w: 300, h: 90 },
      { x: 400, y: 350, w: 90, h: 20, crumble: true },
      { x: 560, y: 320, w: 90, h: 20, crumble: true },
      { x: 720, y: 290, w: 90, h: 20, crumble: true },
      { x: 900, y: 330, w: 120, h: 22 },
      { x: 1120, y: 280, w: 90, h: 20, crumble: true },
      { x: 1300, y: 330, w: 130, h: 22 },
      { x: 1520, y: 390, w: 240, h: 90 },
      { x: 1860, y: 340, w: 110, h: 22, mv: { axis: "y", dist: 130, speed: 60 } },
      { x: 2080, y: 290, w: 110, h: 22 },
      { x: 2300, y: 240, w: 90, h: 20, crumble: true },
      { x: 2480, y: 200, w: 90, h: 20 },
      { x: 2680, y: 280, w: 110, h: 22 },
      { x: 2880, y: 390, w: 320, h: 90 },
    ],
    hazards: [
      { x: 1600, y: 366, w: 70, h: 24 },
      { x: 2980, y: 366, w: 60, h: 24, mv: { axis: "x", dist: 170, speed: 70 } },
    ],
    gems: [[160, 340], [445, 305], [605, 275], [765, 245], [960, 285], [1165, 235], [1365, 285], [1620, 340], [1915, 290], [2135, 245], [2345, 195], [2525, 155], [2735, 235], [3040, 340]],
    pads: [[1640, 390]],
    powers: [[1360, 235, 'jet']],
    goal: { x: 3080, y: 310, w: 44, h: 80 },
  },
  {
    // Dusk descent and rebound: drop down a stepped shaft, cross a moving gap,
    // then a pad flings you up to the exit. Iron Hide covers the spikes.
    name: "Finals",
    width: 3300,
    spawn: { x: 60, y: 240 },
    platforms: [
      { x: 0, y: 300, w: 260, h: 180 },
      { x: 360, y: 250, w: 100, h: 20 },
      { x: 540, y: 300, w: 100, h: 20 },
      { x: 720, y: 350, w: 100, h: 20 },
      { x: 900, y: 390, w: 200, h: 90 },
      { x: 1200, y: 340, w: 100, h: 20, mv: { axis: "x", dist: 180, speed: 70 } },
      { x: 1520, y: 300, w: 110, h: 22 },
      { x: 1740, y: 250, w: 90, h: 20, crumble: true },
      { x: 1920, y: 300, w: 110, h: 22 },
      { x: 2140, y: 350, w: 120, h: 22 },
      { x: 2360, y: 390, w: 220, h: 90 },
      { x: 2720, y: 330, w: 100, h: 20, mv: { axis: "y", dist: 120, speed: 65, phase: 1.4 } },
      { x: 2940, y: 300, w: 120, h: 22 },
      { x: 3120, y: 390, w: 180, h: 90 },
    ],
    hazards: [
      { x: 980, y: 366, w: 60, h: 24 },
      { x: 2420, y: 366, w: 70, h: 24 },
      { x: 3160, y: 366, w: 50, h: 24, mv: { axis: "x", dist: 90, speed: 75 } },
    ],
    gems: [[130, 250], [410, 205], [590, 255], [770, 305], [1000, 340], [1250, 295], [1570, 255], [1785, 205], [1975, 255], [2195, 305], [2460, 340], [2770, 285], [2990, 255], [3210, 340]],
    pads: [[2480, 390]],
    powers: [[1000, 300, 'ironhide']],
    goal: { x: 3210, y: 310, w: 44, h: 80 },
  },
  {
    // Night gauntlet: a long run of alternating movers and crumbles with two
    // patrolling hazards, climbing to a high finish. Titan Core = huge jumps.
    name: "Nationals",
    width: 3500,
    spawn: { x: 60, y: 300 },
    platforms: [
      { x: 0, y: 390, w: 280, h: 90 },
      { x: 380, y: 340, w: 100, h: 20 },
      { x: 560, y: 300, w: 90, h: 20, crumble: true },
      { x: 720, y: 270, w: 90, h: 20, crumble: true },
      { x: 900, y: 320, w: 100, h: 20, mv: { axis: "x", dist: 150, speed: 70 } },
      { x: 1200, y: 280, w: 90, h: 20 },
      { x: 1380, y: 240, w: 90, h: 20, crumble: true },
      { x: 1560, y: 300, w: 110, h: 22 },
      { x: 1780, y: 390, w: 220, h: 90 },
      { x: 2120, y: 330, w: 100, h: 20, mv: { axis: "y", dist: 130, speed: 72 } },
      { x: 2340, y: 280, w: 90, h: 20 },
      { x: 2520, y: 230, w: 90, h: 20, crumble: true },
      { x: 2700, y: 200, w: 90, h: 20 },
      { x: 2900, y: 260, w: 100, h: 20, mv: { axis: "x", dist: 140, speed: 75 } },
      { x: 3200, y: 390, w: 300, h: 90 },
    ],
    hazards: [
      { x: 1860, y: 366, w: 70, h: 24 },
      { x: 2300, y: 256, w: 40, h: 20, mv: { axis: "y", dist: 90, speed: 60 } },
      { x: 3280, y: 366, w: 60, h: 24, mv: { axis: "x", dist: 180, speed: 70 } },
    ],
    gems: [[140, 340], [425, 295], [605, 255], [765, 225], [950, 275], [1245, 235], [1425, 195], [1615, 255], [1890, 340], [2170, 285], [2385, 235], [2565, 185], [2745, 155], [2950, 215], [3350, 340]],
    pads: [[1900, 390]],
    powers: [[1615, 250, 'titan']],
    goal: { x: 3400, y: 310, w: 44, h: 80 },
  },
  {
    // Insane-O Crazy: the longest run, every mechanic at once, two power
    // capsules, three hazards, ending on a hard high tower.
    name: "Insane-O Crazy",
    width: 3800,
    spawn: { x: 60, y: 300 },
    platforms: [
      { x: 0, y: 390, w: 260, h: 90 },
      { x: 360, y: 340, w: 90, h: 20, crumble: true },
      { x: 520, y: 300, w: 90, h: 20, crumble: true },
      { x: 700, y: 340, w: 100, h: 20, mv: { axis: "x", dist: 160, speed: 80 } },
      { x: 1000, y: 300, w: 90, h: 20, crumble: true },
      { x: 1180, y: 260, w: 90, h: 20, crumble: true },
      { x: 1360, y: 310, w: 110, h: 22 },
      { x: 1580, y: 260, w: 90, h: 20, mv: { axis: "y", dist: 140, speed: 82 } },
      { x: 1800, y: 210, w: 90, h: 20 },
      { x: 2000, y: 390, w: 220, h: 90 },
      { x: 2340, y: 330, w: 90, h: 20, crumble: true },
      { x: 2520, y: 290, w: 100, h: 20, mv: { axis: "x", dist: 170, speed: 85 } },
      { x: 2820, y: 250, w: 90, h: 20 },
      { x: 3000, y: 300, w: 90, h: 20, crumble: true },
      { x: 3180, y: 250, w: 90, h: 20 },
      { x: 3360, y: 200, w: 90, h: 20, crumble: true },
      { x: 3540, y: 390, w: 260, h: 90 },
    ],
    hazards: [
      { x: 2080, y: 366, w: 80, h: 24 },
      { x: 1470, y: 286, w: 40, h: 20, mv: { axis: "y", dist: 100, speed: 70 } },
      { x: 3620, y: 366, w: 70, h: 24, mv: { axis: "x", dist: 200, speed: 80 } },
    ],
    gems: [[130, 340], [405, 295], [565, 255], [750, 295], [1045, 255], [1225, 215], [1415, 265], [1625, 215], [1845, 165], [2110, 340], [2385, 285], [2570, 245], [2865, 205], [3045, 255], [3225, 205], [3405, 155], [3670, 340]],
    pads: [[2140, 390]],
    powers: [[1415, 255, 'overdrive'], [2865, 195, 'jet']],
    goal: { x: 3700, y: 310, w: 44, h: 80 },
  },
];

const overlaps = (a, b) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

// Atlas's own palette. Deliberately nothing like the site's cool violet and
// cyan: this is her workshop, so it is rust, amber and hot steel over warm
// black, with acid-green readouts and a CRT sitting on top of all of it.
const GC = {
  bg0: "#0d0b09", bg1: "#1b1511", bg2: "#241c16",
  rust: "#9a3412", rustLit: "#c2410c",
  amber: "#f59e0b", hot: "#fb923c", ember: "#ff5500",
  steel: "#9fb3c8", steelMid: "#5A7DA0", steelDark: "#3A5570",
  acid: "#a3e635", term: "#65a30d",
  danger: "#ef4444",
  tan: "#F0B27A", tanMid: "#C9844B", tanDark: "#8A5A2C",
  eye: "#22d3ee",
};
// Every round gets its own sky. The run reads as one journey across a
// burning scrapyard sea: dawn, noon, storm, dusk, night, and the final
// blazing showdown.
// Graded like a film still, not a highlighter. Each round still owns a
// distinct hue, but the mids and lows (which fill most of the screen) are
// pulled well down in chroma so the scene reads rich and colourful rather
// than neon. Only the accent and rim stay bright, and bloom rides on those.
const SKIES = [
  { name: "dawn",   top: "#241a3a", mid: "#6b4a72", low: "#c9765f", sun: "#e8be86", sea: "#2c2140", accent: "#e0a969", rim: "#cf7d64" },
  { name: "noon",   top: "#274a5a", mid: "#5793a1", low: "#c9b681", sun: "#eee3c4", sea: "#22414c", accent: "#6fb0bd", rim: "#d4c48c" },
  { name: "storm",  top: "#1c1b36", mid: "#3c3a63", low: "#6660a0", sun: "#a9a2cc", sea: "#141327", accent: "#8f88c4", rim: "#b3acd6" },
  { name: "dusk",   top: "#2e1b3d", mid: "#8a4166", low: "#c47a54", sun: "#e2bd93", sea: "#241531", accent: "#c56a8f", rim: "#cf8a5f" },
  { name: "night",  top: "#121a33", mid: "#294059", low: "#4d7893", sun: "#a9cbdd", sea: "#0c1122", accent: "#6ba0be", rim: "#a7c4d4" },
  { name: "final",  top: "#2a1414", mid: "#8a3230", low: "#c47e42", sun: "#e6cf94", sea: "#1c0f0f", accent: "#cf5a4e", rim: "#dbb24d" },
];

// Temporary Kirby-style powers. Each one changes how she plays *and* how she
// looks, and arrives with its own banner and colour so the pickup lands.
const POWERS = {
  overdrive: { name: "OVERDRIVE",  cry: "GO GO GO!",        col: "#ff3d6e", col2: "#ffd166", dur: 8,  blurb: "Speed doubled" },
  jet:       { name: "JET STREAM", cry: "TO THE SKY!",      col: "#38bdf8", col2: "#e0f2fe", dur: 9,  blurb: "Endless air jumps" },
  ironhide:  { name: "IRON HIDE",  cry: "UNBREAKABLE!",     col: "#fbbf24", col2: "#fff7cc", dur: 7,  blurb: "Nothing can hurt her" },
  magnet:    { name: "MAGNETIZE",  cry: "COME HERE!",       col: "#a78bfa", col2: "#f0abfc", dur: 10, blurb: "Parts fly to her" },
  titan:     { name: "TITAN CORE", cry: "FULL POWER!",      col: "#22d3ee", col2: "#bbf7d0", dur: 8,  blurb: "Colossal jump" },
};

// Each cleared round bolts one more system onto Atlas, and every one of them
// is a piece the mascot on the site already has. Finish all six and the dog
// you are running around as *is* the dog flying across the Practice tab.
const UPGRADES = [
  { key: "servo",    name: "Servo Legs",       blurb: "Reinforced hydraulics. She lands and the ground pushes back." },
  { key: "thruster", name: "Thruster Pack",    blurb: "Her boosters. Double jump unlocked." },
  { key: "gyro",     name: "Gyro Core",        blurb: "Stabilised spin. Sharper control in the air." },
  { key: "plating",  name: "Ablative Plating", blurb: "Her armour plate. Survive one hit per life." },
  { key: "optics",   name: "Optic Lasers",     blurb: "Her laser ports. Mostly for the look." },
  { key: "core",     name: "Fusion Core",      blurb: "Fully modified. She is complete." },
];

// Physics scales with how much of herself Atlas has rebuilt. Levels are all
// verified against the *base* numbers, so every upgrade is pure headroom and
// can never make a round unsolvable.
const tuning = (u) => ({
  jump: u >= 1 ? -675 : JUMP_VEL,
  speed: u >= 5 ? MOVE_SPEED * 1.1 : MOVE_SPEED,
  coyote: u >= 3 ? COYOTE * 1.8 : COYOTE,
  airJumps: u >= 2 ? 1 : 0,
  shield: u >= 4,
});

// Story beats. Index 0 plays before the first round; index n+1 plays when
// round n is cleared. The dragon is the one from the Submit tab, and his
// line is the quote that unlocks all of this in the first place.
// ── Cast ──────────────────────────────────────────────────────────
// Good: Atlas, Marisa (her owner), Tiana (Marisa's friend), Edward (who
// modifies her), Peter (her best friend, killed by the Administration,
// back as a ghost). Bad: the Administration, led by Assiram, Marisa's
// evil twin, whose name is Marisa backwards with two extra s's, a fact
// nobody will let her enjoy, with the goons Henry (the dragon, once
// Edward's friend) and Alex (along for the rugs), wielding the very
// government-mandated Turkish Rugs.
const CAST = {
  ATLAS:   { col: "#6cc0d6", tag: "ATLAS" },
  MARISA:  { col: "#e8956a", tag: "MARISA" },
  TIANA:   { col: "#6fc4a2", tag: "TIANA" },
  EDWARD:  { col: "#e0b356", tag: "EDWARD" },
  PETER:   { col: "#b6d4e6", tag: "PETER (GHOST)" },
  HENRY:   { col: "#e05a4e", tag: "HENRY" },
  ALEX:    { col: "#a99cc4", tag: "ALEX" },
  ASSIRAM: { col: "#c85088", tag: "ASSIRAM" },
};
const SPEAKERS = CAST;

// Seven beats: index 0 plays before round one, and index n plays when
// round n is cleared, right before that round's part is installed.
const STORY = [
  [
    { who: "", text: "A scrapyard at the edge of the Speech & Debate world. Everything here was thrown out by the Administration." },
    { who: "", text: "In the middle of it: a pile of parts that used to be a dog." },
    { who: "ATLAS", text: "...booting. Where am I. Where is the rest of me." },
    { who: "EDWARD", text: "Easy, girl. You're in one piece. Well... about forty pieces. I can fix that." },
    { who: "MARISA", text: "Edward, are you SURE about this? She's my dog. I don't want you turning her into a weapon." },
    { who: "EDWARD", text: "Marisa, the Administration scrapped her for a reason. They were scared of what she could be." },
    { who: "PETER", text: "...Listen to him, Marisa." },
    { who: "MARISA", text: "Peter?! You... you died..." },
    { who: "PETER", text: "The Administration killed me. I came back because they aren't finished. And neither is she." },
    { who: "ATLAS", text: "Then get me up. One part at a time." },
  ],
  [
    { who: "ATLAS", text: "Legs. Real servos. I can feel the ground push back when I land." },
    { who: "MARISA", text: "She's walking. Tiana, she's actually walking." },
    { who: "TIANA", text: "See? I told you Edward knows what he's doing. Mostly." },
    { who: "EDWARD", text: "\"Mostly.\" Thanks, Tiana." },
    { who: "MARISA", text: "I still don't love this. But... okay. Keep going. Bring her back." },
  ],
  [
    { who: "ATLAS", text: "Thrusters. I remember the sky now." },
    { who: "PETER", text: "Good. You'll need the sky. They're already coming." },
    { who: "TIANA", text: "Who's coming, Peter?" },
    { who: "PETER", text: "The Administration. They want everything this team built. And they want PKD silenced for good." },
    { who: "EDWARD", text: "Not while I've still got a soldering iron." },
  ],
  [
    { who: "", text: "A dark dragon drops out of the smoke and folds its wings." },
    { who: "HENRY", text: "Rwar. Long time, Edward." },
    { who: "EDWARD", text: "...Henry. No. You were one of US." },
    { who: "HENRY", text: "I was. Then the Administration offered me a better shelf to sit on. Your dog's parts looked good up there." },
    { who: "ATLAS", text: "Give. Them. Back." },
    { who: "HENRY", text: "Come and take them, puppy." },
  ],
  [
    { who: "ATLAS", text: "Plating. And the claw marks on it line up with his." },
    { who: "ALEX", text: "Yeah, that was Henry. He does that." },
    { who: "ATLAS", text: "...And you are?" },
    { who: "ALEX", text: "Alex. I work for the Administration. Kind of. I mostly just stand near the rugs." },
    { who: "TIANA", text: "The... rugs?" },
    { who: "ALEX", text: "Government Mandated Turkish Rugs. Big weapon. Extremely ornate. You'll see." },
  ],
  [
    { who: "", text: "A figure walks out of the smoke wearing Marisa's exact face." },
    { who: "MARISA", text: "...No." },
    { who: "ASSIRAM", text: "Hello, sister." },
    { who: "MARISA", text: "You're supposed to be a myth. My evil twin. \"Assiram.\"" },
    { who: "ASSIRAM", text: "It's Marisa. Backwards. With two extra s's. Deeply intimidating." },
    { who: "TIANA", text: "It's... it's just your name spelled wrong." },
    { who: "ASSIRAM", text: "With TWO S's, Tiana. Two." },
    { who: "ASSIRAM", text: "I lead the Administration now. And I brought the rugs." },
  ],
  [
    { who: "ATLAS", text: "Core online. Every bolt. All of me, back." },
    { who: "ASSIRAM", text: "You cannot beat a Government Mandated Turkish Rug. It is government MANDATED." },
    { who: "ATLAS", text: "I have lasers now, Assiram-with-two-s's." },
    { who: "", text: "Atlas fires. The rugs unravel thread by government-mandated thread." },
    { who: "HENRY", text: "...Rwar." },
    { who: "ALEX", text: "Cool. I'm gonna go." },
    { who: "ASSIRAM", text: "This isn't over, sist... it is spelled with TWO S's!!" },
    { who: "PETER", text: "...Nice work, Atlas." },
    { who: "", text: "The Administration falls. The Speech & Debate team is safe, and PKD can finally breathe." },
    { who: "", text: "And somewhere on a practice website, a whole dog takes off into the sky." },
  ],
];

const ISRAELI_FLAG_LEVEL = 2;
const ISRAELI_FLAG_AT = { x: 1560, y: 402 };

function drawFlagDecal(ctx, x, y, w) {
  const h = w * 0.72;
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = "#eef2f7";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#0038b8";
  ctx.fillRect(x, y + h * 0.14, w, h * 0.16);
  ctx.fillRect(x, y + h * 0.70, w, h * 0.16);
  const cx = x + w / 2, cy = y + h / 2, r = h * 0.26;
  ctx.strokeStyle = "#0038b8";
  ctx.lineWidth = Math.max(0.6, w * 0.05);
  for (const flip of [1, -1]) {
    ctx.beginPath();
    for (let i = 0; i < 3; i += 1) {
      const a = (Math.PI * 2 * i) / 3 - Math.PI / 2;
      const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r * flip;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();
}

const rnd = (seed) => {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
};

// Floating islands, not factory blocks: this is a sea of wreckage with
// chunks of land hanging over it.
function buildScenery(level, idx) {
  const r = rnd(idx * 7919 + 13);
  const isles = [], clouds = [], gears = [];
  for (let x = -300; x < level.width + 500; x += 300 + r() * 260) {
    isles.push({ x, y: 120 + r() * 150, w: 90 + r() * 150, h: 26 + r() * 34, depth: 0.2 + r() * 0.25 });
  }
  for (let x = -300; x < level.width + 500; x += 240 + r() * 200) {
    clouds.push({ x, y: 40 + r() * 160, w: 80 + r() * 130, h: 16 + r() * 22, depth: 0.1 + r() * 0.14 });
  }
  for (let x = -200; x < level.width + 400; x += 380 + r() * 260) {
    gears.push({ x, y: 150 + r() * 140, rad: 22 + r() * 26, teeth: 8 + Math.floor(r() * 5), spin: r() > 0.5 ? 1 : -1 });
  }
  return { isles, clouds, gears };
}

// Types a line out character by character. Remounted per line via `key`, so
// each new line starts from empty rather than continuing the previous one.
function Typewriter({ text, speed = 22 }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      if (i >= text.length) clearInterval(id);
      setN(Math.min(i, text.length));
    }, speed);
    return () => { clearInterval(id); };
  }, [text, speed]);
  return <>{text.slice(0, n)}<span className="dlg-caret">{n < text.length ? "▌" : ""}</span></>;
}


// Hand-drawn portrait per character, shown beside their dialogue. Kept to
// simple primitives so each reads at a glance: Atlas the cyborg dog, the
// three humans distinct by hair and palette, Peter a translucent ghost,
// Henry the dragon, Alex the half-asleep goon, and Assiram as Marisa's dark
// mirror (same face, evil palette, so the twin gag lands on sight).
function CharPortrait({ id, col }) {
  const P = { width: 56, height: 56, viewBox: "0 0 56 56", style: { display: "block" } };
  const skin = "#e8b892", skin2 = "#caa079";
  if (id === "ATLAS") return (
    <svg {...P}>
      <ellipse cx="30" cy="34" rx="18" ry="15" fill="#e0b07a" />
      <polygon points="16,22 20,8 27,22" fill="#b5723a" />
      <polygon points="44,22 40,8 33,22" fill="#b5723a" />
      <ellipse cx="40" cy="40" rx="9" ry="6" fill="#c9844b" />
      <ellipse cx="47" cy="41" rx="3" ry="2.4" fill="#1a0f08" />
      <rect x="14" y="26" width="18" height="12" rx="3" fill="#8fb0c8" />
      <circle cx="18" cy="30" r="1.4" fill="#3a5570" /><circle cx="28" cy="30" r="1.4" fill="#3a5570" />
      <circle cx="26" cy="30" r="5" fill="#0a0a12" />
      <circle cx="26" cy="30" r="3.4" fill={col} /><circle cx="27" cy="29" r="1" fill="#fff" />
    </svg>
  );
  if (id === "MARISA") return (
    <svg {...P}>
      <path d="M13 30 Q13 8 28 8 Q43 8 43 30 L43 40 Q28 50 13 40 Z" fill="#7a4a2e" />
      <ellipse cx="28" cy="32" rx="14" ry="15" fill={skin} />
      <path d="M14 26 Q14 11 28 11 Q42 11 42 26 Q34 20 28 20 Q22 20 14 26 Z" fill="#5f3820" />
      <circle cx="22" cy="31" r="2" fill="#3a2418" /><circle cx="34" cy="31" r="2" fill="#3a2418" />
      <path d="M23 39 Q28 43 33 39" stroke="#a8563c" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="19" cy="36" r="2.4" fill={col} opacity="0.4" /><circle cx="37" cy="36" r="2.4" fill={col} opacity="0.4" />
    </svg>
  );
  if (id === "TIANA") return (
    <svg {...P}>
      <circle cx="28" cy="14" r="6" fill="#2a1a10" />
      <path d="M15 32 Q15 12 28 12 Q41 12 41 32 L41 40 Q28 49 15 40 Z" fill="#2a1a10" />
      <ellipse cx="28" cy="32" rx="13" ry="14" fill={skin2} />
      <path d="M16 27 Q16 14 28 14 Q40 14 40 27 Q33 21 28 21 Q23 21 16 27 Z" fill="#1e120a" />
      <circle cx="23" cy="31" r="2" fill="#2a1a12" /><circle cx="33" cy="31" r="2" fill="#2a1a12" />
      <path d="M24 39 Q28 42 32 39" stroke="#8a4a34" strokeWidth="2" fill="none" strokeLinecap="round" />
      <rect x="20" y="46" width="16" height="6" rx="3" fill={col} />
    </svg>
  );
  if (id === "EDWARD") return (
    <svg {...P}>
      <path d="M13 26 Q10 6 28 7 Q47 6 43 26 Q40 16 28 16 Q16 16 13 26 Z" fill="#5a3a22" />
      <path d="M13 26 q-3 -6 3 -8 M43 26 q3 -6 -3 -8" stroke="#5a3a22" strokeWidth="4" fill="none" strokeLinecap="round" />
      <ellipse cx="28" cy="33" rx="13" ry="14" fill={skin} />
      {/* sunglasses, like the real Edward */}
      <rect x="16" y="29" width="10" height="7" rx="2.5" fill="#1a1a22" />
      <rect x="30" y="29" width="10" height="7" rx="2.5" fill="#1a1a22" />
      <rect x="26" y="31" width="4" height="2" fill="#1a1a22" />
      <rect x="17" y="30" width="4" height="2" rx="1" fill={col} opacity="0.7" />
      <path d="M24 41 Q28 44 32 41" stroke="#a8563c" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
  if (id === "PETER") return (
    <svg {...P}>
      <g opacity="0.72">
        <path d="M14 30 Q14 10 28 10 Q42 10 42 30 L42 46 L37 42 L32 47 L28 42 L24 47 L19 42 L14 46 Z" fill={col} opacity="0.5" />
        <path d="M14 30 Q14 12 28 12 Q42 12 42 30 L42 44 L38 41 L33 45 L28 41 L23 45 L18 41 L14 44 Z" fill="#dbeaf2" opacity="0.55" />
        <ellipse cx="23" cy="28" rx="2.4" ry="3.4" fill="#2a4a5c" />
        <ellipse cx="33" cy="28" rx="2.4" ry="3.4" fill="#2a4a5c" />
        <ellipse cx="28" cy="36" rx="3" ry="4" fill="#2a4a5c" opacity="0.6" />
      </g>
    </svg>
  );
  if (id === "HENRY") return (
    <svg {...P}>
      <polygon points="16,20 12,6 24,16" fill="#8a2a22" />
      <polygon points="40,20 44,6 32,16" fill="#8a2a22" />
      <path d="M12 30 Q12 16 28 16 Q44 16 44 30 Q44 40 34 42 L44 48 L28 44 L12 40 Z" fill={col} />
      <path d="M28 32 L48 40 L28 40 Z" fill="#a83a30" />
      <ellipse cx="45" cy="39" rx="2" ry="1.4" fill="#1a0808" />
      <polygon points="20,29 27,31 20,33" fill="#ffd15c" />
      <ellipse cx="22" cy="28" rx="3.4" ry="2.4" fill="#ffd15c" />
      <ellipse cx="22" cy="28" rx="1.6" ry="2.4" fill="#1a0808" />
      <path d="M14 38 l4 3 M16 44 l4 2" stroke="#8a2a22" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
  if (id === "ALEX") return (
    <svg {...P}>
      <ellipse cx="28" cy="33" rx="13" ry="14" fill={skin2} />
      {/* beanie, pulled low */}
      <path d="M14 27 Q14 10 28 10 Q42 10 42 27 Z" fill={col} />
      <rect x="13" y="25" width="30" height="5" rx="2.5" fill="#6a5f85" />
      {/* half-lidded, doesn't-care eyes */}
      <path d="M20 33 h5" stroke="#2a1a12" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M31 33 h5" stroke="#2a1a12" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M24 41 h8" stroke="#8a5a44" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
  if (id === "ASSIRAM") return (
    <svg {...P}>
      {/* Marisa's silhouette, mirrored and drained to a cold evil palette */}
      <path d="M13 30 Q13 8 28 8 Q43 8 43 30 L43 40 Q28 50 13 40 Z" fill="#2a1420" />
      <ellipse cx="28" cy="32" rx="14" ry="15" fill="#c99db0" />
      <path d="M14 26 Q14 11 28 11 Q42 11 42 26 Q34 20 28 20 Q22 20 14 26 Z" fill="#1c0e16" />
      {/* sharp raised brows + smirk = the evil twin */}
      <path d="M19 27 l6 3 M37 27 l-6 3" stroke="#1c0e16" strokeWidth="2" strokeLinecap="round" />
      <circle cx="22" cy="32" r="2" fill={col} /><circle cx="34" cy="32" r="2" fill={col} />
      <path d="M22 40 Q28 38 34 41" stroke="#8a2a52" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
  return null;
}

function SecretGame({ onClose }) {
  const canvasRef = useRef(null);
  const keysRef = useRef({ left: false, right: false, jump: false });
  const [levelIndex, setLevelIndex] = useState(0);
  const [runId, setRunId] = useState(0);
  const [hud, setHud] = useState({ parts: 0, deaths: 0, shield: false, power: null, powerLeft: 0 });
  const [pending, setPending] = useState(null);
  const [won, setWon] = useState(false);
  const [upgrades, setUpgrades] = useState(0);
  const [banner, setBanner] = useState(null);
  const [story, setStory] = useState({ beat: 0, line: 0 }); // intro plays first
  const bannerTimer = useRef(null);

  const storyActive = story !== null;

  useEffect(() => () => clearTimeout(bannerTimer.current), []);

  useEffect(() => {
    const down = (e) => {
      const k = e.key;
      if (k === "Escape") { onClose(); return; }
      if (storyActive) return;
      if (k === "r" || k === "R") { setRunId((n) => n + 1); return; }
      if (k === "ArrowLeft" || k === "a" || k === "A") keysRef.current.left = true;
      if (k === "ArrowRight" || k === "d" || k === "D") keysRef.current.right = true;
      if (k === " " || k === "ArrowUp" || k === "w" || k === "W") keysRef.current.jump = true;
      if ([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(k)) e.preventDefault();
    };
    const up = (e) => {
      const k = e.key;
      if (k === "ArrowLeft" || k === "a" || k === "A") keysRef.current.left = false;
      if (k === "ArrowRight" || k === "d" || k === "D") keysRef.current.right = false;
      if (k === " " || k === "ArrowUp" || k === "w" || k === "W") keysRef.current.jump = false;
    };
    window.addEventListener("keydown", down, { passive: false });
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [onClose, storyActive]);

  useEffect(() => {
    if (won || pending || storyActive) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d", { alpha: false });
    // Cap the backing store at 1x. Beyond that the per-frame fill cost roughly
    // doubles for a difference no one sees once bloom and the vignette land;
    // this alone is most of the framerate win on retina displays.
    const dpr = 1;
    canvas.width = GAME_W * dpr;
    canvas.height = GAME_H * dpr;
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = true;

    // Quarter-resolution bloom buffer. Instead of the CSS blur filter (which
    // is very slow on a 2D canvas), the softness comes for free from scaling
    // this small buffer back up bilinearly. No filter in the hot loop.
    const BW = Math.round(GAME_W / 4), BH = Math.round(GAME_H / 4);
    const glow = document.createElement("canvas");
    glow.width = BW; glow.height = BH;
    const gctx = glow.getContext("2d");

    const level = LEVELS[levelIndex];
    const sky = SKIES[levelIndex % SKIES.length];

    // Static gradients cost real time when rebuilt every frame, and neither of
    // these changes within a level, so build them once here.
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GAME_H);
    skyGrad.addColorStop(0, sky.top); skyGrad.addColorStop(0.45, sky.mid); skyGrad.addColorStop(0.82, sky.low);
    const vigGrad = ctx.createRadialGradient(GAME_W / 2, GAME_H / 2, GAME_H * 0.42, GAME_W / 2, GAME_H / 2, GAME_H * 0.95);
    vigGrad.addColorStop(0, "#00000000"); vigGrad.addColorStop(1, "#000000aa");

    const scene = buildScenery(level, levelIndex);
    const plats = level.platforms.map((p) => ({ ...p, dx: 0, dy: 0, ox: p.x, oy: p.y, fuse: null, gone: false }));
    const hzds = level.hazards.map((h) => ({ ...h, ox: h.x, oy: h.y }));
    const parts = level.gems.map(([x, y]) => ({ x, y, got: false, vx: 0, vy: 0 }));
    const pads = (level.pads || []).map(([x, y]) => ({ x, y, squash: 0 }));
    const drops = (level.powers || []).map(([x, y, kind]) => ({ x, y, kind, taken: false }));
    const T = tuning(upgrades);
    const player = {
      x: level.spawn.x, y: level.spawn.y, w: 26, h: 30,
      vx: 0, vy: 0, onGround: false, face: 1, coyote: 0, buffer: 0, run: 0,
      standing: null, airJumps: 0, shield: T.shield, iframe: 0, thrust: 0,
      power: null, powerLeft: 0, squash: 0, land: 0,
    };
    const bits = [];
    const rings = [];   // expanding shockwave rings
    const lines = [];   // manga speed lines
    const pops = [];    // floating impact words
    const trail = [];
    let shake = 0, flash = 0, freeze = 0, zoom = 0;
    // Power-up cinematics: a slow-motion window, a rising light column, and a
    // full-screen colour wash, all separate from the generic flash so the
    // pickup reads as a bigger event than a hit.
    let slowmo = 0, powerFx = 0, powerCol = "#fff", powerCol2 = "#fff";
    let pillarX = 0, pillarY = 0;
    let deaths = 0, collected = 0, cam = 0, t = 0, raf = 0;
    let last = performance.now();
    let finished = false, hudInit = false;

    const syncHud = () => setHud({
      parts: collected, deaths, shield: player.shield,
      power: player.power, powerLeft: player.powerLeft,
    });

    const spawn = (n, x, y, o) => {
      for (let i = 0; i < n; i += 1) {
        const a = o.dir === undefined ? Math.random() * Math.PI * 2 : o.dir + (Math.random() - 0.5) * (o.spread || 1);
        const sp = (o.spd || 90) * (0.35 + Math.random());
        bits.push({
          x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.lift || 0),
          life: (o.life || 0.5) * (0.6 + Math.random() * 0.8), max: o.life || 0.5,
          col: o.col, size: (o.size || 3) * (0.5 + Math.random()),
          grav: o.grav === undefined ? 380 : o.grav, glow: !!o.glow,
        });
      }
    };
    const ring = (x, y, col, max, w, delay) => rings.push({ x, y, r: 6, max, col, w: w || 3, life: 1, delay: delay || 0 });
    const burstLines = (x, y, col, n) => {
      for (let i = 0; i < n; i += 1) {
        const a = (Math.PI * 2 * i) / n + Math.random() * 0.3;
        lines.push({ x, y, a, len: 40 + Math.random() * 90, off: 20 + Math.random() * 30, life: 0.45, max: 0.45, col });
      }
    };
    const popWord = (x, y, text, col) => pops.push({ x, y, text, col, life: 0.9, max: 0.9 });

    const grantPower = (kind) => {
      const P = POWERS[kind];
      player.power = kind;
      player.powerLeft = P.dur;
      const cx = player.x + 13, cy = player.y + 15;

      // Stage 1: a hard hitstop, then a slow-motion window so the burst is
      // watchable. powerFx drives the pillar and the colour wash over ~0.7s.
      freeze = 0.2; slowmo = 0.55; powerFx = 1; zoom = 1.4;
      flash = 0.6; shake = Math.max(shake, 14);
      powerCol = P.col; powerCol2 = P.col2; pillarX = cx; pillarY = cy;

      // Stage 2: four shockwaves fired in sequence, alternating the two power
      // colours, so it pulses outward instead of popping once.
      ring(cx, cy, P.col2, 90, 4, 0);
      ring(cx, cy, P.col, 180, 5, 0.09);
      ring(cx, cy, P.col2, 250, 3, 0.19);
      ring(cx, cy, P.col, 320, 4, 0.3);

      // Stage 3: two rounds of speed lines and a fat, layered particle burst.
      burstLines(cx, cy, P.col, 26);
      burstLines(cx, cy, P.col2, 18);
      spawn(80, cx, cy, { col: P.col, spd: 340, life: 1, size: 4.5, glow: true, grav: 90 });
      spawn(46, cx, cy, { col: P.col2, spd: 210, life: 1.3, size: 3, glow: true, grav: 40 });
      // a spray that erupts straight up the pillar
      spawn(30, cx, cy, { col: P.col2, dir: -Math.PI / 2, spread: 0.5, spd: 380, life: 1.1, size: 3.4, glow: true, grav: 260 });
      popWord(cx, cy - 16, P.cry, P.col2);

      clearTimeout(bannerTimer.current);
      setBanner({ kind, name: P.name, blurb: P.blurb, col: P.col, col2: P.col2 });
      bannerTimer.current = setTimeout(() => setBanner(null), 2600);
      syncHud();
    };

    const die = () => {
      if (player.power === "ironhide") return;
      if (player.shield) {
        player.shield = false; player.iframe = 1.1;
        shake = Math.max(shake, 10); flash = 0.5;
        ring(player.x + 13, player.y + 15, "#fbbf24", 110, 4);
        spawn(30, player.x + 13, player.y + 15, { col: "#fbbf24", spd: 220, life: 0.6, size: 3.5, glow: true });
        popWord(player.x + 13, player.y - 6, "GUARD!", "#fff7cc");
        player.y -= 12; player.vy = -280;
        syncHud();
        return;
      }
      deaths += 1;
      shake = Math.max(shake, 16); flash = 0.75; freeze = 0.08;
      ring(player.x + 13, player.y + 15, "#ff3d3d", 150, 4);
      burstLines(player.x + 13, player.y + 15, "#ff8c42", 14);
      spawn(50, player.x + 13, player.y + 15, { col: "#ff9d00", spd: 280, life: 0.8, size: 4.5, glow: true });
      spawn(26, player.x + 13, player.y + 15, { col: "#ff3d3d", spd: 170, life: 1, size: 3, glow: true });
      player.x = level.spawn.x; player.y = level.spawn.y;
      player.vx = 0; player.vy = 0; player.standing = null;
      player.shield = T.shield; player.iframe = 0.8;
      // Keep any active power-up through a death: falling in a pit shouldn't
      // strip a Kirby ability you just earned. The timer keeps running.
      for (const p of plats) { p.fuse = null; p.gone = false; }
      syncHud();
    };

    const step = (dt) => {
      t += dt;
      shake = Math.max(0, shake - dt * 46);
      flash = Math.max(0, flash - dt * 3.2);
      zoom = Math.max(0, zoom - dt * 2.4);
      player.iframe = Math.max(0, player.iframe - dt);

      const P = player.power ? POWERS[player.power] : null;
      if (player.power) {
        player.powerLeft -= dt;
        if (player.powerLeft <= 0) {
          player.power = null; player.powerLeft = 0;
          ring(player.x + 13, player.y + 15, "#ffffff", 80, 2);
          syncHud();
        } else if (Math.floor(player.powerLeft * 2) !== Math.floor((player.powerLeft + dt) * 2)) syncHud();
      }
      const spd = T.speed * (player.power === "overdrive" ? 1.8 : 1);
      const jmp = T.jump * (player.power === "titan" ? 1.32 : 1);

      for (const h of hzds) {
        if (!h.mv) continue;
        const off = Math.sin(t * (h.mv.speed / 100) + (h.mv.phase || 0)) * (h.mv.dist / 2);
        if (h.mv.axis === "x") h.x = h.ox + off; else h.y = h.oy + off;
      }
      for (const p of plats) {
        if (!p.mv) continue;
        const px = p.x, py = p.y;
        const off = Math.sin(t * (p.mv.speed / 100) + (p.mv.phase || 0)) * (p.mv.dist / 2);
        if (p.mv.axis === "x") p.x = p.ox + off; else p.y = p.oy + off;
        p.dx = p.x - px; p.dy = p.y - py;
      }
      for (const p of plats) {
        if (!p.crumble || p.fuse === null || p.gone) continue;
        p.fuse -= dt;
        if (p.fuse < CRUMBLE_TIME * 0.6 && Math.random() < 0.5) {
          spawn(1, p.x + Math.random() * p.w, p.y + p.h, { col: sky.rim, spd: 30, life: 0.5, size: 2, grav: 260 });
        }
        if (p.fuse <= 0) {
          p.gone = true;
          if (player.standing === p) player.standing = null;
          spawn(18, p.x + p.w / 2, p.y + 6, { col: sky.rim, spd: 140, life: 0.7, size: 3.5, glow: true });
          shake = Math.max(shake, 4);
        }
      }
      if (player.standing) { player.x += player.standing.dx; player.y += player.standing.dy; }

      const k = keysRef.current;
      const dir = (k.right ? 1 : 0) - (k.left ? 1 : 0);
      player.vx = dir * spd;
      if (dir !== 0) { player.face = dir; player.run += dt * 12; }

      const wasAir = !player.onGround;
      const infinite = player.power === "jet";
      player.buffer = k.jump ? JUMP_BUFFER : Math.max(0, player.buffer - dt);
      player.coyote = player.onGround ? T.coyote : Math.max(0, player.coyote - dt);
      if (player.buffer > 0 && player.coyote > 0) {
        player.vy = jmp;
        player.buffer = 0; player.coyote = 0; player.onGround = false; player.standing = null;
        player.airJumps = T.airJumps;
        spawn(11, player.x + 13, player.y + 30, { col: sky.accent, dir: Math.PI / 2, spread: 1.6, spd: 100, life: 0.32, size: 2.6, glow: true });
      } else if (player.buffer > 0 && wasAir && (infinite || player.airJumps > 0)) {
        player.vy = jmp * 0.94;
        if (!infinite) player.airJumps -= 1;
        player.buffer = 0; player.thrust = 0.32;
        const c = infinite ? POWERS.jet.col : sky.rim;
        ring(player.x + 13, player.y + 26, c, 46, 2);
        spawn(22, player.x + 13, player.y + 28, { col: c, dir: Math.PI / 2, spread: 1.1, spd: 230, life: 0.45, size: 3.4, glow: true });
        shake = Math.max(shake, 3);
      }
      player.thrust = Math.max(0, player.thrust - dt);
      player.squash = Math.max(0, player.squash - dt * 4.5);
      player.land = Math.max(0, player.land - dt * 3);
      if (!k.jump && player.vy < 0) player.vy *= 0.86;
      player.vy = Math.min(player.vy + GRAVITY * dt, MAX_FALL);

      player.x += player.vx * dt;
      for (const p of plats) {
        if (p.gone || !overlaps(player, p)) continue;
        if (player.vx > 0) player.x = p.x - player.w;
        else if (player.vx < 0) player.x = p.x + p.w;
        player.vx = 0;
      }

      const fell = player.vy;
      player.y += player.vy * dt;
      player.onGround = false; player.standing = null;
      for (const p of plats) {
        if (p.gone || !overlaps(player, p)) continue;
        if (player.vy > 0) {
          player.y = p.y - player.h;
          player.onGround = true; player.standing = p;
          if (p.crumble && p.fuse === null) p.fuse = CRUMBLE_TIME;
          player.land = Math.min(1, fell / 700);
          player.squash = player.land;
          if (fell > 420) {
            spawn(12, player.x + 13, player.y + 30, { col: sky.accent, dir: 0, spread: 6.3, spd: 80, life: 0.3, size: 2.2 });
            shake = Math.max(shake, 2.5);
          }
        } else if (player.vy < 0) player.y = p.y + p.h;
        player.vy = 0;
      }
      if (player.onGround) player.airJumps = T.airJumps;

      // bounce pads: a big free launch, with the squash to sell it
      for (const pd of pads) {
        pd.squash = Math.max(0, pd.squash - dt * 4);
        if (player.vy >= 0 && overlaps(player, { x: pd.x - 18, y: pd.y - 10, w: 36, h: 16 })) {
          player.vy = jmp * 1.55;
          player.onGround = false; player.standing = null;
          player.airJumps = T.airJumps;
          pd.squash = 1;
          shake = Math.max(shake, 6); 
          ring(pd.x, pd.y, sky.accent, 90, 3);
          spawn(26, pd.x, pd.y, { col: sky.accent, dir: -Math.PI / 2, spread: 1.6, spd: 220, life: 0.5, size: 3, glow: true });
          popWord(pd.x, pd.y - 26, "BOING!", sky.rim);
        }
      }

      if (player.x < 0) player.x = 0;
      if (player.x + player.w > level.width) player.x = level.width - player.w;

      if (player.iframe <= 0) for (const h of hzds) if (overlaps(player, h)) { die(); break; }
      if (player.y > DEATH_Y) die();

      for (const d of drops) {
        if (d.taken) continue;
        if (overlaps(player, { x: d.x - 16, y: d.y - 16, w: 32, h: 32 })) { d.taken = true; grantPower(d.kind); }
      }

      const magnet = player.power === "magnet";
      for (const g of parts) {
        if (g.got) continue;
        if (magnet) {
          const dx = player.x + 13 - g.x, dy = player.y + 15 - g.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 260) { g.x += (dx / dist) * 420 * dt; g.y += (dy / dist) * 420 * dt; }
        }
        if (overlaps(player, { x: g.x - 12, y: g.y - 12, w: 24, h: 24 })) {
          g.got = true; collected += 1;
          ring(g.x, g.y, sky.accent, 44, 2);
          spawn(20, g.x, g.y, { col: sky.accent, spd: 170, life: 0.5, size: 3, glow: true });
          spawn(10, g.x, g.y, { col: "#ffffff", spd: 100, life: 0.7, size: 2, glow: true });
          shake = Math.max(shake, 2);
          syncHud();
        }
      }

      if (!finished && overlaps(player, level.goal)) {
        finished = true;
        flash = 1; shake = Math.max(shake, 14);
        ring(level.goal.x + 22, level.goal.y + 40, sky.accent, 240, 6);
        burstLines(level.goal.x + 22, level.goal.y + 40, sky.rim, 26);
        spawn(70, level.goal.x + 22, level.goal.y + 40, { col: sky.accent, spd: 280, life: 1, size: 4, glow: true, grav: 80 });
        setPending({ level: levelIndex, parts: collected, total: parts.length });
        setStory({ beat: levelIndex + 1, line: 0 });
      }

      if (Math.abs(player.vx) > 10 && t % 0.045 < dt) trail.push({ x: player.x, y: player.y, f: player.face, life: 0.24 });
      for (let i = trail.length - 1; i >= 0; i -= 1) { trail[i].life -= dt; if (trail[i].life <= 0) trail.splice(i, 1); }
      for (let i = bits.length - 1; i >= 0; i -= 1) {
        const b = bits[i]; b.life -= dt;
        if (b.life <= 0) { bits.splice(i, 1); continue; }
        b.vy += b.grav * dt; b.x += b.vx * dt; b.y += b.vy * dt;
      }
      for (let i = rings.length - 1; i >= 0; i -= 1) {
        const rg = rings[i];
        if (rg.delay > 0) { rg.delay -= dt; continue; } // staggered rings wait their turn
        rg.r += (rg.max - rg.r) * Math.min(1, dt * 7); rg.life -= dt * 1.7;
        if (rg.life <= 0) rings.splice(i, 1);
      }
      for (let i = lines.length - 1; i >= 0; i -= 1) { lines[i].life -= dt; if (lines[i].life <= 0) lines.splice(i, 1); }
      for (let i = pops.length - 1; i >= 0; i -= 1) { pops[i].life -= dt; pops[i].y -= dt * 34; if (pops[i].life <= 0) pops.splice(i, 1); }

      const target = player.x + player.w / 2 - GAME_W / 2;
      cam += (Math.max(0, Math.min(target, level.width - GAME_W)) - cam) * Math.min(1, dt * 8);
    };

    const drawAtlas = (px, py, face, u, alpha) => {
      const P = player.power ? POWERS[player.power] : null;
      const big = player.power === "titan" ? 1.28 : 1;
      ctx.save();
      ctx.globalAlpha = alpha;
      // Squash and stretch: she compresses on impact and elongates through
      // the air. This is most of what makes a jump feel like it has weight.
      const air = Math.max(-1, Math.min(1, player.vy / 620));
      const sqx = 1 + player.squash * 0.42 - air * 0.10;
      const sqy = 1 - player.squash * 0.38 + air * 0.10;
      ctx.translate(px + 13, py + 15 + player.squash * 6);
      ctx.scale(face * big * sqx, big * sqy);
      const bob = player.onGround ? Math.sin(player.run) * 1.4 : 0;
      const swing = player.onGround ? Math.sin(player.run) * 4 : 2.5;

      if (P && alpha > 0.5) { // power aura
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const au = ctx.createRadialGradient(0, 0, 4, 0, 0, 34);
        au.addColorStop(0, `${P.col}66`); au.addColorStop(1, "#00000000");
        ctx.fillStyle = au;
        ctx.beginPath(); ctx.arc(0, 0, 30 + Math.sin(t * 9) * 3, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      if ((u >= 2 && !player.onGround) || player.thrust > 0) {
        const heat = player.thrust > 0 ? 1 : 0.45;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        for (const lx of [-7, 5]) {
          const fl = (12 + Math.random() * 14) * heat;
          const g = ctx.createLinearGradient(0, 14, 0, 14 + fl);
          g.addColorStop(0, P ? P.col2 : "#ffe66d"); g.addColorStop(1, "#ff550000");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(lx - 3, 14); ctx.lineTo(lx + 3, 14); ctx.lineTo(lx, 14 + fl);
          ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      }

      ctx.strokeStyle = GC.tanDark; ctx.lineWidth = 4.5; ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-12, -4 + bob); ctx.quadraticCurveTo(-21, -9 + bob, -18, -17 + bob); ctx.stroke();

      ctx.fillStyle = GC.tanDark;
      ctx.fillRect(-9 + swing, 7 + bob, 5, 8);
      ctx.fillRect(4 - swing, 7 + bob, 5, 8);
      if (u >= 1) {
        ctx.fillStyle = GC.steelMid;
        ctx.fillRect(-10 + swing, 9 + bob, 7, 4);
        ctx.fillRect(3 - swing, 9 + bob, 7, 4);
      }
      if (u >= 2) {
        ctx.fillStyle = GC.steelDark;
        ctx.fillRect(-10 + swing, 14 + bob, 7, 3);
        ctx.fillRect(3 - swing, 14 + bob, 7, 3);
      }

      const bg = ctx.createLinearGradient(0, -12 + bob, 0, 9 + bob);
      bg.addColorStop(0, GC.tan); bg.addColorStop(1, GC.tanMid);
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.roundRect(-13, -10 + bob, 25, 19, 8); ctx.fill();

      if (u >= 3) {
        ctx.save(); ctx.translate(-3, -1 + bob); ctx.rotate(t * 3);
        ctx.strokeStyle = GC.eye; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.ellipse(0, 0, 6, 2.4, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
      if (u >= 4) {
        ctx.fillStyle = player.power === "ironhide" ? POWERS.ironhide.col : GC.steel;
        ctx.beginPath(); ctx.roundRect(-11, -8 + bob, 15, 13, 3); ctx.fill();
        ctx.fillStyle = GC.steelDark; ctx.fillRect(-11, -8 + bob, 15, 3.5);
        for (const bx of [-9, 1]) for (const by of [-5, 2]) {
          ctx.beginPath(); ctx.arc(bx, by + bob, 1, 0, Math.PI * 2); ctx.fill();
        }
      }

      ctx.fillStyle = GC.tan;
      ctx.beginPath(); ctx.roundRect(4, -15 + bob, 13, 13, 5); ctx.fill();
      ctx.fillStyle = GC.tanDark;
      ctx.beginPath(); ctx.roundRect(13, -8 + bob, 6, 5, 2.5); ctx.fill();
      ctx.beginPath(); ctx.moveTo(6, -14 + bob); ctx.lineTo(10, -22 + bob); ctx.lineTo(14, -13 + bob);
      ctx.closePath(); ctx.fill();

      if (u >= 5) {
        ctx.fillStyle = GC.steelDark;
        ctx.beginPath(); ctx.arc(-13, -2 + bob, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#ff3d3d";
        ctx.beginPath(); ctx.arc(-13, -2 + bob, 1.6, 0, Math.PI * 2); ctx.fill();
        if (Math.sin(t * 2.4) > 0.72) {
          ctx.save(); ctx.globalCompositeOperation = "lighter";
          ctx.strokeStyle = "#ff3d3daa"; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(-15, -2 + bob); ctx.lineTo(-140, -2 + bob); ctx.stroke();
          ctx.restore();
        }
      }

      // rim light: a bright edge picked up from the sky behind her
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = sky.rim; ctx.globalAlpha = 0.55; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.roundRect(-13, -10 + bob, 25, 19, 8); ctx.stroke();
      ctx.beginPath(); ctx.roundRect(4, -15 + bob, 13, 13, 5); ctx.stroke();
      ctx.restore();

      ctx.fillStyle = "#0A0A12";
      ctx.beginPath(); ctx.arc(9, -9 + bob, 4, 0, Math.PI * 2); ctx.fill();
      const eg = ctx.createRadialGradient(9, -9 + bob, 0, 9, -9 + bob, 4);
      eg.addColorStop(0, "#ffffff"); eg.addColorStop(0.45, P ? P.col : GC.eye); eg.addColorStop(1, "#8b5cf6");
      ctx.fillStyle = eg;
      ctx.beginPath(); ctx.arc(9, -9 + bob, 3, 0, Math.PI * 2); ctx.fill();
      if (u >= 6) {
        ctx.strokeStyle = "#ffd000"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(9, -9 + bob, 6 + Math.sin(t * 5) * 1.2, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
    };

    const draw = () => {
      const sx = shake > 0 ? (Math.random() - 0.5) * shake : 0;
      const sy = shake > 0 ? (Math.random() - 0.5) * shake : 0;
      const u = upgrades;

      // ── sky ── (gradient cached at setup)
      ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, GAME_W, GAME_H);

      // sun disc with god rays
      const sunX = GAME_W * 0.72 - cam * 0.04, sunY = GAME_H * 0.36;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const sg = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 190);
      sg.addColorStop(0, sky.sun); sg.addColorStop(0.25, `${sky.rim}55`); sg.addColorStop(1, "#00000000");
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sunX, sunY, 190, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.16;
      for (let i = 0; i < 12; i += 1) {
        const a = (Math.PI * 2 * i) / 12 + t * 0.06;
        ctx.fillStyle = sky.sun;
        ctx.beginPath();
        ctx.moveTo(sunX, sunY);
        ctx.lineTo(sunX + Math.cos(a - 0.05) * 420, sunY + Math.sin(a - 0.05) * 420);
        ctx.lineTo(sunX + Math.cos(a + 0.05) * 420, sunY + Math.sin(a + 0.05) * 420);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();

      ctx.save();
      ctx.translate(sx, sy);

      for (const c of scene.clouds) {
        const x = c.x - cam * c.depth;
        if (x < -260 || x > GAME_W + 260) continue;
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = sky.sun;
        ctx.beginPath(); ctx.ellipse(x, c.y + Math.sin(t * 0.3 + c.x) * 4, c.w, c.h, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;

      for (const g2 of scene.gears) {
        const x = g2.x - cam * 0.3;
        if (x < -120 || x > GAME_W + 120) continue;
        ctx.save();
        ctx.translate(x, g2.y); ctx.rotate(t * 0.3 * g2.spin);
        ctx.globalAlpha = 0.28;
        ctx.strokeStyle = sky.top; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(0, 0, g2.rad, 0, Math.PI * 2); ctx.stroke();
        for (let i = 0; i < g2.teeth; i += 1) {
          const a = (Math.PI * 2 * i) / g2.teeth;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * g2.rad, Math.sin(a) * g2.rad);
          ctx.lineTo(Math.cos(a) * (g2.rad + 8), Math.sin(a) * (g2.rad + 8));
          ctx.stroke();
        }
        ctx.restore();
      }

      // floating islands
      for (const is of scene.isles) {
        const x = is.x - cam * is.depth;
        if (x < -320 || x > GAME_W + 320) continue;
        const yy = is.y + Math.sin(t * 0.5 + is.x * 0.01) * 5;
        ctx.fillStyle = sky.sea;
        ctx.beginPath();
        ctx.moveTo(x, yy);
        ctx.lineTo(x + is.w, yy);
        ctx.lineTo(x + is.w * 0.62, yy + is.h * 2.1);
        ctx.lineTo(x + is.w * 0.3, yy + is.h * 1.4);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = sky.rim;
        ctx.globalAlpha = 0.6; ctx.fillRect(x, yy - 3, is.w, 3); ctx.globalAlpha = 1;
      }

      // the sea of wreckage below everything
      const seaY = GAME_H - 54;
      const sgd = ctx.createLinearGradient(0, seaY, 0, GAME_H);
      sgd.addColorStop(0, `${sky.sea}00`); sgd.addColorStop(1, sky.sea);
      ctx.fillStyle = sgd; ctx.fillRect(0, seaY, GAME_W, 54);
      // the sun's reflection scattering across the wreck-sea
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 26; i += 1) {
        const gx = (i * 137 + Math.sin(t * 0.7 + i) * 22) % GAME_W;
        const gy = seaY + 8 + ((i * 53) % 40);
        ctx.globalAlpha = 0.10 + Math.abs(Math.sin(t * 2 + i)) * 0.24;
        ctx.fillStyle = sky.sun;
        ctx.fillRect(gx, gy, 12 + Math.sin(t + i) * 6, 1.6);
      }
      ctx.restore();
      ctx.globalAlpha = 0.5; ctx.strokeStyle = sky.rim; ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        for (let x = 0; x <= GAME_W; x += 20) {
          const yy = seaY + 12 + i * 13 + Math.sin((x + cam * 0.5) * 0.02 + t * 1.6 + i) * 3;
          if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      ctx.save();
      ctx.translate(-cam, 0);

      if (levelIndex === ISRAELI_FLAG_LEVEL) drawFlagDecal(ctx, ISRAELI_FLAG_AT.x, ISRAELI_FLAG_AT.y, 13);

      for (const p of plats) {
        if (p.gone) continue;
        const lit = p.crumble && p.fuse !== null;
        const sh = lit ? Math.sin(t * 45) * 1.8 : 0;
        ctx.save();
        ctx.globalAlpha = lit ? 0.5 + 0.5 * (p.fuse / CRUMBLE_TIME) : 1;
        // Flat fills instead of a per-platform gradient: two bands read as
        // the same bevel far cheaper, and the glow now comes from bloom.
        ctx.fillStyle = "#241e38";
        ctx.fillRect(p.x + sh, p.y, p.w, p.h);
        ctx.fillStyle = "#0d0b17";
        ctx.fillRect(p.x + sh, p.y + p.h * 0.5, p.w, p.h * 0.5);
        ctx.fillStyle = "#ffffff14";
        ctx.fillRect(p.x + sh, p.y + 3, 2, p.h - 3);
        ctx.fillStyle = "#00000055";
        ctx.fillRect(p.x + sh + p.w - 2, p.y + 3, 2, p.h - 3);
        const edge = p.crumble ? (lit ? "#ff6b6b" : "#ffd166") : p.mv ? "#7bf1a8" : sky.accent;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = edge;
        ctx.fillRect(p.x + sh, p.y, p.w, 3);
        ctx.globalAlpha *= 0.3; ctx.fillRect(p.x + sh, p.y + 3, p.w, 10);
        ctx.restore();
        ctx.restore();
      }

      for (const pd of pads) {
        const sq = pd.squash;
        ctx.save();
        ctx.translate(pd.x, pd.y);
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = sky.accent;
        ctx.beginPath();
        ctx.ellipse(0, -4 + sq * 4, 17, 7 - sq * 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.5;
        ctx.fillRect(-14, -2 + sq * 3, 28, 3);
        ctx.restore();
      }

      for (const h of hzds) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = "#ff3d3d";
        const n = Math.max(1, Math.floor(h.w / 14));
        for (let i = 0; i < n; i += 1) {
          const hx = h.x + (i * h.w) / n;
          ctx.beginPath();
          ctx.moveTo(hx, h.y + h.h);
          ctx.lineTo(hx + h.w / n / 2, h.y - Math.sin(t * 6 + i) * 2);
          ctx.lineTo(hx + h.w / n, h.y + h.h);
          ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      }

      for (const g2 of parts) {
        if (g2.got) continue;
        const bp = Math.sin(t * 3 + g2.x) * 4;
        ctx.save();
        ctx.translate(g2.x, g2.y + bp);
        ctx.rotate(t * 1.6);
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = sky.accent; ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.arc(0, 0, 5.4, 0, Math.PI * 2); ctx.stroke();
        for (let i = 0; i < 6; i += 1) {
          const a = (Math.PI * 2 * i) / 6;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * 5.4, Math.sin(a) * 5.4);
          ctx.lineTo(Math.cos(a) * 9.5, Math.sin(a) * 9.5);
          ctx.stroke();
        }
        ctx.restore();
      }

      // power-up capsules, pulsing hard so you want them
      for (const d of drops) {
        if (d.taken) continue;
        const P = POWERS[d.kind];
        const bp = Math.sin(t * 3.4 + d.x) * 5;
        ctx.save();
        ctx.translate(d.x, d.y + bp);
        ctx.globalCompositeOperation = "lighter";
        const gl = ctx.createRadialGradient(0, 0, 2, 0, 0, 30);
        gl.addColorStop(0, `${P.col}cc`); gl.addColorStop(1, "#00000000");
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fill();
        ctx.rotate(t * 1.1);
        ctx.fillStyle = P.col2;
        ctx.beginPath();
        for (let i = 0; i < 6; i += 1) {
          const a = (Math.PI * 2 * i) / 6;
          const rr = i % 2 ? 7 : 12;
          const px2 = Math.cos(a) * rr, py2 = Math.sin(a) * rr;
          if (i === 0) ctx.moveTo(px2, py2); else ctx.lineTo(px2, py2);
        }
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = P.col;
        ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      const gl2 = level.goal;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const pg = ctx.createLinearGradient(gl2.x, gl2.y, gl2.x, gl2.y + gl2.h);
      pg.addColorStop(0, `${sky.accent}00`); pg.addColorStop(0.5, `${sky.accent}aa`); pg.addColorStop(1, `${sky.accent}00`);
      ctx.fillStyle = pg; ctx.fillRect(gl2.x, gl2.y - 60, gl2.w, gl2.h + 120);
      ctx.strokeStyle = sky.rim; ctx.lineWidth = 2;
      ctx.strokeRect(gl2.x, gl2.y, gl2.w, gl2.h);
      for (let i = 0; i < 4; i += 1) {
        const yy = gl2.y + ((t * 60 + i * 22) % gl2.h);
        ctx.fillStyle = `${sky.rim}88`;
        ctx.fillRect(gl2.x, yy, gl2.w, 2);
      }
      ctx.restore();

      // Power-up light pillar: a bright column erupting from the pickup point,
      // brightest at the start and fading as powerFx decays.
      if (powerFx > 0) {
        const pf = powerFx;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const halfW = (10 + pf * 26);
        const pgd = ctx.createLinearGradient(pillarX - halfW, 0, pillarX + halfW, 0);
        pgd.addColorStop(0, "#00000000");
        pgd.addColorStop(0.5, powerCol2);
        pgd.addColorStop(1, "#00000000");
        ctx.globalAlpha = pf * 0.7;
        ctx.fillStyle = pgd;
        ctx.fillRect(pillarX - halfW, pillarY - 460, halfW * 2, 520);
        // a thinner white-hot core
        ctx.globalAlpha = pf * 0.9;
        ctx.fillStyle = powerCol;
        ctx.fillRect(pillarX - 3, pillarY - 440, 6, 500);
        // rising sparks climbing the beam
        for (let i = 0; i < 5; i += 1) {
          const ry = pillarY - ((t * 300 + i * 90) % 420);
          ctx.globalAlpha = pf * 0.8;
          ctx.fillStyle = powerCol2;
          ctx.fillRect(pillarX - 2 + Math.sin(t * 6 + i) * halfW * 0.6, ry, 3, 8);
        }
        ctx.restore();
      }

      for (const gt of trail) drawAtlas(gt.x, gt.y, gt.f, u, (gt.life / 0.24) * 0.26);
      if (player.iframe <= 0 || Math.sin(t * 40) > 0) drawAtlas(player.x, player.y, player.face, u, 1);
      if (player.shield) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = "#fbbf24"; ctx.globalAlpha = 0.5 + Math.sin(t * 3) * 0.2; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(player.x + 13, player.y + 15, 23, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      // No per-particle shadow blur (it was the single biggest draw cost with
      // 100+ live particles). Glowing bits just draw a touch bigger; bloom
      // supplies the actual halo.
      for (const b of bits) {
        ctx.globalAlpha = Math.max(0, Math.min(1, b.life / b.max));
        ctx.fillStyle = b.col;
        const sz = b.glow ? b.size * 1.4 : b.size;
        ctx.fillRect(b.x, b.y, sz, sz);
      }
      for (const rg of rings) {
        if (rg.delay > 0) continue; // not fired yet
        ctx.globalAlpha = Math.max(0, rg.life) * 0.85;
        ctx.strokeStyle = rg.col; ctx.lineWidth = rg.w;
        ctx.beginPath(); ctx.arc(rg.x, rg.y, rg.r, 0, Math.PI * 2); ctx.stroke();
      }
      for (const ln of lines) {
        const k2 = ln.life / ln.max;
        ctx.globalAlpha = k2 * 0.9;
        ctx.strokeStyle = ln.col; ctx.lineWidth = 3 * k2;
        const x1 = ln.x + Math.cos(ln.a) * (ln.off + (1 - k2) * 90);
        const y1 = ln.y + Math.sin(ln.a) * (ln.off + (1 - k2) * 90);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 + Math.cos(ln.a) * ln.len * k2, y1 + Math.sin(ln.a) * ln.len * k2);
        ctx.stroke();
      }
      ctx.restore();

      ctx.globalAlpha = 1;
      for (const pw of pops) {
        const k2 = pw.life / pw.max;
        ctx.save();
        ctx.globalAlpha = Math.min(1, k2 * 1.6);
        ctx.font = "900 20px 'Space Mono', monospace";
        ctx.textAlign = "center";
        ctx.lineWidth = 4; ctx.strokeStyle = "#000";
        ctx.strokeText(pw.text, pw.x, pw.y);
        ctx.fillStyle = pw.col;
        ctx.fillText(pw.text, pw.x, pw.y);
        ctx.restore();
      }

      // Foreground silhouettes drift past faster than anything else, which
      // is what actually sells the depth of the parallax behind them.
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = "#05030c";
      for (const is of scene.isles) {
        const fx = is.x * 1.7 - cam * 1.35;
        if (fx < -400 || fx > GAME_W + 400) continue;
        const fw = is.w * 1.5, fh = 30 + is.h;
        ctx.beginPath();
        ctx.moveTo(fx, GAME_H + 10);
        ctx.lineTo(fx + fw * 0.15, GAME_H - fh);
        ctx.lineTo(fx + fw * 0.55, GAME_H - fh * 0.7);
        ctx.lineTo(fx + fw, GAME_H + 10);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();

      ctx.restore(); // world
      ctx.restore(); // shake

      // ── bloom ──
      // Downsample the finished frame into the quarter-res buffer, then add it
      // back scaled up. The upscale is bilinear, so the softness is free and
      // there is no blur filter in the hot loop. Two offset draws widen it.
      gctx.clearRect(0, 0, BW, BH);
      gctx.drawImage(canvas, 0, 0, BW, BH);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.26;
      ctx.drawImage(glow, 0, 0, GAME_W, GAME_H);
      // a second, slightly larger draw softens the halo without a real blur
      ctx.globalAlpha = 0.16;
      ctx.drawImage(glow, -6, -4, GAME_W + 12, GAME_H + 8);
      ctx.restore();

      // Chromatic split, only while the screen is already shaking, so hits
      // land with a lens-punch instead of a clean cut.
      if (shake > 4) {
        const off = Math.min(4, shake * 0.22);
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 0.14;
        ctx.drawImage(glow, -off, 0, GAME_W, GAME_H);
        ctx.drawImage(glow, off, 0, GAME_W, GAME_H);
        ctx.restore();
      }

      if (flash > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = Math.min(0.85, flash);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, GAME_W, GAME_H);
        ctx.restore();
      }

      // Power-up colour wash: the whole screen briefly floods with the power's
      // hue from the edges in, so the pickup owns the frame for a moment.
      if (powerFx > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const wg = ctx.createRadialGradient(pillarX - cam, pillarY, 40, pillarX - cam, pillarY, GAME_W * 0.7);
        wg.addColorStop(0, "#00000000");
        wg.addColorStop(0.7, "#00000000");
        wg.addColorStop(1, powerCol);
        ctx.globalAlpha = powerFx * 0.5;
        ctx.fillStyle = wg;
        ctx.fillRect(0, 0, GAME_W, GAME_H);
        ctx.restore();
      }

      // vignette keeps the eye centred once the colours get loud (cached)
      ctx.fillStyle = vigGrad; ctx.fillRect(0, 0, GAME_W, GAME_H);
    };

    const loop = (now) => {
      if (!hudInit) { hudInit = true; syncHud(); }
      const realDt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      // Cinematic timers always run on real time, so the pillar and the colour
      // wash resolve even while the world is frozen or slowed.
      if (powerFx > 0) powerFx = Math.max(0, powerFx - realDt / 0.7);
      let dt = realDt;
      // hitstop: hold the world still for a beat so the power-up lands hard
      if (freeze > 0) { freeze -= realDt; dt = 0; }
      // slow-motion after a power-up, easing back to full speed
      if (slowmo > 0) {
        dt *= 0.32 + 0.68 * (1 - Math.min(1, slowmo / 0.55));
        slowmo = Math.max(0, slowmo - realDt);
      }
      if (dt > 0) step(dt);
      draw();
      if (!finished) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [levelIndex, runId, won, pending, upgrades, storyActive]);

  const advanceStory = () => {
    const beat = STORY[story.beat];
    if (story.line + 1 < beat.length) { setStory({ beat: story.beat, line: story.line + 1 }); return; }
    // beat finished
    if (story.beat === 0) { setStory(null); return; }          // intro over, play round 1
    if (pending) {
      const next = pending.level + 1;
      setUpgrades(Math.min(next, UPGRADES.length));
      setPending(null);
      setStory(null);
      if (next < LEVELS.length) setLevelIndex(next); else setWon(true);
    } else setStory(null);
  };

  const restartAll = () => {
    setUpgrades(0); setWon(false); setPending(null); setBanner(null);
    setLevelIndex(0); setRunId((n) => n + 1);
    setStory({ beat: 0, line: 0 });
  };

  const hold = (key, val) => (e) => { e.preventDefault(); keysRef.current[key] = val; };

  const beat = story ? STORY[story.beat] : null;
  const line = beat ? beat[story.line] : null;
  const spk = line && line.who ? SPEAKERS[line.who] : null;
  const last = beat ? story.line === beat.length - 1 : false;
  const sky = SKIES[levelIndex % SKIES.length];
  const earned = pending ? UPGRADES[Math.min(pending.level, UPGRADES.length - 1)] : null;

  return createPortal(
    <div className="game-overlay" role="dialog" aria-label="Atlas: Scrapheart">
      <div className="game-frame" style={{ "--sky": sky.accent, "--rim": sky.rim }}>
        <div className="game-bar">
          <span className="game-title">
            {won ? "★ FULLY MODIFIED ★" : `ROUND ${levelIndex + 1}/${LEVELS.length} · ${LEVELS[levelIndex].name.toUpperCase()}`}
          </span>
          <span className="game-stats">
            <span style={{ color: sky.accent }}>⚙ {hud.parts}/{LEVELS[levelIndex].gems.length}</span>
            {hud.shield && <span style={{ color: "#fbbf24" }}>◈ PLATE</span>}
            {hud.power && (
              <span style={{ color: POWERS[hud.power].col2 }}>
                {POWERS[hud.power].name} {Math.ceil(hud.powerLeft)}s
              </span>
            )}
            <span style={{ color: "#6b6480" }}>KO {hud.deaths}</span>
          </span>
          <button onClick={onClose} className="game-x" aria-label="Close game">✕</button>
        </div>

        <div className="game-stage">
          <canvas ref={canvasRef} className="game-canvas" />

          {banner && (
            <div className="pw-banner" style={{ "--pw": banner.col, "--pw2": banner.col2 }}>
              <div className="pw-streak" />
              <div className="pw-inner">
                <span className="pw-name">{banner.name}</span>
                <span className="pw-blurb">{banner.blurb}</span>
              </div>
            </div>
          )}

          {story && line && (
            <div className="dlg" onClick={advanceStory}>
              <div className="dlg-box" style={spk ? { "--spk": spk.col } : { "--spk": "#cbd5e1" }}>
                {spk && (
                  <div className="dlg-head">
                    <span className="dlg-portrait" style={{ borderColor: spk.col }}>
                      <CharPortrait id={line.who} col={spk.col} />
                    </span>
                    <span className="dlg-who">{spk.tag}</span>
                  </div>
                )}
                <p className={spk ? "dlg-text" : "dlg-text dlg-text--narrate"}>
                  <Typewriter key={`${story.beat}-${story.line}`} text={line.text} />
                </p>
                <div className="dlg-next">
                  {last && story.beat > 0 && earned
                    ? `▶ INSTALL ${earned.name.toUpperCase()}`
                    : last && story.beat === 0 ? "▶ BEGIN" : "▶ CLICK TO CONTINUE"}
                </div>
              </div>
            </div>
          )}

          {won && (
            <div className="game-modal">
              <p className="game-kicker">ALL SYSTEMS ONLINE</p>
              <h3 className="game-h">ATLAS IS WHOLE</h3>
              <p className="game-sub">
                Every part recovered. The plating, the boosters, the lasers, the core.
                Go look at the dog flying across the Practice tab. That is her, finished.
              </p>
              <button className="game-btn" onClick={restartAll}>RUN IT BACK</button>
            </div>
          )}
        </div>

        <div className="game-help">
          <span><b>←</b> <b>→</b> MOVE</span>
          <span><b>SPACE</b> JUMP{upgrades >= 2 ? " ×2" : ""}</span>
          <span><b>R</b> RETRY</span>
          <span><b>ESC</b> QUIT</span>
        </div>

        <div className="game-touch" aria-hidden="true">
          <button onPointerDown={hold("left", true)} onPointerUp={hold("left", false)} onPointerLeave={hold("left", false)}>←</button>
          <button onPointerDown={hold("right", true)} onPointerUp={hold("right", false)} onPointerLeave={hold("right", false)}>→</button>
          <button className="game-touch-jump" onPointerDown={hold("jump", true)} onPointerUp={hold("jump", false)} onPointerLeave={hold("jump", false)}>JUMP</button>
        </div>
      </div>
    </div>,
    document.body
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
        me what&apos;s annoying, so if something bugs you, say so.
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
            coding, and I wanted to point those skills at something that would
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
          wanted something genuinely <em>useful</em>: a tool you&apos;d actually reach for
          before a tournament, that would make you better at Impromptu instead of
          just counting down at you.
        </p>
        <p className="about-p">
          The first version looked like crap. I&apos;m happy to admit that. But I kept
          upgrading it, and upgrading it, and upgrading it. And now here we are.
          Real difficulty tiers. Reading time you control. Beeps that teach you to
          pace your intro. Recording so you can send a run to Marisa, Tiana, or any
          coach or UGA for feedback. A quote pool that anyone can add to.
        </p>
        <p className="about-p">
          I bought a domain for it, and now I&apos;m trying to get more speech and debate
          teams using it, not just Simpson. If you&apos;re on another team and this is
          useful to you, that&apos;s the whole point. Take it.
        </p>
      </div>

      <div className="card about-card about-next">
        <p className="eyebrow" style={{ marginBottom: "0.5rem", color: "var(--accent-2)" }}>Coming soon</p>
        <h3 className="about-h3">Automatic <span className="grad-text">Extemp practice</span></h3>
        <p className="about-p" style={{ marginBottom: 0 }}>
          I&apos;m building an Extemp mode that pulls from current events and generates
          practice questions automatically. It&apos;ll be the biggest update to this site
          yet, and it&apos;s in the works right now.
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
  const [gameOpen, setGameOpen] = useState(false);
  const [dogCombo, setDogCombo] = useState(0);
  const dogReactTimer = useRef(null);
  const dragonReactTimer = useRef(null);
  const dogComboTimer = useRef(null);
  const dogComboRef = useRef(0);
  const codeRef = useRef("");

  // Kept as a shortcut for anyone who already knows it, but clicking Atlas
  // is the intended way in now.
  useEffect(() => {
    const onKey = (e) => {
      const el = e.target;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.length !== 1) return;
      codeRef.current = (codeRef.current + e.key.toLowerCase()).slice(-SECRET_CODE.length);
      if (codeRef.current === SECRET_CODE) {
        codeRef.current = "";
        setGameOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => () => {
    clearTimeout(dogComboTimer.current);
  }, []);

  // Petting Atlas repeatedly is the real door. Clicking a mascot that already
  // reacts is something people do naturally, and DOG_HINTS escalates so the
  // third and fourth clicks openly tell you to keep going. The combo lapses
  // after a few seconds so ordinary petting never trips it by accident.
  const petDog = () => {
    clearTimeout(dogReactTimer.current);
    clearTimeout(dogComboTimer.current);
    setDogReacting(true);
    setDogReactKey(k => k + 1);
    dogReactTimer.current = setTimeout(() => setDogReacting(false), 1400);

    dogComboRef.current += 1;
    if (dogComboRef.current >= DOG_COMBO_UNLOCK) {
      dogComboRef.current = 0;
      setDogCombo(0);
      setDogReacting(false);
      setGameOpen(true);
      return;
    }
    setDogCombo(dogComboRef.current);
    dogComboTimer.current = setTimeout(() => {
      dogComboRef.current = 0;
      setDogCombo(0);
    }, DOG_COMBO_WINDOW);
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

        /* One thin shockwave, plus a softer echo, not a three-ring pileup. */
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
           Tinted only at its leading edge, with no full-screen white blowout. */
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
           beat plays in the clear, then rushes out and covers by 400ms,
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

        /* Builds while the pet-combo is live, so persisting visibly does
           something before the game ever appears. */
        .mascot--charging {
          animation: mascotCharge 0.9s ease-in-out infinite;
        }
        @keyframes mascotCharge {
          0%, 100% { filter: drop-shadow(0 0 6px #8b5cf6aa); }
          50%      { filter: drop-shadow(0 0 20px #22d3eeee); }
        }

        /* ── Atlas: Scrapheart ──
           A game, not a page. Saturated, high-contrast, loud on purpose,
           and driven by a per-round --sky so all six look different. */
        .game-overlay {
          position: fixed; inset: 0; z-index: 600;
          background: radial-gradient(ellipse at 50% 45%, #1b0a2ef2 0%, #04030af8 72%);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: 1.5rem;
          animation: fadeUp 0.3s ease both;
        }
        .game-frame {
          width: 100%; max-width: 900px;
          background: #08060f;
          border: 2px solid var(--sky, #ffd166);
          border-radius: 8px;
          box-shadow:
            0 0 0 4px #08060f,
            0 0 44px var(--sky, #ffd166),
            0 0 120px color-mix(in srgb, var(--rim, #ff7b54) 45%, transparent),
            0 30px 80px -20px #000;
          overflow: hidden;
          animation: gameIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes gameIn {
          0%   { transform: scale(0.9) rotate(-1deg); opacity: 0; }
          60%  { transform: scale(1.02) rotate(0.3deg); }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
        .game-bar {
          display: flex; align-items: center; gap: 1rem;
          padding: 0.7rem 1rem;
          background: linear-gradient(90deg, #140b26 0%, #23103d 50%, #140b26 100%);
          border-bottom: 2px solid var(--sky, #ffd166);
        }
        .game-title {
          font-family: var(--font-mono); font-size: 0.72rem; font-weight: 700;
          letter-spacing: 0.16em; color: var(--rim, #ffd166);
          text-shadow: 0 0 14px var(--sky, #ffd166);
          flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .game-stats {
          display: flex; gap: 0.8rem;
          font-family: var(--font-mono); font-size: 0.66rem; font-weight: 700;
          letter-spacing: 0.1em; white-space: nowrap;
        }
        .game-x {
          background: #1a0f2e; border: 1px solid var(--sky, #ffd166);
          color: var(--sky, #ffd166); border-radius: 4px;
          width: 26px; height: 26px; cursor: pointer; font-size: 0.7rem; line-height: 1; flex-shrink: 0;
        }
        .game-x:hover { background: var(--sky, #ffd166); color: #08060f; }

        .game-stage { position: relative; background: #08060f; overflow: hidden; }
        .game-canvas { display: block; width: 100%; height: auto; aspect-ratio: 16 / 9; }

        /* ── power-up banner: slams in from the left, holds, slides out ── */
        .pw-banner {
          position: absolute; left: 0; right: 0; top: 34%;
          pointer-events: none;
          animation: pwIn 1.9s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes pwIn {
          0%   { transform: translateX(-120%) skewX(-18deg); opacity: 0; }
          14%  { transform: translateX(0) skewX(-18deg); opacity: 1; }
          20%  { transform: translateX(0) skewX(0deg); }
          78%  { transform: translateX(0) skewX(0deg); opacity: 1; }
          100% { transform: translateX(120%) skewX(14deg); opacity: 0; }
        }
        .pw-streak {
          position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, var(--pw), var(--pw2), var(--pw), transparent);
          opacity: 0.35;
          filter: blur(6px);
        }
        .pw-inner {
          position: relative;
          display: flex; flex-direction: column; align-items: center; gap: 0.15rem;
          padding: 0.7rem 1rem;
          background: linear-gradient(90deg, transparent, #08060fdd 18%, #08060fdd 82%, transparent);
          border-top: 2px solid var(--pw); border-bottom: 2px solid var(--pw);
        }
        .pw-name {
          font-family: var(--font-mono); font-size: clamp(1.3rem, 4.6vw, 2.4rem);
          font-weight: 700; letter-spacing: 0.14em; color: var(--pw2);
          text-shadow: 0 0 10px var(--pw), 0 0 34px var(--pw), 3px 3px 0 #08060f;
        }
        .pw-blurb {
          font-family: var(--font-mono); font-size: 0.62rem;
          letter-spacing: 0.24em; color: var(--pw);
        }

        /* ── dialogue ── */
        .dlg {
          position: absolute; inset: 0;
          display: flex; align-items: flex-end; justify-content: center;
          padding: 1.1rem;
          background: linear-gradient(180deg, #04030a00 40%, #04030acc 100%);
          cursor: pointer;
          animation: fadeUp 0.25s ease both;
        }
        .dlg-box {
          width: 100%; max-width: 640px;
          background: #0b0817ee;
          border: 2px solid var(--spk);
          border-left: 6px solid var(--spk);
          border-radius: 4px;
          padding: 0.9rem 1.1rem 0.7rem;
          box-shadow: 0 0 30px color-mix(in srgb, var(--spk) 40%, transparent);
          animation: dlgIn 0.24s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes dlgIn {
          0%   { transform: translateY(14px) scale(0.98); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        .dlg-head {
          display: flex; align-items: center; gap: 0.6rem;
          margin-bottom: 0.5rem;
        }
        .dlg-portrait {
          flex-shrink: 0;
          width: 44px; height: 44px;
          border: 2px solid var(--spk);
          border-radius: 8px;
          background: #05030c;
          box-shadow: 0 0 16px color-mix(in srgb, var(--spk) 50%, transparent);
          overflow: hidden;
          display: grid; place-items: center;
          animation: portraitPop 0.28s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .dlg-portrait svg { width: 40px; height: 40px; }
        @keyframes portraitPop {
          0%   { transform: scale(0.4) rotate(-8deg); opacity: 0; }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
        .dlg-who {
          font-family: var(--font-mono); font-size: 0.62rem; font-weight: 700;
          letter-spacing: 0.2em; color: var(--spk);
          text-shadow: 0 0 12px var(--spk);
        }
        .dlg-text {
          font-family: var(--font-body); font-size: 0.98rem; line-height: 1.55;
          color: #f2ecff; margin: 0 0 0.5rem; min-height: 2.9em;
        }
        .dlg-text--narrate { font-style: italic; color: #b6aecd; }
        .dlg-caret { color: var(--spk); }
        .dlg-next {
          font-family: var(--font-mono); font-size: 0.58rem;
          letter-spacing: 0.18em; color: var(--spk); text-align: right;
        }

        .game-modal {
          position: absolute; inset: 0;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center; padding: 2rem 1.5rem;
          background: radial-gradient(ellipse at 50% 50%, #2a0a3af2 0%, #04030afa 76%);
          animation: fadeUp 0.3s ease both;
        }
        .game-kicker {
          font-family: var(--font-mono); font-size: 0.62rem;
          letter-spacing: 0.26em; color: var(--rim, #ffd166); margin: 0 0 0.7rem;
        }
        .game-h {
          font-family: var(--font-mono); font-size: clamp(1.3rem, 5vw, 2rem);
          font-weight: 700; letter-spacing: 0.1em; color: #fff;
          text-shadow: 0 0 18px var(--sky, #ffd166), 0 0 50px var(--sky, #ffd166);
          margin: 0 0 0.8rem;
        }
        .game-sub {
          font-family: var(--font-body); font-size: 0.92rem; line-height: 1.6;
          color: #cbc3e0; max-width: 32rem; margin: 0 0 1.6rem;
        }
        .game-btn {
          font-family: var(--font-mono); font-size: 0.72rem; font-weight: 700;
          letter-spacing: 0.16em; padding: 0.9rem 2.2rem; color: #08060f;
          background: linear-gradient(90deg, var(--sky, #ffd166), var(--rim, #ff7b54));
          border: none; border-radius: 4px; cursor: pointer;
          box-shadow: 0 0 30px var(--sky, #ffd166);
          transition: transform 0.12s ease, box-shadow 0.2s ease;
        }
        .game-btn:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 0 50px var(--sky, #ffd166); }
        .game-btn:active { transform: scale(0.96); }

        .game-help {
          display: flex; flex-wrap: wrap; gap: 1.1rem;
          padding: 0.7rem 1rem;
          background: #0b0817; border-top: 2px solid #23103d;
          font-family: var(--font-mono); font-size: 0.62rem;
          letter-spacing: 0.12em; color: #6b6480;
        }
        .game-help b { color: var(--rim, #ffd166); font-weight: 700; }

        .game-touch { display: none; }
        @media (hover: none) and (pointer: coarse) {
          .game-touch {
            display: flex; gap: 0.6rem;
            padding: 0.8rem 1rem 1rem;
            background: #0b0817; border-top: 2px solid #23103d;
          }
          .game-touch button {
            flex: 1; padding: 0.9rem 0;
            font-family: var(--font-mono); font-size: 0.9rem; font-weight: 700;
            color: var(--sky, #ffd166); background: #1a0f2e;
            border: 1px solid var(--sky, #ffd166); border-radius: 4px;
            touch-action: none; user-select: none;
          }
          .game-touch button:active { background: var(--sky, #ffd166); color: #08060f; }
          .game-touch-jump { flex: 1.6 !important; }
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
        {/* Floating glass header: scrolls away with the page, not pinned */}
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
                className={`${dogReacting ? "mascot mascot-pop" : "mascot"}${dogCombo >= 2 ? " mascot--charging" : ""}`}
                style={{ opacity: dogReacting || dogCombo >= 2 ? 1 : 0.55 }}
                role="button"
                aria-label="Pet Atlas"
              >
                <CyborgDog />
                {dogReacting && (
                  <MascotReaction
                    label={DOG_HINTS[Math.min(dogCombo, DOG_HINTS.length - 1)]}
                    emojis={dogCombo >= 3 ? ["✨", "🎮", "⚡"] : ["🦴", "✨", "🐾"]}
                  />
                )}
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

        {gameOpen && <SecretGame onClose={() => setGameOpen(false)} />}

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
