# DotWar

Vite + React + TypeScript starter for a portrait-first territory strategy game.

## Game rules

- A pre-game upgrade screen shows saved credits and the player's garrison,
  production, and troop capacity. Upgrades cost 10 credits per level band and
  increase garrison by 2, production by 0.1 troop per second, or capacity by 1.
- The starting balance is 0 credits. Winning a match awards 50 credits and
  losing awards 10; credits and upgrade levels are saved in the browser.
- The campaign has eight stages. Stages 1-7 have 6, 8, 9, 10, 12, 13, and 15
  territories. Stage 8 matches stage 7 and adds a turret to one territory.
  Stages 3-8 introduce two to four independent enemy AIs, which can attack one
  another as well as the player. Victory unlocks the next stage; stage 8 remains
  unlocked after completion, while a defeat keeps the current stage.
- Territory positions are randomized on a spaced map at the start of each
  match. No two territory centers are closer than 20 map units, so movement
  between any pair takes at least 1.5 seconds at the default speed and their
  circles stay apart. Territories start with 10 troops by default; the
  player's home uses its upgraded garrison value.
- Player territories (red) use the upgraded production rate and capacity.
  Enemy AIs receive one additional garrison, production, and capacity upgrade
  per stage after stage 1; each AI has a distinct color. Neutral territories
  (gray) do not produce troops.
- Production stops when a territory reaches its capacity, shown by a pause icon.
- Player orders send all troops from the source. The first wave leaves
  immediately; remaining troops launch in groups of up to five every 250 ms.
- The source troop count falls with each departing wave. Production pauses while
  a source has troops queued to leave, then resumes one second after the last
  wave departs.
- Send by dragging to a destination, or by selecting a source and tapping the
  destination.
- A purple arrow shows the route. Opposing moving troops cancel one-for-one if
  they collide in transit; friendly troops pass through each other.
- The stage 8 turret has a dotted radius of 20 map units and intercepts one
  hostile moving troop every 500 ms. A neutral turret attacks both sides; after
  capture it attacks only factions hostile to its owner.
- Arriving troops reinforce friendly territory. Attacks remove defenders
  one-for-one; surviving troops capture the territory.
- Every 2.5 seconds, each active enemy AI may launch at most one attack. It
  considers adjacent hostile territories its source can outnumber after
  accounting for production during travel, sends all troops, and prefers
  immediate captures. An AI territory at capacity also attacks its nearest
  hostile neighbor.
- The player loses when all player territories are eliminated. The player wins
  when all enemy AI territories are eliminated; neutral territories may remain.
- The three-dot menu pauses active matches. Settings include a saved sound
  effects toggle; abandoning a match returns to preparation without a reward.

## Run locally

```bash
npm install
npm run dev
```

Use your browser's mobile device emulation to preview the portrait layout.

## Build

```bash
npm run build
npm test
npm run preview
```

## Coding conventions

- Keep React component files under 200 lines where practical; split components
  when a file grows beyond that.
- In each `.tsx` file, separate imports, types/constants, component state and
  hooks, effects, handlers, and JSX with the numbered `// === ... ===` sections.
- Order imports as external libraries, internal components, hooks, utilities,
  then styles.
- Use PascalCase for component names and files, camelCase for variables and
  functions, `handle` for event handlers, `on` for callback props, and
  UPPER_SNAKE_CASE for fixed constants. Prefix booleans with `is`, `has`, or
  `should`.
- Destructure props, update state immutably, and avoid nested ternaries in JSX.
  Move complex display conditions into named values.
- Add brief JSDoc to utility functions and primary handlers. Explain why for
  non-obvious logic and use `// TODO: ...` for known follow-up work.

## Deploy to Vercel

Import this repository in Vercel and deploy with the Vite defaults:

- Framework preset: **Vite**
- Build command: `npm run build`
- Output directory: `dist`

The included `vercel.json` sends app routes to the SPA entry point.
