# Handoff — Impromptu Practice (Simpson College Speech & Debate)

Read this before touching the code. It's meant to get a fresh Claude Code
session oriented without re-deriving everything from scratch.

## What this is

A practice tool for impromptu speaking: pick a difficulty, get a random
quote/prompt, optional reading time, then a 7-minute timed speech with
optional local video recording. Also has a community-submitted quote pool
(Firestore) and a browse view of all quotes.

Live at **edwardspracticewebsite.com**. Repo: `thesitandsell/impromptu` on
GitHub (remote is `origin`).

## Stack & architecture

- Vite + React 19, single-page, **no router** — navigation is just an
  `activeTab` string state (`"practice" | "browse" | "submit" | "about"`).
- **Everything lives in one file: `src/App.jsx`** (~2200 lines). All
  components AND all CSS (one big inline `<style>` block inside `App()`).
  This is unusual but deliberate-by-accumulation — don't split it up
  without discussing with the user first, they haven't asked for that.
- Firebase **Firestore only** — no Auth, no Cloud Functions. Client SDK
  talks directly to Firestore, access controlled entirely by
  `firestore.rules`. Config in `src/firebaseConfig.js` (projectId
  `edwardsimpromptusite`).
- Deployment: GitHub Actions (`.github/workflows/deploy.yml`) builds and
  pushes `dist/` to `gh-pages` branch on every push to `main`. Custom
  domain via `public/CNAME` → `edwardspracticewebsite.com`.
  `vite.config.js` has `base: "/"` — **required** for the custom domain,
  don't change it to a subpath.
- The user has given standing permission to `git push` to `main` directly
  (no PR workflow) — this repo auto-deploys, so pushes go live immediately.

## App.jsx component map (top-level, in file order)

```
BUILTIN_QUOTES        49 quotes: 10 Easy / 12 Medium / 12 Hard / 15 Insane-O Crazy
DIFFICULTY_CONFIG     Easy, Medium, Hard, "Insane-O Crazy", Random
PHASES                IDLE, BUFFER, READING, SPEAKING, DONE
IMPROMPTU_TIPS        15 tips shown one-at-a-time during the buffer phase
formatTime()
getRandomQuote()
CircularTimer         reusable countdown ring
CyborgDog             "Atlas" — flying mascot on the Practice tab
ImprovDragon          "The Dragon Who Always Wins" — flying mascot on Submit tab
MascotReaction        generic click-reaction burst (used by Atlas)
DragonFireBreath      dragon's dedicated "HENRY" fire-breath reaction
PracticeTab           the whole practice flow — largest component by far
BrowseTab             live list of all quotes (Easy/Medium/Hard/Insane-O Crazy), realtime via Firestore
SubmitTab             community quote submission form
AboutTab              PLACEHOLDER ONLY — see "About tab" below
App (default export)  layout, nav, flying mascots, footer/legal modal
```

## Practice flow (state machine)

`PHASES = IDLE → BUFFER → READING → SPEAKING → DONE`

- User picks difficulty + **reading time** (0 / 5 / 10 / 15s, pill selector).
  **0 means the reading phase is skipped entirely**, not a fast countdown.
- "Start" triggers a short launch animation (`launching` + `showFlash`
  state, decoupled timers). Rebuilt 2026-07-22: the old version was a
  full-screen **white** radial flash plus a 320° icon spin. It now reads
  as coil → release → iris wipe: the orb squashes to 0.93, springs to
  1.06 while its border goes cyan, the play triangle pulls back then
  shoots right and out, two thin shockwave rings fire, and a disc of
  `var(--bg)` grows out of the orb to cover the screen. No white frame
  anywhere. Timings are load-bearing and interlocked:
  orb/icon `0.36s`, rings `0.5s` (delays `0.11s`/`0.19s`), iris `0.66s`
  held at `opacity: 0` until 25% so the orb beat plays in the clear,
  fully covering at 60% ≈ 400ms — which is exactly when the `setTimeout`
  swaps the phase underneath. **If you change the 400ms timer, move the
  iris's 60% keyframe with it** or the swap becomes visible.
  `startSession` scrolls the orb into view when it is below the fold and
  writes `--iris-x`/`--iris-y` so the wipe radiates from the orb's real
  position rather than a hardcoded centre (guarded against a degenerate
  0-height viewport, which yields `Infinity%` and silently kills the
  custom property). A `prefers-reduced-motion` branch drops to a plain
  cross-fade.
- **BUFFER** (10s): shows the prompt, one random tip from `IMPROMPTU_TIPS`
  (picked once per round, does not cycle), and a note explaining the beep
  schedule. User can skip early.
- **READING**: recording starts here (moved earlier per user request — used
  to start at SPEAKING). Skipped entirely if reading time is 0.
- **SPEAKING** (7 min / 420s): beep plays every 30s but **only for the
  first 90s** — implemented via `startCountdown`'s optional `onTick`
  callback. Beep is a generated tone (Web Audio `OscillatorNode`, 880Hz,
  ~0.2s), not an external audio file — avoids asset/licensing questions.
- **DONE**: recording (if enabled) available to download. Recording is
  **never persisted or uploaded** — it's a Blob URL in memory only, gone on
  refresh, by design (explained to the user via a camera-permission notice
  that pops up top-left on launch, portaled to `document.body`).

## Design system

CSS custom properties: `--bg`, `--bg-raised`, `--border`, `--accent`
(#8b5cf6 violet), `--accent-2` (#22d3ee cyan), `--radius-sm/md/lg`,
`--font-display/body/mono`. Dark theme, violet/cyan on navy.

## Known issues / things to check

1. **Firestore rules — Insane-O Crazy label mismatch. RESOLVED
   2026-07-22, published and verified in production.** `firestore.rules`
   had `'Insaneo CRAZY'` in the difficulty allow-list while the app has
   submitted `"Insane-O Crazy"` since commit `e80b338`, silently 403'ing
   every real Insane-O Crazy submission via `SubmitTab`. The user pasted
   the corrected rules into the Firebase Console. **Verified end-to-end**
   by submitting through the live site: the document was accepted (the
   first ever stored with the correct spelling) and appeared under the
   Insane-O Crazy filter. Nothing outstanding here.

   Note for future sessions: rules can only be published from the Firebase
   Console by the user; Claude cannot deploy them. There is also no way to
   verify a rules change without one real write, because old and new rules
   differ *only* in whether an otherwise-valid Insane-O Crazy document is
   accepted — every read-only or negative probe is denied under both
   versions. Budget for one throwaway document and hand the user its ID.

1b. **Legacy difficulty labels are now remapped on read (client-side).**
   The two pre-rename community quotes still stored as `'Insaneo CRAZY'`
   (Henry Godar, Dillion) belonged to *no* tier: they counted toward the
   "All" total but were unreachable from every difficulty filter and from
   Insane-O Crazy practice rounds. Browse showed 10+16+12+15 = 53 against
   a stated pool of 55. Because the rules forbid `update`/`delete`, those
   documents can never be rewritten — so `LEGACY_DIFFICULTY` (top of
   `App.jsx`) remaps them where the snapshot is read. Counts now reconcile
   at 55. **Keep this map** even after the rules are redeployed; the old
   documents are permanent.

2. **Leftover test/QA documents in the live Firestore `quotes`
   collection.** As of 2026-07-22 the user cleared the old junk — "Test
   Author", "debug", "Live Test", "Handoff Check", "Live Update Test" and
   "Claude QA Check" are all **gone** (verified by read-only REST against
   production). Earlier notes here claiming a "Handoff Check" doc exists
   were stale. The collection is now 4 genuine quotes (Edward Kent, Henry
   Godar, Dillion, Remi Wolf) **plus one throwaway** left by the rules
   verification above: author `"Rules Test - DELETE ME"`, id
   `ltf18XelpNdGs5NjEG2A`. The user was asked to delete it; if it is still
   present, that request is outstanding. Firestore rules only allow
   `create`, never `update`/`delete` (`allow update, delete: if false`) —
   this is intentional (public read, validated public write, no client
   mutation ever), which also means **Claude cannot delete these itself,
   even on request** — the user needs to delete them manually from the
   Firebase Console.

3. **About tab is a placeholder.** `AboutTab()` renders "Content coming
   soon." only. The user said they'll send real content in a future
   prompt — no action needed until then, just don't assume it's finished.

4. **Sandboxed browser testing environment quirk** (for whoever tests this
   next): the in-app browser preview used for verification is often
   backgrounded/unfocused (`document.visibilityState: "hidden"`,
   `document.hasFocus(): false`), which throttles `requestAnimationFrame`
   and CSS animation clocks. This caused real false-negative test results
   earlier in development (e.g. an animation-retrigger bug that only
   reproduced because of this, not because of an actual code defect — fixed
   by switching from an rAF-based retrigger to a React `key`-remount
   instead). If a timer/animation "isn't updating" during verification,
   check `document.hasFocus()` before assuming the code is broken, and
   prefer `document.elementFromPoint()` / computed-style checks over
   watching an animation play out in realtime.

5. **Two prior click-target bugs both traced to the same root cause**
   (stacking contexts, not the obvious CSS): elements with higher
   `z-index` inside `<main>` couldn't out-rank the header/couldn't receive
   clicks over `<main>`'s box, because `<main>` and the header were
   separate top-level stacking contexts — nominal z-index only matters
   *within* a stacking context. Fixed via `createPortal(..., document.body)`
   for the camera notice, and by raising `.flying-char`'s z-index above
   `<main>`'s for the mascots. If something visually renders correctly but
   doesn't respond to clicks, suspect this pattern first — confirm with
   `document.elementFromPoint()`.

## Feature ideas already discussed but not built

Not required, just recorded so they aren't re-suggested from scratch:

- Extemp-speaking mode (scan BBC/NPR for current stories, generate extemp
  questions styled after the coach's approach) — **explicitly deferred**,
  plan only, do not implement without a fresh go-ahead.
- Non-LLM QoL ideas already given to the user: practice history, custom
  timers, keyboard shortcuts, theme toggle, favorites, CSV/PDF export,
  streak tracker, self-rating, printable flashcards, partner mode, audio
  cues, multi-difficulty filters, session notes, bulk import, PWA/offline
  support, fullscreen mode. None chosen yet.

## Working conventions established with this user

- Push directly to `main` — standing permission granted, no need to ask
  each time.
- Never delete Firestore data, even on explicit request — flag it instead
  (rules also technically prevent it).
- Never deploy Firebase Console changes (rules, etc.) directly — prepare
  the file, tell the user to paste it in themselves.
- When something "doesn't work," verify with DOM/JS-level checks
  (`elementFromPoint`, computed styles, network calls) rather than trusting
  a visual pass in the sandboxed preview — see point 4 above.
