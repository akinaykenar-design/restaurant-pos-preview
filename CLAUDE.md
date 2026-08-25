# Restaurant POS — working rules

The whole product is `index.html` on the `gh-pages` branch (single-file PWA,
embedded mock server, state in localStorage). The owner tests on a phone and a
PC via GitHub Pages using the in-app "Get latest" button. Always `git pull
origin gh-pages` before starting work; commit straight to `gh-pages` with a
`Preview: ...` message.

## The first law: buttons never move

Staff run this till during service, at speed, from muscle memory. They tap
where a button WAS, before their eyes confirm where it is. So:

- **Touch targets are stationary.** A control keeps its position, size and
  meaning across states, party sizes, content lengths, themes and re-renders.
  If content varies, the FRAME stays fixed and the content fills it — empty
  slots stay empty, tiles never stretch to hide a gap, boxes never hug their
  contents.
- **Popups have one size and one position.** Every pad and picker (covers,
  seats, notes, qty) draws the same box every time — sized by the order hub's
  columns and rows, centred the same way, regardless of what's inside.
- **Actions live in fixed corners.** ✕ then ✓, bottom-right, in that order,
  everywhere. Destructive red never swaps sides with confirm green.
- **Nothing shifts under a finger.** No layout jump on state change, no
  control that appears where another one just was, no async re-render that
  moves a row mid-tap. A late-appearing element must claim reserved space,
  not push things around.
- **One grid rhythm.** The order menu grid (columns × rows from the Design
  page) is the module everything else derives from: admin hubs, popups,
  tile widths. Change the derivation, never fork a second rhythm.

When reviewing any UI change, ask: "could a waiter who has tapped this screen
a thousand times hit the right button with their eyes on the customer?" If a
change makes a button's position depend on data, it's wrong.

## Practical notes

- 5 `<script>` blocks; syntax-check each with `new Function(src)` before push.
- Verify changes in a real browser (Playwright, chromium at
  `/opt/pw-browsers/chromium`) at 430px (phone) and ~1300px (PC).
- The dispatcher fires `[data-act]` at multiple nesting levels — nested act
  buttons need `e.stopPropagation()`.
- Show visual/design choices to the owner as lettered mockups BEFORE pushing
  when they ask for options; otherwise ship and tell them to "Get latest".

## Derivation hierarchy (Design)

The order grid (tiles across × down) is the senior decision; docket width
is junior to it; text size junior to both. The 44px law arbitrates every
conflict — a senior setting can never be moved into breaking a junior one's
tap targets, and nothing reflows without an explicit choice. "Auto" modes
are banned: a setting always displays a real number (derived until first
touch pins it). Every popup (covers, seats, notes) draws the order grid's
half-scale frame — one grammar.

## Reserved colours

Green (open table), red (needs you), orange (locked/selection), yellow
(running long) and violet (over time) are status vocabulary — never usable
as accents or decoration. Accents come from the curated set only.

## The standard dropdown (owner pick B, Aug '26)

ONE dropdown everywhere: the closed control is a 44px chip (radius 10,
bold value, no chevron — no arrows ever); the open list is the app-drawn
key-tile popup (Chromium base-select `::picker` — dark surface, bordered
44px key tiles, current value ringed green), the same popup grammar as
covers/seats/notes. Never ship a bare native select or a third menu
style; non-Chromium browsers fall back to the system picker. The page
runs in STANDARDS mode — the `<!DOCTYPE html>` on line 1 is
load-bearing (quirks mode disables base-select); never remove it.

## The expanded-editor recipe (owner, Aug '26)

Every expanded row editor is: two identity rows (text you type), then ONE
grid of labelled 44px chips (everything you pick), then a single footer
row. A pick's options open in a popup — never an always-open pill cloud,
never a loose field outside the grid. The Items editor is the model
(`.ie-grid` / `.ie-chips` / `.ie-chip` / `.ie-pop`); converge other
editors on it rather than inventing new layouts.

## Icons

A drawn icon may not repeat: two different pages/actions never share a
glyph (e.g. Discounts' tag ≠ Categories; typed-note ≠ order-notes).
NO ARROWS, EVER (owner rule, Aug '26): no drawn icon uses arrow motifs —
no direction arrows, no up/down trend arrows, no arrow-circles. Express
"more/less" with +/−, movement with position or colour, never an arrow.
(The table-transfer swap glyph the owner picked earlier is the single
grandfathered exception unless they say otherwise.)
