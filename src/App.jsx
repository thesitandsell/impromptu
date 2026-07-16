import { useState, useEffect, useRef, useCallback } from "react";
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
  // Easy
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", difficulty: "Easy" },
  { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein", difficulty: "Easy" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius", difficulty: "Easy" },
  { text: "Life is what happens when you're busy making other plans.", author: "John Lennon", difficulty: "Easy" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", difficulty: "Easy" },
  { text: "It is never too late to be what you might have been.", author: "George Eliot", difficulty: "Easy" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky", difficulty: "Easy" },
  { text: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford", difficulty: "Easy" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb", difficulty: "Easy" },
  { text: "An unexamined life is not worth living.", author: "Socrates", difficulty: "Easy" },
  // Medium
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle", difficulty: "Medium" },
  { text: "The man who does not read has no advantage over the man who cannot read.", author: "Mark Twain", difficulty: "Medium" },
  { text: "It is not the strongest of the species that survives, nor the most intelligent; it is the one most adaptable to change.", author: "Charles Darwin", difficulty: "Medium" },
  { text: "Not everything that is faced can be changed, but nothing can be changed until it is faced.", author: "James Baldwin", difficulty: "Medium" },
  { text: "The measure of intelligence is the ability to change.", author: "Albert Einstein", difficulty: "Medium" },
  { text: "I am not afraid of storms, for I am learning how to sail my ship.", author: "Louisa May Alcott", difficulty: "Medium" },
  { text: "You have enemies? Good. That means you've stood up for something, sometime in your life.", author: "Winston Churchill", difficulty: "Medium" },
  { text: "A people that elect corrupt politicians, imposters, thieves and traitors are not victims... but accomplices.", author: "George Orwell", difficulty: "Medium" },
  { text: "The difference between genius and stupidity is that genius has its limits.", author: "Albert Einstein", difficulty: "Medium" },
  { text: "The only thing necessary for the triumph of evil is for good men to do nothing.", author: "Edmund Burke", difficulty: "Medium" },
  { text: "It's not what you look at that matters, it's what you see.", author: "Henry David Thoreau", difficulty: "Medium" },
  { text: "Two things are infinite: the universe and human stupidity; and I'm not sure about the universe.", author: "Albert Einstein", difficulty: "Medium" },
  // Hard
  { text: "The paradox of our time in history is that we have taller buildings but shorter tempers.", author: "George Carlin", difficulty: "Hard" },
  { text: "We do not inherit the earth from our ancestors; we borrow it from our children.", author: "Antoine de Saint-Exupéry", difficulty: "Hard" },
  { text: "The whole problem with the world is that fools and fanatics are always so certain of themselves, and wiser people so full of doubts.", author: "Bertrand Russell", difficulty: "Hard" },
  { text: "Integrity without knowledge is weak and useless, and knowledge without integrity is dangerous and dreadful.", author: "Samuel Johnson", difficulty: "Hard" },
  { text: "The most courageous act is still to think for yourself. Aloud.", author: "Coco Chanel", difficulty: "Hard" },
  { text: "We are all atheists about most of the gods humanity has ever believed in. Some of us just go one god further.", author: "Richard Dawkins", difficulty: "Hard" },
  { text: "The price of apathy towards public affairs is to be ruled by evil men.", author: "Plato", difficulty: "Hard" },
  { text: "A great many people think they are thinking when they are merely rearranging their prejudices.", author: "William James", difficulty: "Hard" },
  { text: "It is no measure of health to be well adjusted to a profoundly sick society.", author: "Jiddu Krishnamurti", difficulty: "Hard" },
  { text: "The good we secure for ourselves is precarious and uncertain until it is secured for all of us and incorporated into our common life.", author: "Jane Addams", difficulty: "Hard" },
  { text: "Cowardice asks the question: is it safe? Expediency asks the question: is it politic? Vanity asks the question: is it popular? But conscience asks the question: is it right?", author: "Martin Luther King Jr.", difficulty: "Hard" },
  { text: "The unleashed power of the atom has changed everything save our modes of thinking, and we thus drift toward unparalleled catastrophe.", author: "Albert Einstein", difficulty: "Hard" },
  // Insaneo CRAZY
  { text: "Man is the only creature who refuses to be what he is.", author: "Albert Camus", difficulty: "Insaneo CRAZY" },
  { text: "The most dangerous creation of any society is the man who has nothing to lose.", author: "James Baldwin", difficulty: "Insaneo CRAZY" },
  { text: "One does not become enlightened by imagining figures of light, but by making the darkness conscious.", author: "Carl Jung", difficulty: "Insaneo CRAZY" },
  { text: "There is no greater agony than bearing an untold story inside you.", author: "Maya Angelou", difficulty: "Insaneo CRAZY" },
  { text: "Society exists only as a mental concept; in the real world there are only individuals.", author: "Oscar Wilde", difficulty: "Insaneo CRAZY" },
  { text: "The only real prison is fear, and the only real freedom is freedom from fear.", author: "Aung San Suu Kyi", difficulty: "Insaneo CRAZY" },
  { text: "The secret of freedom lies in educating people, whereas the secret of tyranny is in keeping them ignorant.", author: "Maximilien Robespierre", difficulty: "Insaneo CRAZY" },
  { text: "Progress is impossible without change, and those who cannot change their minds cannot change anything.", author: "George Bernard Shaw", difficulty: "Insaneo CRAZY" },
  { text: "If you want to know what a man's like, take a good look at how he treats his inferiors, not his equals.", author: "J.K. Rowling", difficulty: "Insaneo CRAZY" },
  { text: "Washing one's hands of the conflict between the powerful and the powerless means to side with the powerful, not to be neutral.", author: "Paulo Freire", difficulty: "Insaneo CRAZY" },
  { text: "Every gun that is made, every warship launched, every rocket fired signifies, in the final sense, a theft from those who hunger and are not fed.", author: "Dwight D. Eisenhower", difficulty: "Insaneo CRAZY" },
  { text: "The opposite of love is not hate, it's indifference. The opposite of art is not ugliness, it's indifference. The opposite of faith is not heresy, it's indifference.", author: "Elie Wiesel", difficulty: "Insaneo CRAZY" },
  { text: "All that is necessary to raise imbecility into what the mob calls genius is to develop initiative, imagination, and the courage to stand by one's convictions.", author: "H.L. Mencken", difficulty: "Insaneo CRAZY" },
  { text: "The distinction between past, present, and future is only a stubbornly persistent illusion.", author: "Albert Einstein", difficulty: "Insaneo CRAZY" },
  { text: "A civilization is judged not by how it treats its most powerful, but by how it treats its most vulnerable.", author: "Mahatma Gandhi", difficulty: "Insaneo CRAZY" },
];

const DIFFICULTY_CONFIG = {
  Easy: { color: "#4ade80", glow: "#4ade8040" },
  Medium: { color: "#facc15", glow: "#facc1540" },
  Hard: { color: "#f97316", glow: "#f9731640" },
  "Insaneo CRAZY": { color: "#e879f9", glow: "#e879f940" },
  Random: { color: "#60a5fa", glow: "#60a5fa40" },
};

const PHASES = {
  IDLE: "IDLE",
  BUFFER: "BUFFER",
  READING: "READING",
  SPEAKING: "SPEAKING",
  DONE: "DONE",
  REVIEW: "REVIEW",
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

function CyborgDog() {
  const tan = "#C9844B", dkTan = "#9A6030", metal = "#7A99BB", dkMetal = "#3A5570";
  const legXs = [56, 76, 116, 136];
  return (
    <svg width="210" height="160" viewBox="0 0 210 160" style={{ overflow: "visible" }}>
      {/* LEFT LASER */}
      <line x1="40" y1="82" x2="-600" y2="82" stroke="#FF2222" strokeWidth="3" strokeLinecap="round">
        <animate attributeName="opacity" values="0;0;1;1;1;0" dur="2.8s" repeatCount="indefinite" />
      </line>
      <line x1="40" y1="82" x2="-600" y2="82" stroke="#FF000033" strokeWidth="14" strokeLinecap="round">
        <animate attributeName="opacity" values="0;0;1;1;1;0" dur="2.8s" repeatCount="indefinite" />
      </line>
      {/* RIGHT LASER */}
      <line x1="152" y1="82" x2="800" y2="82" stroke="#FF2222" strokeWidth="3" strokeLinecap="round">
        <animate attributeName="opacity" values="0;0;1;1;1;0" dur="2.8s" repeatCount="indefinite" begin="1.4s" />
      </line>
      <line x1="152" y1="82" x2="800" y2="82" stroke="#FF000033" strokeWidth="14" strokeLinecap="round">
        <animate attributeName="opacity" values="0;0;1;1;1;0" dur="2.8s" repeatCount="indefinite" begin="1.4s" />
      </line>

      {/* TAIL — fishhook */}
      <path d="M43,82 Q16,62 22,42 Q28,24 46,34" stroke={dkTan} strokeWidth="13" strokeLinecap="round" fill="none" />
      <path d="M43,82 Q16,62 22,42 Q28,24 46,34" stroke={tan} strokeWidth="8" strokeLinecap="round" fill="none" />

      {/* BODY */}
      <ellipse cx="97" cy="82" rx="58" ry="27" fill={tan} />

      {/* NECK */}
      <ellipse cx="146" cy="72" rx="19" ry="16" fill={tan} />

      {/* HEAD */}
      <ellipse cx="160" cy="59" rx="29" ry="24" fill={tan} />

      {/* SNOUT */}
      <ellipse cx="181" cy="67" rx="15" ry="10" fill={dkTan} />
      <ellipse cx="193" cy="68" rx="5" ry="4" fill="#1A0800" />
      <circle cx="192" cy="66.5" r="1.5" fill="white" opacity="0.55" />

      {/* EARS */}
      <polygon points="141,50 149,22 161,50" fill={dkTan} />
      <polygon points="142,50 149,29 159,50" fill="#EAA07888" />
      <polygon points="158,47 166,19 175,47" fill={dkTan} />
      <polygon points="159,47 166,25 174,47" fill="#EAA07888" />

      {/* METAL ARMOR PLATE */}
      <rect x="50" y="68" width="52" height="27" rx="5" fill={metal} />
      <rect x="50" y="68" width="52" height="8" rx="4" fill={dkMetal} />
      <line x1="50" y1="81.5" x2="102" y2="81.5" stroke={dkMetal} strokeWidth="1.5" />
      <line x1="76" y1="68" x2="76" y2="95" stroke={dkMetal} strokeWidth="1.5" />
      <circle cx="57" cy="73" r="2.5" fill={dkMetal} />
      <circle cx="95" cy="73" r="2.5" fill={dkMetal} />
      <circle cx="57" cy="89" r="2.5" fill={dkMetal} />
      <circle cx="95" cy="89" r="2.5" fill={dkMetal} />

      {/* LASER EMITTER PORTS */}
      <circle cx="40" cy="82" r="7" fill={dkMetal} />
      <circle cx="40" cy="82" r="4.5" fill="#FF1111"><animate attributeName="opacity" values="0.45;1;0.45" dur="2.8s" repeatCount="indefinite" /></circle>
      <circle cx="40" cy="82" r="2" fill="#FF9999"><animate attributeName="opacity" values="0.6;1;0.6" dur="2.8s" repeatCount="indefinite" /></circle>
      <circle cx="152" cy="82" r="7" fill={dkMetal} />
      <circle cx="152" cy="82" r="4.5" fill="#FF1111"><animate attributeName="opacity" values="0.45;1;0.45" dur="2.8s" repeatCount="indefinite" begin="1.4s" /></circle>
      <circle cx="152" cy="82" r="2" fill="#FF9999"><animate attributeName="opacity" values="0.6;1;0.6" dur="2.8s" repeatCount="indefinite" begin="1.4s" /></circle>

      {/* NORMAL EYE */}
      <ellipse cx="173" cy="56" rx="5.5" ry="5" fill="#1A0800" />
      <circle cx="174.5" cy="54.5" r="1.5" fill="white" />

      {/* CYBORG EYE */}
      <circle cx="150" cy="57" r="9.5" fill="#0A0A0A" />
      <circle cx="150" cy="57" r="7.5" fill="#880000" />
      <circle cx="150" cy="57" r="5" fill="#CC0000" />
      <circle cx="150" cy="57" r="2.5" fill="#FF4444" />
      <circle cx="151" cy="56" r="1.2" fill="white" opacity="0.9" />
      <circle cx="150" cy="57" r="9.5" stroke={metal} strokeWidth="1.5" fill="none" />
      <circle cx="150" cy="57" r="14" fill="#FF000012">
        <animate attributeName="r" values="11;15;11" dur="1.3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0.75;0.4" dur="1.3s" repeatCount="indefinite" />
      </circle>

      {/* MOUTH */}
      <path d="M179,75 Q185,79 189,75" stroke="#1A0800" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* LEGS */}
      {legXs.map((x, i) => (
        <rect key={i} x={x - 7} y={104} width="13" height="22" rx="4" fill={dkTan} />
      ))}

      {/* ROCKET BOOSTERS */}
      {legXs.map((cx, i) => (
        <g key={i}>
          <rect x={cx - 8} y={123} width="16" height="11" rx="3" fill={metal} />
          <rect x={cx - 8} y={123} width="16" height="4" rx="2" fill={dkMetal} />
          <path d={`M${cx-6},134 L${cx-9},138 L${cx+9},138 L${cx+6},134 Z`} fill="#445566" />
          {/* Outer flame */}
          <ellipse cx={cx} cy={145} rx="8" ry="12">
            <animate attributeName="fill" values="#FF5500;#FF8800;#FF3300;#FF7700" dur="0.13s" repeatCount="indefinite" />
            <animate attributeName="ry" values="12;16;9;14;12" dur="0.13s" repeatCount="indefinite" />
          </ellipse>
          {/* Mid flame */}
          <ellipse cx={cx} cy={143} rx="5" ry="7">
            <animate attributeName="fill" values="#FFCC00;#FFEE00;#FF9900;#FFDD00" dur="0.13s" repeatCount="indefinite" />
            <animate attributeName="ry" values="7;10;5;9;7" dur="0.13s" repeatCount="indefinite" />
          </ellipse>
          {/* White core */}
          <ellipse cx={cx} cy={140} rx="2.5" ry="3" fill="white" opacity="0.88" />
        </g>
      ))}
    </svg>
  );
}

function ImprovDragon() {
  const body = "#2E7D32", dark = "#1B5E20", mid = "#4CAF50";
  const gold = "#FFD700", dkGold = "#B8960C";
  const wingMem = "#388E3C";

  return (
    <svg width="270" height="230" viewBox="0 0 270 230" style={{ overflow: "visible" }}>
      {/* LEFT WING */}
      <path d="M108,100 Q68,55 25,32 Q48,72 80,94 Q94,100 108,100 Z" fill={wingMem} stroke={dark} strokeWidth="1.5" />
      <line x1="108" y1="100" x2="25" y2="32" stroke={dark} strokeWidth="1" opacity="0.55" />
      <line x1="103" y1="95" x2="55" y2="56" stroke={dark} strokeWidth="1" opacity="0.35" />
      <line x1="97"  y1="91" x2="72" y2="70" stroke={dark} strokeWidth="1" opacity="0.35" />

      {/* RIGHT WING */}
      <path d="M162,100 Q202,55 248,28 Q228,68 196,93 Q179,100 162,100 Z" fill={wingMem} stroke={dark} strokeWidth="1.5" />
      <line x1="162" y1="100" x2="248" y2="28" stroke={dark} strokeWidth="1" opacity="0.55" />
      <line x1="167" y1="95" x2="218" y2="52" stroke={dark} strokeWidth="1" opacity="0.35" />
      <line x1="172" y1="91" x2="204" y2="68" stroke={dark} strokeWidth="1" opacity="0.35" />

      {/* TAIL */}
      <path d="M92,115 Q45,125 26,104 Q8,82 18,56 Q28,32 46,42"
        stroke={dark} strokeWidth="17" fill="none" strokeLinecap="round" />
      <path d="M92,115 Q45,125 26,104 Q8,82 18,56 Q28,32 46,42"
        stroke={body} strokeWidth="11" fill="none" strokeLinecap="round" />
      {/* Tail spike */}
      <polygon points="44,40 38,28 57,38" fill={gold} stroke={dkGold} strokeWidth="1" />

      {/* BODY */}
      <ellipse cx="135" cy="115" rx="55" ry="32" fill={body} />
      <ellipse cx="135" cy="120" rx="38" ry="20" fill={mid} opacity="0.3" />

      {/* NECK */}
      <ellipse cx="174" cy="99" rx="20" ry="18" fill={body} />

      {/* HEAD */}
      <ellipse cx="196" cy="82" rx="30" ry="24" fill={body} />

      {/* SNOUT */}
      <ellipse cx="218" cy="89" rx="17" ry="11" fill={dark} />
      <ellipse cx="233" cy="90" rx="5" ry="4" fill="#0A150A" />
      <circle cx="232" cy="88.5" r="1.5" fill="white" opacity="0.45" />

      {/* HORNS */}
      <path d="M186,65 L178,37 L192,63 Z" fill={gold} stroke={dkGold} strokeWidth="1" />
      <path d="M202,61 L197,32 L210,58 Z" fill={gold} stroke={dkGold} strokeWidth="1" />

      {/* EYE */}
      <ellipse cx="212" cy="79" rx="7.5" ry="6.5" fill="#FF8C00" />
      <ellipse cx="212" cy="79" rx="4.5" ry="5.5" fill="#1A0A00" />
      <circle cx="213" cy="77.5" r="1.5" fill="white" opacity="0.65" />
      <ellipse cx="212" cy="79" rx="10" ry="9" fill="#FF8C0014">
        <animate attributeName="rx" values="8;12;8" dur="2.2s" repeatCount="indefinite" />
        <animate attributeName="ry" values="7;11;7" dur="2.2s" repeatCount="indefinite" />
      </ellipse>

      {/* MOUTH — grin */}
      <path d="M218,94 Q227,101 234,95" stroke="#0A150A" strokeWidth="2" fill="none" strokeLinecap="round" />
      <polygon points="221,96 224,103 227,96" fill="white" />
      <polygon points="228,95 231,102 234,95" fill="white" />

      {/* CLAWS */}
      <path d="M150,141 L144,154 M150,141 L149,155 M150,141 L155,153" stroke={dark} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M115,141 L109,154 M115,141 L114,155 M115,141 L120,153" stroke={dark} strokeWidth="2.5" strokeLinecap="round" />

      {/* CHAIN — dashed gold line from neck to medallion */}
      <path d="M183,113 Q180,135 177,158 Q175,172 170,182"
        stroke={gold} strokeWidth="5" fill="none" strokeLinecap="round"
        strokeDasharray="9,6" />

      {/* MEDALLION */}
      <rect x="60" y="182" width="210" height="54" rx="11" fill="#180E06" stroke={gold} strokeWidth="2.5" />
      <rect x="63" y="185" width="204" height="48" rx="9" fill="none" stroke={dkGold} strokeWidth="1" opacity="0.5" />
      {/* chain connects */}
      <line x1="170" y1="182" x2="170" y2="182" stroke={gold} strokeWidth="4" />
      <text x="165" y="204" textAnchor="middle"
        fill={gold} fontFamily="Georgia, serif" fontSize="11.5" fontWeight="bold" letterSpacing="0.6">
        The dragon who always wins
      </text>
      <text x="165" y="222" textAnchor="middle"
        fill={gold} fontFamily="Georgia, serif" fontSize="11.5" fontWeight="bold" letterSpacing="0.6">
        Duo Improv
      </text>
      {/* Medallion shine flicker */}
      <ellipse cx="80" cy="198" rx="9" ry="5" fill={gold} opacity="0.12" />
    </svg>
  );
}

const COACHES = ["Marisa", "Tiana", "Peter"];

function ReviewScreen({ blob, quote, onReset }) {
  const [studentName, setStudentName] = useState("");
  const [selectedCoaches, setSelectedCoaches] = useState([COACHES[0]]);
  const videoUrl = blob ? URL.createObjectURL(blob) : null;

  const toggleCoach = (c) => {
    setSelectedCoaches(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );
  };

  const selectAll = () => setSelectedCoaches([...COACHES]);
  const allSelected = selectedCoaches.length === COACHES.length;

  const handleDownload = () => {
    if (!blob) return;
    const name = studentName.trim() || "student";
    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = `${name.replace(/\s+/g, "-")}-impromptu-${Date.now()}.webm`;
    a.click();
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", animation: "fadeUp 0.6s ease both" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{
          fontFamily: "'Space Mono', monospace", fontSize: "0.75rem",
          letterSpacing: "0.2em", textTransform: "uppercase", color: "#4ade80", marginBottom: "0.5rem",
        }}>
          ✓ Speech Complete
        </div>
        <h2 style={{
          fontFamily: "'Crimson Text', Georgia, serif", fontSize: "2rem",
          color: "#f0e8d0", fontWeight: 400, marginBottom: "0.4rem",
        }}>
          Nice work. Review your recording.
        </h2>
        <p style={{ color: "#5a5040", fontFamily: "'Crimson Text', Georgia, serif", fontSize: "1rem", fontStyle: "italic" }}>
          Watch it back, then download and send to your coach.
        </p>
      </div>

      {/* Video Player */}
      <div style={{
        background: "#060504", borderRadius: "8px", overflow: "hidden",
        border: "1px solid #2a2010", marginBottom: "1.5rem",
        boxShadow: "0 0 40px #00000060",
      }}>
        {videoUrl ? (
          <video
            src={videoUrl}
            controls
            style={{ width: "100%", display: "block", maxHeight: 380, background: "#000" }}
          />
        ) : (
          <div style={{ padding: "3rem", textAlign: "center", color: "#5a5040", fontFamily: "'Space Mono', monospace", fontSize: "0.8rem" }}>
            Recording not available — camera may have been blocked.
          </div>
        )}
      </div>

      {/* Quote reminder */}
      {quote && (
        <div style={{
          background: "#0f0d08", border: "1px solid #2a2010", borderRadius: "6px",
          padding: "1rem 1.5rem", marginBottom: "1.5rem",
        }}>
          <p style={{ fontFamily: "'Crimson Text', Georgia, serif", fontSize: "1rem", color: "#9a8a6a", fontStyle: "italic", margin: 0 }}>
            "{quote.text}" — {quote.author}
          </p>
        </div>
      )}

      {/* Student Info */}
      <div style={{
        background: "#0f0d08", border: "1px solid #2a2010", borderRadius: "8px",
        padding: "1.5rem", marginBottom: "1.5rem",
      }}>
        <div style={{ marginBottom: "1.2rem" }}>
          <label style={reviewLabelStyle}>Your Name</label>
          <input
            type="text"
            value={studentName}
            onChange={e => setStudentName(e.target.value)}
            placeholder="e.g. Edward Kent"
            style={{ ...reviewInputStyle }}
          />
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <label style={reviewLabelStyle}>Send To Coach</label>
            <button
              onClick={selectAll}
              style={{
                background: allSelected ? "#e8c97a22" : "transparent",
                color: allSelected ? "#e8c97a" : "#5a5040",
                border: `1px solid ${allSelected ? "#e8c97a" : "#3a2f00"}`,
                borderRadius: "3px",
                fontFamily: "'Space Mono', monospace",
                fontSize: "0.62rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "0.25rem 0.6rem",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {allSelected ? "✓ All Selected" : "Select All"}
            </button>
          </div>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            {COACHES.map(c => {
              const active = selectedCoaches.includes(c);
              return (
                <button
                  key={c}
                  onClick={() => toggleCoach(c)}
                  style={{
                    padding: "0.5rem 1.1rem",
                    background: active ? "#e8c97a" : "transparent",
                    color: active ? "#0a0a0a" : "#9a8a6a",
                    border: `1.5px solid ${active ? "#e8c97a" : "#3a2f00"}`,
                    borderRadius: "4px",
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    letterSpacing: "0.04em",
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <button
          onClick={handleDownload}
          disabled={!blob}
          style={{
            flex: 1,
            padding: "0.9rem",
            background: blob ? "#e8c97a" : "#2a2010",
            color: blob ? "#0a0a0a" : "#5a5040",
            border: "none",
            borderRadius: "4px",
            fontFamily: "'Space Mono', monospace",
            fontSize: "0.82rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: blob ? "pointer" : "not-allowed",
            boxShadow: blob ? "0 0 20px #e8c97a20" : "none",
            transition: "all 0.2s",
          }}
        >
          ↓ Download Recording
        </button>
        <button
          onClick={onReset}
          style={{
            padding: "0.9rem 1.5rem",
            background: "transparent",
            color: "#5a5040",
            border: "1px solid #2a2010",
            borderRadius: "4px",
            fontFamily: "'Space Mono', monospace",
            fontSize: "0.82rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.target.style.color = "#e8c97a"; e.target.style.borderColor = "#e8c97a"; }}
          onMouseLeave={e => { e.target.style.color = "#5a5040"; e.target.style.borderColor = "#2a2010"; }}
        >
          ← New Session
        </button>
      </div>

      <p style={{
        marginTop: "1rem", textAlign: "center",
        fontFamily: "'Crimson Text', Georgia, serif", fontSize: "0.9rem",
        color: "#3a3020", fontStyle: "italic",
      }}>
        Download your recording and send it to {selectedCoaches.length === 0 ? "your coach" : selectedCoaches.join(", ")} for feedback.
      </p>
    </div>
  );
}

const reviewLabelStyle = {
  display: "block",
  fontFamily: "'Space Mono', monospace",
  fontSize: "0.68rem",
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  color: "#9a8a6a",
  marginBottom: "0.5rem",
};

const reviewInputStyle = {
  width: "100%",
  background: "#060504",
  border: "1px solid #2a2010",
  borderRadius: "4px",
  padding: "0.75rem 1rem",
  color: "#f0e8d0",
  fontFamily: "'Crimson Text', Georgia, serif",
  fontSize: "1.05rem",
  outline: "none",
  boxSizing: "border-box",
};

function PracticeTab({ allQuotes, onPhaseChange }) {
  const [difficulty, setDifficulty] = useState("Random");
  const [phase, setPhase] = useState(PHASES.IDLE);
  const [countdown, setCountdown] = useState(0);
  const [currentQuote, setCurrentQuote] = useState(null);
  const [recordingBlob, setRecordingBlob] = useState(null);
  const [cameraError, setCameraError] = useState(false);

  const intervalRef = useRef(null);
  const phaseRef = useRef(phase);
  const lastQuoteRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const liveVideoRef = useRef(null);
  phaseRef.current = phase;

  // Start camera as soon as component mounts so preview is ready
  useEffect(() => {
    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = stream;
        }
      } catch (e) {
        setCameraError(true);
      }
    }
    initCamera();
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  // Attach stream to video element once ref is ready
  useEffect(() => {
    if (liveVideoRef.current && streamRef.current) {
      liveVideoRef.current.srcObject = streamRef.current;
    }
  });

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const options = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? { mimeType: "video/webm;codecs=vp9" }
      : MediaRecorder.isTypeSupported("video/webm")
      ? { mimeType: "video/webm" }
      : {};
    const recorder = new MediaRecorder(streamRef.current, options);
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setRecordingBlob(blob);
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

  const startCountdown = useCallback((seconds, onDone) => {
    clearTimer();
    setCountdown(seconds);
    let remaining = seconds;
    intervalRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        onDone();
      }
    }, 1000);
  }, []);

  const startSession = () => {
    const quote = getRandomQuote(difficulty, allQuotes, lastQuoteRef.current);
    lastQuoteRef.current = quote.text;
    onPhaseChange && onPhaseChange("ACTIVE");
    setCurrentQuote(quote);
    setRecordingBlob(null);
    setPhase(PHASES.BUFFER);
    startCountdown(10, () => {
      setPhase(PHASES.READING);
      startCountdown(10, () => {
        setPhase(PHASES.SPEAKING);
        startRecording();
        startCountdown(420, () => {
          stopRecording();
          setPhase(PHASES.DONE);
          setTimeout(() => setPhase(PHASES.REVIEW), 1500);
        });
      });
    });
  };

  const reset = () => {
    clearTimer();
    stopRecording();
    setPhase(PHASES.IDLE);
    setCurrentQuote(null);
    setCountdown(0);
    setRecordingBlob(null);
    onPhaseChange && onPhaseChange("IDLE");
  };

  useEffect(() => () => clearTimer(), []);

  const diffColor = DIFFICULTY_CONFIG[difficulty]?.color || "#fff";

  const phaseLabel = {
    [PHASES.BUFFER]: "GET READY",
    [PHASES.READING]: "READ YOUR QUOTE",
    [PHASES.SPEAKING]: "SPEAKING",
    [PHASES.DONE]: "TIME'S UP",
  }[phase] || "";

  const isUrgent = phase === PHASES.SPEAKING && countdown <= 30;
  const isMedium = phase === PHASES.SPEAKING && countdown <= 60 && countdown > 30;

  const timerColor = isUrgent ? "#ef4444" : isMedium ? "#f97316" : "#e8c97a";

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1.5rem" }}>
      {/* Difficulty Selector */}
      {phase === PHASES.IDLE && (
        <div style={{ marginBottom: "3rem", animation: "fadeUp 0.6s ease both" }}>
          <p style={{ fontFamily: "'Crimson Text', Georgia, serif", color: "#9a8a6a", fontSize: "1rem", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "1.2rem", textAlign: "center" }}>
            Select Difficulty
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
            {Object.keys(DIFFICULTY_CONFIG).map((d) => {
              const active = difficulty === d;
              const cfg = DIFFICULTY_CONFIG[d];
              return (
                <button
                  key={d}
                  className="diff-btn"
                  onClick={() => setDifficulty(d)}
                  style={{
                    padding: "0.6rem 1.4rem",
                    background: active ? cfg.color : "transparent",
                    color: active ? "#0a0a0a" : cfg.color,
                    border: `1.5px solid ${cfg.color}`,
                    borderRadius: "4px",
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    letterSpacing: "0.05em",
                    transition: "all 0.2s",
                    boxShadow: active ? `0 0 18px ${cfg.glow}` : "none",
                    textTransform: "uppercase",
                  }}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Area */}
      {phase === PHASES.IDLE ? (
        <div style={{ textAlign: "center", animation: "fadeUp 0.8s ease 0.2s both" }}>
          <div style={{
            width: 200, height: 200, borderRadius: "50%", margin: "0 auto 3rem",
            background: "radial-gradient(circle, #2a1f00 0%, #0a0a0a 70%)",
            border: "1px solid #3a2f00",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 60px #e8c97a18, inset 0 0 40px #00000080",
            position: "relative",
          }}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="30" stroke="#e8c97a" strokeWidth="1" opacity="0.3" />
              <path d="M26 20 L26 44 L48 32 Z" fill="#e8c97a" opacity="0.8" />
            </svg>
          </div>
          <button
            onClick={startSession}
            style={{
              padding: "1.1rem 3.5rem",
              background: "#e8c97a",
              color: "#0a0a0a",
              border: "none",
              borderRadius: "4px",
              fontFamily: "'Space Mono', monospace",
              fontSize: "1rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: "0 0 30px #e8c97a30",
            }}
            onMouseEnter={e => e.target.style.boxShadow = "0 0 50px #e8c97a60"}
            onMouseLeave={e => e.target.style.boxShadow = "0 0 30px #e8c97a30"}
          >
            Start Session
          </button>
          <p style={{ marginTop: "1.5rem", fontFamily: "'Crimson Text', Georgia, serif", color: "#5a5040", fontSize: "0.95rem", fontStyle: "italic" }}>
            {difficulty === "Random" ? "Any difficulty" : `${difficulty} quotes only`} · {allQuotes.filter(q => difficulty === "Random" || q.difficulty === difficulty).length} available
          </p>
        </div>
      ) : (
        <div style={{ textAlign: "center" }}>
          {/* Phase Label */}
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "0.75rem",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: phase === PHASES.DONE ? "#e8c97a" : isUrgent ? "#ef4444" : "#9a8a6a",
            marginBottom: "2rem",
            animation: "pulse 1s ease infinite",
          }}>
            {phaseLabel}
          </div>

          {/* Timer Ring */}
          {phase !== PHASES.DONE && (
            <div className="timer-ring" style={{
              width: 220, height: 220, margin: "0 auto 2.5rem",
              borderRadius: "50%",
              background: "radial-gradient(circle, #1a1205 0%, #0a0a0a 70%)",
              border: `2px solid ${timerColor}22`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 0 60px ${timerColor}20, inset 0 0 30px #00000060`,
              position: "relative",
            }}>
              <span className={phase === PHASES.BUFFER || phase === PHASES.READING ? "timer-text-big" : "timer-text-small"} style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: phase === PHASES.BUFFER || phase === PHASES.READING ? "5rem" : "3.8rem",
                fontWeight: 700,
                color: timerColor,
                letterSpacing: "-0.02em",
                textShadow: `0 0 30px ${timerColor}80`,
                transition: "color 0.5s",
              }}>
                {phase === PHASES.BUFFER || phase === PHASES.READING ? countdown : formatTime(countdown)}
              </span>
            </div>
          )}

          {/* Quote Display */}
          {(phase === PHASES.READING || phase === PHASES.SPEAKING || phase === PHASES.DONE) && currentQuote && (
            <div className="quote-box" style={{
              background: "#0f0d08",
              border: "1px solid #2a2010",
              borderRadius: "8px",
              padding: "2.5rem 2rem",
              marginBottom: "2rem",
              animation: "fadeUp 0.5s ease both",
              boxShadow: "0 0 40px #00000060, inset 0 0 30px #0a080400",
              position: "relative",
            }}>
              <div style={{ color: "#e8c97a", fontSize: "4rem", lineHeight: 0.5, fontFamily: "Georgia, serif", opacity: 0.4, marginBottom: "0.5rem" }}>"</div>
              <p className="quote-text" style={{
                fontFamily: "'Crimson Text', Georgia, serif",
                fontSize: "1.55rem",
                lineHeight: 1.6,
                color: "#f0e8d0",
                fontStyle: "italic",
                margin: "0 0 1.5rem",
              }}>
                {currentQuote.text}
              </p>
              <p style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "0.8rem",
                color: "#9a8a6a",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}>
                — {currentQuote.author}
              </p>
              <div style={{
                position: "absolute", top: "1rem", right: "1rem",
                padding: "0.25rem 0.6rem",
                background: `${DIFFICULTY_CONFIG[currentQuote.difficulty]?.color}18`,
                border: `1px solid ${DIFFICULTY_CONFIG[currentQuote.difficulty]?.color}50`,
                borderRadius: "3px",
                fontFamily: "'Space Mono', monospace",
                fontSize: "0.65rem",
                color: DIFFICULTY_CONFIG[currentQuote.difficulty]?.color,
                letterSpacing: "0.05em",
              }}>
                {currentQuote.difficulty}
              </div>
            </div>
          )}

          {phase === PHASES.DONE && (
            <div style={{ animation: "fadeUp 0.5s ease both", textAlign: "center" }}>
              <p style={{
                fontFamily: "'Crimson Text', Georgia, serif",
                fontSize: "1.3rem",
                color: "#e8c97a",
                fontStyle: "italic",
                marginBottom: "2rem",
              }}>
                Time's up. Processing your recording...
              </p>
            </div>
          )}

          {/* REVIEW SCREEN */}
          {phase === PHASES.REVIEW && (
            <ReviewScreen
              blob={recordingBlob}
              quote={currentQuote}
              onReset={reset}
            />
          )}

          {/* Live Camera Preview — shown during session, hidden on IDLE/REVIEW */}
          {phase !== PHASES.IDLE && phase !== PHASES.REVIEW && (
            <div style={{
              position: "fixed", bottom: "1.5rem", right: "1.5rem",
              width: 180, borderRadius: "8px", overflow: "hidden",
              border: phase === PHASES.SPEAKING ? "2px solid #ef4444" : "2px solid #3a2f00",
              boxShadow: phase === PHASES.SPEAKING ? "0 0 20px #ef444440" : "0 0 12px #00000080",
              zIndex: 50,
              background: "#0a0a08",
            }}>
              {phase === PHASES.SPEAKING && (
                <div style={{
                  position: "absolute", top: 6, left: 8, zIndex: 10,
                  display: "flex", alignItems: "center", gap: 5,
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%", background: "#ef4444",
                    animation: "pulse 1s ease infinite",
                  }} />
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.6rem", color: "#ef4444", letterSpacing: "0.1em" }}>REC</span>
                </div>
              )}
              {cameraError ? (
                <div style={{ padding: "1rem", textAlign: "center", color: "#5a5040", fontFamily: "'Space Mono', monospace", fontSize: "0.65rem" }}>
                  Camera unavailable
                </div>
              ) : (
                <video
                  ref={liveVideoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{ width: "100%", display: "block", transform: "scaleX(-1)" }}
                />
              )}
            </div>
          )}

          {/* Progress Indicator for Speaking */}
          {phase === PHASES.SPEAKING && (
            <div style={{ margin: "0 auto 2rem", maxWidth: 400 }}>
              <div style={{ height: 3, background: "#1a1a1a", borderRadius: 2, overflow: "hidden" }}>
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

          {phase !== PHASES.REVIEW && (
          <button
            onClick={reset}
            style={{
              padding: "0.65rem 2rem",
              background: "transparent",
              color: "#5a5040",
              border: "1px solid #2a2010",
              borderRadius: "4px",
              fontFamily: "'Space Mono', monospace",
              fontSize: "0.75rem",
              letterSpacing: "0.1em",
              cursor: "pointer",
              textTransform: "uppercase",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.target.style.color = "#e8c97a"; e.target.style.borderColor = "#e8c97a"; }}
            onMouseLeave={e => { e.target.style.color = "#5a5040"; e.target.style.borderColor = "#2a2010"; }}
          >
            ← Reset
          </button>
          )}
        </div>
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
      setError("Failed to save. Check your connection and try again.");
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1.5rem", animation: "fadeUp 0.6s ease both" }}>
      <div className="submit-card" style={{
        background: "#0f0d08",
        border: "1px solid #2a2010",
        borderRadius: "8px",
        padding: "2.5rem",
        boxShadow: "0 0 40px #00000060",
      }}>
        <h2 style={{
          fontFamily: "'Crimson Text', Georgia, serif",
          fontSize: "1.8rem",
          color: "#e8c97a",
          fontWeight: 400,
          marginBottom: "0.4rem",
        }}>
          Contribute a Quotation
        </h2>
        <p style={{ fontFamily: "'Crimson Text', Georgia, serif", color: "#5a5040", fontSize: "1rem", fontStyle: "italic", marginBottom: "2rem" }}>
          Help grow the practice pool for everyone.
        </p>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={labelStyle}>The Quotation</label>
          <textarea
            value={form.text}
            onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
            placeholder="Enter the full quotation..."
            rows={4}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={labelStyle}>Who Said It</label>
          <input
            type="text"
            value={form.author}
            onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
            placeholder="e.g. Maya Angelou"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <label style={labelStyle}>Difficulty</label>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            {["Easy", "Medium", "Hard", "Insaneo CRAZY"].map(d => {
              const active = form.difficulty === d;
              const cfg = DIFFICULTY_CONFIG[d];
              return (
                <button
                  key={d}
                  onClick={() => setForm(f => ({ ...f, difficulty: d }))}
                  style={{
                    padding: "0.5rem 1.1rem",
                    background: active ? cfg.color : "transparent",
                    color: active ? "#0a0a0a" : cfg.color,
                    border: `1.5px solid ${cfg.color}`,
                    borderRadius: "4px",
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    transition: "all 0.2s",
                    boxShadow: active ? `0 0 14px ${cfg.glow}` : "none",
                  }}
                >
                  {d}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: "0.75rem" }}>
            {["Easy", "Medium", "Hard", "Insaneo CRAZY"].map(d => (
              <p key={d} style={{ color: "#4a4030", fontFamily: "'Crimson Text', Georgia, serif", fontSize: "0.85rem", margin: "0.2rem 0" }}>
                <span style={{ color: DIFFICULTY_CONFIG[d].color, fontWeight: 700 }}>{d}</span>{" "}
                {{
                  Easy: "— Straightforward, motivational, universally relatable.",
                  Medium: "— Requires some unpacking. Good for building comfort.",
                  Hard: "— Dense, philosophical, or politically charged.",
                  "Insaneo CRAZY": "— Paradoxical, provocative, or highly abstract.",
                }[d]}
              </p>
            ))}
          </div>
        </div>

        {error && (
          <p style={{ color: "#ef4444", fontFamily: "'Space Mono', monospace", fontSize: "0.78rem", marginBottom: "1rem" }}>
            ⚠ {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            width: "100%",
            padding: "0.9rem",
            background: submitted ? "#1a3a1a" : saving ? "#2a2010" : "#e8c97a",
            color: submitted ? "#4ade80" : saving ? "#9a8a6a" : "#0a0a0a",
            border: submitted ? "1px solid #4ade80" : "none",
            borderRadius: "4px",
            fontFamily: "'Space Mono', monospace",
            fontSize: "0.85rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: saving ? "not-allowed" : "pointer",
            transition: "all 0.3s",
            boxShadow: submitted ? "0 0 20px #4ade8030" : saving ? "none" : "0 0 20px #e8c97a20",
          }}
        >
          {submitted ? "✓ Added to the Pool!" : saving ? "Saving..." : "Submit Quotation"}
        </button>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontFamily: "'Space Mono', monospace",
  fontSize: "0.7rem",
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  color: "#9a8a6a",
  marginBottom: "0.6rem",
};

const inputStyle = {
  width: "100%",
  background: "#060504",
  border: "1px solid #2a2010",
  borderRadius: "4px",
  padding: "0.85rem 1rem",
  color: "#f0e8d0",
  fontFamily: "'Crimson Text', Georgia, serif",
  fontSize: "1.05rem",
  outline: "none",
  resize: "vertical",
  boxSizing: "border-box",
  transition: "border-color 0.2s",
};

export default function App() {
  const [activeTab, setActiveTab] = useState("practice");
  const [dogVisible, setDogVisible] = useState(true);
  const [userQuotes, setUserQuotes] = useState([]);
  const [dbLoading, setDbLoading] = useState(true);

  // Realtime listener — any new submission anywhere shows up for everyone instantly
  useEffect(() => {
    const q = query(collection(db, "quotes"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setUserQuotes(fetched);
      setDbLoading(false);
    }, () => setDbLoading(false));
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
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { width: 100%; min-height: 100vh; }
        body { background: #0a0a08; color: #f0e8d0; }
        textarea, input { color-scheme: dark; }
        textarea:focus, input:focus { border-color: #e8c97a60 !important; outline: none; }

        /* ── Mobile ── */
        @media (max-width: 600px) {
          .header-title { font-size: 0.85rem !important; max-width: 160px !important; }
          .header-subtitle { display: none !important; }
          .tab-btn { padding: 0.4rem 0.7rem !important; font-size: 0.62rem !important; }
          .hero-h1 { font-size: 1.8rem !important; }
          .hero-sub { font-size: 0.85rem !important; }
          .diff-btn { padding: 0.45rem 0.8rem !important; font-size: 0.68rem !important; }
          .timer-ring { width: 160px !important; height: 160px !important; }
          .timer-text-big { font-size: 3.8rem !important; }
          .timer-text-small { font-size: 2.8rem !important; }
          .quote-box { padding: 1.5rem 1rem !important; }
          .quote-text { font-size: 1.2rem !important; }
          .flying-char { display: none !important; }
          .submit-card { padding: 1.5rem 1rem !important; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a08; }
        ::-webkit-scrollbar-thumb { background: #2a2010; border-radius: 3px; }
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
      `}</style>

      <div style={{ minHeight: "100vh", width: "100%", background: "#0a0a08", fontFamily: "'Crimson Text', Georgia, serif" }}>
        {/* Header */}
        <header style={{
          borderBottom: "1px solid #1a1508",
          padding: "1.5rem 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(180deg, #0d0b06 0%, #0a0a08 100%)",
          boxShadow: "0 4px 30px #00000060",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}>
          <div>
            <div className="header-title" style={{
              fontFamily: "'Crimson Text', Georgia, serif",
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "#e8c97a",
              letterSpacing: "0.02em",
              lineHeight: 1.2,
              maxWidth: 220,
            }}>
              Edward's really cool and awesome Impromptu practice website
            </div>
            <div className="header-subtitle" style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "0.62rem",
              color: "#5a5040",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              marginTop: "0.25rem",
            }}>
              Impromptu Speaking Practice
            </div>
          </div>

          {/* Tabs */}
          <nav style={{ display: "flex", gap: "0.5rem" }}>
            {[["practice", "Practice"], ["submit", "Submit A Quotation"]].map(([id, label]) => (
              <button
                className="tab-btn"
                key={id}
                onClick={() => { setActiveTab(id); if (id === "practice") setDogVisible(true); }}
                style={{
                  padding: "0.5rem 1.2rem",
                  background: activeTab === id ? "#1a1508" : "transparent",
                  color: activeTab === id ? "#e8c97a" : "#5a5040",
                  border: `1px solid ${activeTab === id ? "#3a2f00" : "transparent"}`,
                  borderRadius: "4px",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "0.72rem",
                  letterSpacing: "0.08em",
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

        {/* Pool Stats Bar */}
        <div style={{
          background: "#0d0b06",
          borderBottom: "1px solid #151008",
          padding: "0.6rem 2rem",
          display: "flex",
          gap: "2rem",
          justifyContent: "center",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.95rem", color: "#e8c97a", fontWeight: 700 }}>
              {dbLoading ? "..." : allQuotes.length}
            </div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.58rem", color: "#4a4030", letterSpacing: "0.12em", textTransform: "uppercase" }}>Quotes in Pool</div>
          </div>
        </div>

        {/* Hero area */}
        {activeTab === "practice" && (
          <div style={{
            textAlign: "center",
            padding: "3rem 2rem 1rem",
            width: "100%",
            background: "radial-gradient(ellipse 80% 40% at 50% 0%, #1a1205 0%, #0a0a08 100%)",
          }}>
            <h1 className="hero-h1" style={{
              fontFamily: "'Crimson Text', Georgia, serif",
              fontSize: "clamp(2rem, 5vw, 3.2rem)",
              fontWeight: 400,
              color: "#f0e8d0",
              lineHeight: 1.15,
              marginBottom: "0.75rem",
            }}>
              Good luck bro.<br />
              <span style={{ color: "#e8c97a" }}>You got this gang.</span>
            </h1>
            <p className="hero-sub" style={{
              color: "#5a5040",
              fontSize: "1rem",
              fontStyle: "italic",
              maxWidth: 460,
              margin: "0 auto",
            }}>
              10-second read · 7 minutes to speak your truth
            </p>
          </div>
        )}

        {activeTab === "submit" && (
          <div style={{
            textAlign: "center",
            padding: "3rem 2rem 1rem",
            width: "100%",
            background: "radial-gradient(ellipse 80% 40% at 50% 0%, #1a1205 0%, #0a0a08 100%)",
          }}>
            <h1 className="hero-h1" style={{
              fontFamily: "'Crimson Text', Georgia, serif",
              fontSize: "clamp(2rem, 5vw, 3.2rem)",
              fontWeight: 400,
              color: "#f0e8d0",
              lineHeight: 1.15,
              marginBottom: "0.75rem",
            }}>
              Submit whatever quotation,<br />
              <span style={{ color: "#e8c97a" }}>Just make sure someone said it at some point lol</span>
            </h1>
            <p style={{ color: "#5a5040", fontSize: "1rem", fontStyle: "italic" }}>
              Your submissions are saved locally and added instantly.
            </p>
          </div>
        )}

        {/* Floating Characters */}
        {activeTab === "practice" && dogVisible && (
          <div className="flying-char" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 2, overflow: "visible" }}>
            <div style={{ position: "absolute", top: 0, left: 0, animation: "flyDog 22s linear infinite", willChange: "transform", opacity: 0.82 }}>
              <CyborgDog />
            </div>
          </div>
        )}
        {activeTab === "submit" && (
          <div className="flying-char" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 2, overflow: "visible" }}>
            <div style={{ position: "absolute", top: 0, left: 0, animation: "flyDragon 26s linear infinite", willChange: "transform", opacity: 0.82 }}>
              <ImprovDragon />
            </div>
          </div>
        )}

        {/* Tab Content */}
        <main style={{ padding: "2rem 1rem 4rem", width: "100%", position: "relative", zIndex: 3 }}>
          {activeTab === "practice" && <PracticeTab allQuotes={allQuotes} onPhaseChange={p => setDogVisible(p === "IDLE")} />}
          {activeTab === "submit" && <SubmitTab onSubmit={handleSubmit} />}
        </main>

        {/* Footer */}
        <footer style={{
          borderTop: "1px solid #1a1508",
          padding: "1.5rem 2rem",
          textAlign: "center",
          fontFamily: "'Space Mono', monospace",
          fontSize: "0.65rem",
          color: "#3a3020",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}>
          Built for collegiate impromptu speakers · {allQuotes.length} quotes in the pool
        </footer>
      </div>
    </>
  );
}
