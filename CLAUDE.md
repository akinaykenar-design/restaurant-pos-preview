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
  And they are SQUARE — the docket panel's grammar (~64-76px squares,
  icon with its small word), never stretched wide bars (owner, Aug '26).
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

No slider may OVERRIDE the grid (owner, Aug '26: "gone ty"). The old
"Advanced sizes" card — tile size, tile height, tile spacing, menu bar,
subsection bar, docket text, docket spacing — is deleted: a venue could
pin 4 columns there and then drag tiles into breaking its own grid. Tile
width and height are the grid's (tiles across × down); text is the one
Text size decision; the menu bar, subsection bar, docket text and docket
width are resized by HOLDING them in the Design preview (the `data-mkel`
handles). Stored theme values are untouched — there is simply no UI to
fight the grid with. Never re-add a size slider outside the four
decisions.

## Prices (owner, Aug '26)

Hard-wired, not a setting: a price NEVER appears on a menu tile, and ALWAYS
appears on the docket and in the line editor. A tile is a target hit from
muscle memory — a price on it is one more thing to read, and it faces the
room. `settings.showPrices` and `settings.showTilePrices` are deleted along
with their toggles; item editing in admin shows price as it always did.
Never re-add a switch for this.

## Practice orders (owner, Aug '26)

A trainee is the only practice there is: an order is practice when the
person who rang it was `staff.trainee` at the time, so it never prints and
never counts. The venue-wide `settings.practiceMode` is deleted — it had no
UI at all, so once set (by an old client or an import) every order from
everyone would silently stop counting with nothing on screen to explain it.
Never re-add a whole-venue practice switch.

## Reserved colours

Green (open table), red (needs you), orange (locked/selection), yellow
(running long) and violet (over time) are status vocabulary — never usable
as accents or decoration. Accents come from the curated set only.

Selection is the ACCENT, never a picked colour (owner, Aug '26: "it should
be default accent? no?"). The docket line being edited draws
`var(--orange-dim)` / `var(--orange)` — and `--orange` IS `theme.accent` at
runtime — so it follows the accent everywhere. The old Design → Docket →
"Selected line colour" override is deleted; never re-add a per-thing colour
picker for something the accent already answers.

## The standard dropdown (owner pick B, Aug '26)

ONE dropdown everywhere: the closed control is a 44px chip (radius 10,
bold value, no chevron — no arrows ever); the open list is the ORIGINAL
house dropdown (`.fp-dd`, the Aug 17 "Dropdown law", still used by the
floor-view picker): a surface card of PLAIN borderless left-aligned rows
(radius 8, normal weight, 44px min), the current value on a SOLID accent
bar with white text. Chromium base-select `::picker` draws it for every
real <select>; match `.fp-dd-item` exactly, never bordered key tiles. Never ship a bare native select or a third menu
style; non-Chromium browsers fall back to the system picker. The page
runs in STANDARDS mode — the `<!DOCTYPE html>` on line 1 is
load-bearing (quirks mode disables base-select); never remove it.

## The expanded-editor recipe (owner, Aug '26)

Every expanded row editor is: two identity rows, then ONE grid of picks,
then a single footer row — and EVERY cell is the same labelled chip
(`.ie-chip`): small-caps header OUTSIDE (above) the box, one bold value
size inside a 44px bordered box (owner flipped inside→outside, Aug '26:
"put headers outside the box"). Number pads are one family too: keys
are HALF an order tile (synced from the grid like the seat pop), the
decimal key is a permanent slot (dimmed on whole-number fields), and
the ✕/✓ ARE keys — the action row repeats the key grid's columns and gap
and each button is a key-sized cell in the last two columns, whatever the
pad's column count (owner flipped this, Aug '26: "i dont like the numbers
being larger than cross and tick ... everything uniform"). Set
`--pad-cols` on the POP, never on the grid, so the action row follows. A pick's options open in a popup — never an always-open pill
cloud, never a loose field outside the grid. The Items editor is the
model (`.ie-grid` / `.ie-chips` / `.ie-chip` / `.ie-pop`); converge
other editors on it rather than inventing new layouts.

## No native drag, and no flashing borders (owner, Aug '26)

Sorting is OURS (`makeSortable` / `beginSortDrag`, pointer events). No
element may carry `draggable="true"`, and a global capture-phase
`dragstart` handler refuses the browser's own drag outright. The old HTML5
drag-and-drop left admin rows marked draggable long after its handlers were
deleted, so the browser started a ghost drag on press — the red no-drop
cursor, then a `dragend` that ran `_clearStuckDragState` and tore the real
drag out mid-gesture. Only rows repainted after bind time misbehaved (the
one-row refresh), which is why it felt random. Never re-add native DnD.
`will-change` goes on the DRAGGED row only — putting it on every neighbour
made 712 compositor layers and froze the full items list.

Rings never move. No border or ring may blink, pulse, bloom or breathe
(owner: "remove flashing borders everywhere") — a ring states something by
sitting there. Deleted: the Design jump flash (`ctl-flash`), the attention
table's glow pulse (the glow stays, still), the armed move-source ring pulse
(the ring stays), the transfer landing bloom (the chip says it), and Send's
white ring-pop on press.

## No hover, EVER (owner rule, Aug '26 — total)

Nothing changes on hover. Not a colour, not a border, not a shadow, not
a transform — the owner flagged even a flat background swap ("stil
hover?!"). This is a till: fingers don't hover, and a mouse gliding
over the screen must never make the UI stir. Every visual `:hover` rule
was deleted (Aug '26); never add one. The single exception: the OPEN
dropdown picker highlights the option under the pointer (an open menu
tracks the pointer like the OS's own menus). A belt rule in the CSS
(`@media (hover:hover)`) also kills transitions/transforms on hover in
case something slips in — scoped to `body:not(.sorting)` so it never
fights an active drag's transforms. The finger cursor is part of this
law: the pointer never changes shape over a control (`cursor:default`
everywhere on mouse devices; text fields keep the I-beam, an active
drag keeps the grabbing fist).

## Item Alerts (owner, Aug '26)

The item editor's flag chip is GENERIC and stable: it is always called
"Alerts" (`settings.itemFlagName` can rename the word itself), never the
name of a note category. What it MEANS is decided in Order notes: the
Alerts popup carries toggle tiles for the note categories — pick as many
or as few as wanted (`settings.itemFlagCategoryIds`, default
['allergy']); the chip's vocabulary is the union of the picked
categories' presets and their seat notes all warn. Warnings from
recorded seat allergies always fire regardless of the picks. The item
side never renames when a category does — generic container, picked
sources.

## Icons

NO ICON PACKS (owner, Aug '26: "lets remove icon packs in general until we
can design some"). There is no pack chooser: the "Icons" pair of dropdowns
in Design → Extras (`settings.iconStyle` — a CSS filter over emoji — and
`settings.venueStyle` — a 12-emoji suggestion set) is deleted, along with
its CSS filters and its server fields. Emoji render as themselves. Picking
an icon for an item, a section or a subsection is untouched: one preset
grid plus a paste-your-own field. `SBW`'s drawn black-and-white glyphs are
kept in the file, wired to nothing, as the seed of a real drawn set — the
next icon work replaces the emoji, it does not add a second pack to choose
between.

A drawn icon may not repeat: two different pages/actions never share a
glyph (e.g. Discounts' tag ≠ Categories; typed-note ≠ order-notes).
NO ARROWS, EVER (owner rule, Aug '26): no drawn icon uses arrow motifs —
no direction arrows, no up/down trend arrows, no arrow-circles. Express
"more/less" with +/−, movement with position or colour, never an arrow.
(Two owner-approved exceptions: the table-transfer swap glyph, and the
sort menu's "$ ↑" / "$ ↓" price labels — the owner asked for the $arrow
form back, Aug '26.)
