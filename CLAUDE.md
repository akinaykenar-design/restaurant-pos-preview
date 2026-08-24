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
