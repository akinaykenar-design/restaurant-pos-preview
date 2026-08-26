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

## The Design page wears the screen's shape (owner pick A, Aug '26)

`.design-split` is a two-column grid above 1100px: the preview on the LEFT at
order-hub width, the settings on the RIGHT at the DOCKET's own width
(`clamp(300px, var(--ticket-w), 460px)`), so the settings column lands exactly
where the docket sits inside the preview. Four cards read at once instead of
one and a half, and the empty right half is gone. Below 1100px it falls back
to the stacked column, and the phone's cut-in-half layout is untouched.

## Covers is ONE TAP (owner pick A, Aug '26)

The covers pad is a tile per party size, 1–12, and tapping one sets it and
closes — the tap IS the confirmation, so there is no tick. The table's
current covers wears `.sel` (the blue key) so the thumb knows where to go
before the eyes catch up. "13 or more" falls through to the digit pad, which
keeps its ✕/✓. A pad whose only action is Cancel puts ✕ in the corner every
other pad uses (`:only-child` → last column), never floating mid-row.

The SEAT pad is never narrower than three keys (`Math.max(3, cols)`). A
phone's menu is 2 columns because a MENU TILE holds a dish name; a seat key
holds "4", so copying that 2 copies the wrong number and the pad came out a
narrow strip (owner: the position popup "looks weird" on mobile). Keys stay
half a tile — the rhythm is untouched — only the column count gets a floor.

## Covers settings, and where position-asking is switched off

Covers have their OWN settings page (owner, Aug '26: "we have a courses
settings. how about a covers settings?") — Courses had been carrying them,
its own search entry already called it "Covers & seat numbers". Courses
keeps courses; `settings-covers` keeps people: seat numbers, the ask-when-
adding master, the never-ask rules, seat labels.

A round of drinks belongs to a person; a plate for the middle of the table
does not — and that line falls in a different place at every venue. So
`settings.askSeatOff` holds three lists — `salesCategoryIds`, `sectionIds`,
`itemIds` — and MOST SPECIFIC WINS: item, then section, then sales category,
then the venue's `promptSeatOnAdd`. A rule can only opt OUT, never in.

It all lives on the one page as tap-to-exclude tiles (items via a search
box, since there are hundreds). NOTHING is added to the section or item
editors — the owner wants those kept clean, and a per-item setting nobody
would ever visit 712 times is worse than useless. `itemAddNeedsSeatPrompt(item)`
takes the item so the gate can resolve it; with no argument it falls back to
whatever the open options pane is holding. The old per-section `askSeat`
field migrates into `sectionIds` on first read.

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
`--pad-cols` on the POP, never on the grid, so the action row follows. Seats
a table hasn't got are DRAWN as ghost cells (`.seat-ghost`, dashed and
untappable, same size as a key), rebuilt on every sync from `cols * R3`:
the box keeps its one size and place, every key stays exactly where it was,
and a two-cover table reads as "this table only has two" instead of a void
(owner, Aug '26: "ghost slots is good"). A party bigger than the frame
scrolls inside it, as before. Same trick the notes popup uses for its short
tabs — never solve an empty pad by resizing the box or stretching the keys. Every button in an action
row is a full cell, the note button included. A pick's options open in a popup — never an always-open pill
cloud, never a loose field outside the grid. The Items editor is the
model (`.ie-grid` / `.ie-chips` / `.ie-chip` / `.ie-pop`); converge
other editors on it rather than inventing new layouts.

## The seat pad is sized by the VENUE (owner, Aug '26)

Key SIZE and key COUNT are two different decisions and only one of them
comes from the order hub. SIZE does: a pad key is half a menu tile, always,
so every pad keeps the hub's rhythm. COUNT does NOT (owner: "i don't think
we should follow that rule of matching rows and columns with the order
hub") — the hub's column count answers "how many dish names fit across",
while the pad's question is "how many seat numbers do I need". Different
questions, different answers.

So the seat pad holds **All + the biggest table in the venue**, laid out as
square as it goes, **never narrower than three keys** — 8-top venue → 9
slots → 3 x 3, the same 3 x 3 on phone and on tablet. `venueMaxSeats()` and
`seatPadShape()` decide it; the seat-pop branch of `syncPopupTileGrids()`
uses nothing else. Rows are still clamped to the screen, so a 30-top venue
scrolls rather than running off the bottom.

One box, one position, never changes during service. It changes only when
you add a bigger table — a setup decision, not a service one. A party
bigger than your biggest table scrolls INSIDE the box, as always. Empty
slots stay drawn as ghosts; never fix an empty pad by resizing the box or
stretching the keys.

## Undo in admin (owner, Aug '26)

Every delete under `/api` is undoable. The server snapshots the SETUP
collections before the delete (menu, sections, staff, floor plans, presets…)
and `POST /api/undo` puts them back exactly — same ids, same order. The
trading collections are deliberately never snapshotted (`UNDO_SKIP`: orders,
register, timeclock, audit/house logs, roster, time off), so undoing a
deleted item can never roll back money taken or hours worked. A burst of
DELETEs inside 4s shares one snapshot, so a bulk delete undoes whole.
Client side it is armed in ONE place — `api()` sees a successful admin
DELETE and calls `offerUndo`.

The preview's express shim used to drop `app.use()` on the floor (`use:
function () {}`), so real middleware silently did nothing. It now runs
middleware ahead of the route — but only functions of EXACTLY three args:
a four-arg `(err, req, res, next)` is Express's error handler, and running
it in the chain hands it the request as its error and breaks every call.

## Phone drawers (owner, Aug '26)

Two drawers, mirror images, one grammar. The docket rolls in from the RIGHT
(`.ticket-panel` → `translateX(100%)` → 0); the table map rolls in from the
LEFT (`.middle-view.tp-view`). Both .28s ease, both opened and closed by the
same sideways swipe: swipe left for the docket and right to put it back;
swipe right for the map and left to put it back. Both mount parked at their
edge for one unpainted frame (`.tp-entering` / `_sheetEntering`) and are
released on the second rAF, so the roll-in starts from the edge instead of
jumping. The map RESTS open and only sits off-screen while a class says so —
if the animation never runs (reduced motion, an old browser) it is simply
there, never stranded off the edge.

## Editing on the docket keeps you on the docket (owner, Aug '26)

On a phone, a pane opened FROM the docket rides ABOVE the drawer instead of
dismissing it: `keepMobileDrawer()` leaves `mobileCartOpen` alone,
`paneOverDocket()` stamps `body[data-mob-pane]`, and that lifts
`.middle-view` to z-index 50 over the drawer's 45. Close the pane and the
docket is still there, exactly where you left it. Before this, tapping a
docket line dismissed the drawer and dumped you back at the menu (owner:
"you should stay on the page you are editing").

`dropMobileDrawer()` still exists and is still right for the TABLE PICKER,
which is its own drawer coming in from the left — it must not open behind
the docket.

## Mouse wheel (owner, Aug '26, twice)

The wheel is damped EVERYWHERE, not in named panes: a notch (`deltaMode 0`,
|deltaY| ≥ 30) scrolls 40% of what the browser wanted, applied to whatever
actually scrolls under the pointer — walk up from the target to the first
ancestor with real overflow, the page included. Trackpad streams (small
deltas) are untouched, an open `select` is never fought, and the event is
only swallowed if something actually moved, or the wheel dies at the end of
a list instead of passing the scroll up.

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
(`@media (hover:hover)`) also kills transitions and animations on hover in
case something slips in — scoped to `body:not(.sorting)` so it never
fights an active drag's transforms. It must NEVER force `transform:none`:
a floor marker is POSITIONED by transform (`translate(-50%,-50%)
rotate(Xdeg)`), so that rule threw away its centring and its angle on
hover — every table jumped half its own size down and right and snapped
back when the pointer left, which is the "jittering tables" the owner
reported (Aug '26, measured at 62px). Structural transforms are none of
hover's business. The finger cursor is part of this
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

## The vocabulary — every element has ONE proper name

Owner rule, Aug '26: "I want every element to be named proper." A name is
picked once and reused everywhere — the Design preview's `data-mkname`, the
settings card that controls it, and the button's own `aria-label` all say the
same word. No word names two things (that is why the docket's button row is
"Docket tiles" and not "Quick tiles" — one of the tiles is the Quick note).

- **Menu bar** — the section rail (`catrail`). **Subsection bar** below it.
- **Menu tile** — one item on the order grid. **Subsection tile** likewise.
- **Docket** — the order panel. **Docket text**, **Docket tiles**.
- **Docket tiles** — the button row across the docket's head: Table, Covers,
  Order notes, Quick note, Call away, Auto course, Customer, Reprint, Move
  items. They are PINNED, not configured: hold a tile on the order screen's
  account pane and it pins to (or unpins from) the docket head. There is no
  settings card for this and there must not be — a second way to set the
  same thing is the duplication this app keeps deleting (owner, Aug '26:
  "we dont need that in settings they are pinnable in admin"). Stored as
  `settings.docketShortcuts` — code-only, never shown.
- **Courses**, **Order notes**, **Quick note**, **Call away**.
- **Position** — who an item is for. The **position pad** asks it; the
  **covers pad** counts the party.
- **Covers** — how many people. **Seat** — one of them; the word itself is
  the venue's (`seatPrefix`).

When you name a new element, add it here and use the same word in all three
places.

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

Order notes are a POST-IT (`DKT_POSTIT_SVG`, owner Aug '26): a square with
its bottom corner peeling off and writing on it. The item's own typed note
keeps the plain page (`DKT_NOTE_SVG`). Until now BOTH drew the page — the
very pair the no-repeat rule names. The panel keeps the name "Order notes":
"Guest notes" collides with reservations (which have a Guest name and their
own notes field), "Pinned notes" collides twice over with staff PINs and the
hub's pinned shortcuts, and "Table notes" would be wrong on takeaway and
delivery, where the button is there but no table is.

A drawn icon may not repeat: two different pages/actions never share a
glyph (e.g. Discounts' tag ≠ Categories; typed-note ≠ order-notes).
NO ARROWS, EVER (owner rule, Aug '26): no drawn icon uses arrow motifs —
no direction arrows, no up/down trend arrows, no arrow-circles. Express
"more/less" with +/−, movement with position or colour, never an arrow.
(Two owner-approved exceptions: the table-transfer swap glyph, and the
sort menu's "$ ↑" / "$ ↓" price labels — the owner asked for the $arrow
form back, Aug '26.)
