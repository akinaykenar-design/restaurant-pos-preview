# Restaurant POS — working rules

## Which repo is the real one

**`restaurant-pos-preview`, branch `gh-pages`, is the LIVE PRODUCT.** The name
lies and the owner has decided to leave it that way (Aug '26) — do not suggest
renaming it again. Everything is one `index.html` (single-file PWA, embedded
mock server, state in localStorage), and that file is the whole till.

`restaurant-pos` — the repo without "preview" — is DEAD. Last touched 17 July
'26, nothing since. It is the old server-based build (`server.js` +
`public/app.js`, ~12,700 lines) and contains none of this work. It needs Node
running to start, which is exactly why the single-file version was made and
why it quietly became the product. Never work there, and never copy anything
back into it.

`main` on the live repo is an empty "Initial commit" with a README, from the
day the repo was created. It has no `index.html`. Nothing is missing from it.
`phone-data` carries the owner's synced data.

## Two sessions push to this branch

Another Claude session works on `gh-pages` at the same time. On 26 Aug one of
its pushes came from a stale copy of `index.html` and wiped the entire design
system — 258 token lines gone in a commit whose message was about surcharges.
It was recovered by reverting the non-surcharge hunks, but only because
someone went looking.

So: **`git pull origin gh-pages` before starting work AND again before every
push**, and after any push that reports a rebase, check that your own change
is still in the file before saying it is done.

The owner tests on a phone and a PC via GitHub Pages using the in-app "Get
latest" button. Commit straight to `gh-pages` with a `Preview: ...` message.

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

## Curved hub, straight bars — the Word look (owner, Aug '26)

Bars are FLAT, straight and full-bleed. The one panel you WORK in — the order
hub (`.menu-panel`, and `.middle-view` when the table map takes its place) —
is a rounded card: `--hub-radius` 18px, `--hub-gap` 10px of margin.

There is **no darker tray** behind it (owner: "without the padding colour ...
the whites around it blend"). `.main` is `var(--surface)` — the same white the
menu bar, the docket and the app bar already are — so the chrome runs into the
surround with nothing marking the join. The only things that pick the hub out
are its cream (`--steel-100`) and its corners. Every hairline between the
chrome and the card is gone with the tray: no border on `.catrail`, none on
`.topbar`, none on `.ticket-panel`.

The gap is measured **ink to card**, and it is the same on all four sides. That
only holds if ONE thing owns it, so each bar drops the padding on the side
facing the card and the card's margin owns the whole gap. Before this rule the
top read 18px (the rail's own 8px stacked on the card's 10px) against 10px at
the sides (owner: "too much padding at the top"). If you ever add a bar beside
the hub, zero its facing padding or the gap goes lopsided again — and measure
it, don't eyeball it.

Full-screen panes are not the hub card: the phone's table-map drawer
(`body[data-fs-picker] .tp-view`) and an editor held over the docket
(`body[data-mob-pane] .middle-view`) own the whole frame, so margin 0, radius 0.

**Admin wears the same rule** — `.admin-sidebar` is the flat bar, `.admin-content`
is the cream card. Before this, admin was white-on-white and every settings card
had to draw a border just to be visible.

**The Design preview wears it too.** The mock (`.scrmock`) is a carbon copy of
the till, so when the till changes shape the mock changes with it — it had gone
on drawing the old straight-edged screen, which is the preview lying about the
product. Anything that changes the till's outline has to be mirrored there in
the same commit.

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

## Working rules (owner, Aug '26: "lets stop any bs in the future")

1. **Pull before every change and before every push.** Another session pushes
   to this branch. A rejected push means work was done on a stale file.
2. **Find the element before answering.** Measure it, name it from the
   vocabulary below, and say which one you changed. Do not guess which thing
   the owner means and build on the guess.
3. **One answer, not a menu.** Give the recommendation and build it. Options
   only when the choice genuinely changes the product and the owner has to
   live with it.
4. **Short.** Say what changed, the numbers that prove it, and stop.
5. **Show it.** Rendered screenshots of the real app, never a description.

## Control height — two chosen, everything else DERIVED (owner, Aug '26)

    --h-control  44px   every control (same number as --tap)
    --h-primary  64px   the .icon-action family — every commit-or-cancel

`--h-primary` is NOT "the docket only" (an earlier draft of this section said
that and it was wrong). It is the `.icon-action` family, and every member is
already 64: the docket's Bill/Pay/Discard/Send, the floor picker's Close, the
checkout's Cancel/Confirm, the line editor's Done, the notes pane's
Close/Save. Only the WIDTH changes with how many share the row — 69 for four
across a docket, 76 for a square, 148 for two across a checkout.

There is no "slightly smaller" button. 38, 41, 46, 50 and 52 were not
decisions, they were accidents — a min-height nobody revisited, or a label
wrapping to two lines ("2 min" was what made the idle-logoff buttons 52 while
their neighbours were 44, which is why `.pay-opt` now sets `white-space:nowrap`
and the row wraps by BUTTON instead).

One place gets to be bigger and it is the docket's action row, because that is
where a mistake costs money. It is `--h-primary` on every device — the phone
used to say 60, and 4px is not worth a second number.

**Derived, never chosen.** A few things legitimately land on any number
because they follow something else: the docket quantity stretches to its line,
a docket tile is half a menu tile, a nav button is square so it is the rail's
width, a swatch is `--swatch`, a menu tile is the grid's job. Those are rules.
`design/check-design.js` lists each derivation BY NAME, so a stray new height
cannot pass itself off as one.

**Check the states you have to OPEN.** The first checker only walked screens
reachable from the nav, passed clean, and meanwhile the button that takes the
money in a split (`Take it`) was 41px, the split's -/+ were 30px and the line
editor's qty steppers were 40px. It now walks pay, split, line edit, notes,
covers pad and checkout as well — 30 views, not 18 — and it caught the 40px
stepper the moment those were added. If you add a pane, add it to `DEEP`.

## The spacing rhythm — multiples of 4 (owner, Aug '26)

Every gap and every padding is a multiple of 4: **4, 8, 12, 16, 20, 24**.
Nothing lines up across two panels by accident — it lines up because both
panels are counting in the same units. 548 values were snapped; before it was
9 different gaps (2, 3, 4, 5, 6, 8, 10, 12, 18) and 18 different paddings.

**`button{padding:0}` is load-bearing.** A `<button>` with no padding rule
inherits the browser's own `1px 6px` — not a number anyone chose, never on
the rhythm, and invisible until you measure it. The docket's four action
buttons had carried it all along. Zeroed once, globally; every button that
wants padding still states it.

**Derived, and named in the checker:** the grid gap is `--grid-gap` (the owner
tunes it on the Design page), a tile's internals follow the tile, a name's
side gutter is `2.1ch` so it follows the type, the number pads are computed
from the menu grid in `syncPopupTileGrids()`, and `.modal-bg` clears the app
bar and the keyboard. Everything else must be a multiple of 4.

## The type scale — five steps (owner, Aug '26)

    --fs-chip  10.5   badges, field labels, action words
    --fs-md    13.5   body — the default
    --fs-lg    15     card and section headers
    --fs-xl    19     screen and pane titles
    --fs-num   24     dashboard figures

227 font sizes were hard-coded across 20 different values (7, 9, 9.5, 10,
10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5, 15, 16, 17, 18, 19, 20, 22).
All swept onto the five.

**`--fs-sm` is gone.** It was 12.5 against `--fs-md`'s 13.5 — one pixel apart,
which nobody can see, so it was not two steps, it was one step written twice,
and 67 places used it. Secondary text is separated by COLOUR and WEIGHT, which
is what should have been carrying it all along.

**`--fs-xl` is new.** Nothing sat between 15 and 24, so every heading at 18,
19, 20 and 22 invented its own size.

**Derived, and named in the checker:** a menu tile's name follows the tile
(`--item-name-size` x `--menu-fs`), docket text follows the docket slider
(`--tkt-fs`), nav chips follow the rail (`--rail-fs`), floor numbers follow the
table's size and zoom, pad keys follow `--pad-key-h`. Those are rules, so they
land wherever they land. Everything else must be one of the five.

Wiring the check surfaced three faults nobody had noticed: a segment button in
the floor editor was borrowing the MENU NAV's font size, the split pane's
**amount** had no size at all and was inheriting the browser's 16px, and the
covers pad needed naming as derived.

## The corner family — three, and only three (owner, Aug '26)

    --r-control  10px
    --r-surface  16px
    --r-pill    999px

- **control** — anything you PRESS: button, chip, key, tile, list row, swatch,
  input. A row is pressed too, so a row is a control.
- **surface** — anything that FLOATS and CONTAINS controls: popover, modal,
  number pad, settings card. It is rounder than its contents on purpose; a
  container with the same corner as the things inside it looks pinched.
- **pill** — a true capsule and nothing else: the switch, a status chip, a
  count, a badge, a toast.

Eleven different corners were on screen at once before this (6, 7, 8, 10, 12,
13, 14, 20, 22, 99 and a circle) and 213 radii were hard-coded. All swept into
the tokens. **Nothing decides its own corner.** `design/check-design.js` fails
on any corner that is not one of the three.

Exempt, by name, because they are pictures rather than corners: the floor
editor's table-shape drawings (`.shape-chip-preview`), the switch knob, and
floor markers.

## The docket is the quietest panel (owner, Aug '26: "both bare for now")

An action gets a shape, a value does not — and on a docket line neither gets an
outline. The price is a value you can edit; the accent colour already says tap
me. The ✕ is a glyph whose whole meaning IS its shape, so a box around it is a
second shape saying the same thing. Its box was also the only outline on a
line, so it repeated down the right edge as a ladder of empty rectangles and
made DELETE the loudest thing on the panel you read a hundred times a shift.
Both are still full `--tap` targets; only the box is gone.

## The finger law — and how rules are actually kept (owner, Aug '26)

Nothing you tap is smaller than `--tap` (44px) on either axis. 44 is Apple's
own minimum (Human Interface Guidelines); Material says 48, WCAG 2.2 AAA says
44. It was not invented here.

**No halos.** There used to be a system that let a small control keep its look
and grow an invisible box to catch the tap. It is deleted (owner: "i dont like
the idea of halos shoud we rid and adjsut?"). A hidden box that behaves
differently from what you can see is a lie to the user, and it let the app be
drawn tighter than it really is. Controls are the size they claim. Where a
control cannot grow because a neighbour is closer than 44px, the fix is the
SPACING, not a bigger invisible box.

**Rules are kept by `design/check-design.js`, not by good intentions.** It
walks nine screens at two widths and fails on any control under `--tap` or any
colour swatch that breaks the swatch rule. Run it before pushing anything that
touches a control:

    NODE_PATH=<wherever playwright-core lives> node design/check-design.js

The lesson is in the file's own header: a comment in index.html cited a
checker called `check-tap-targets.js` for months, that file never existed, and
40 controls drifted under size with nobody noticing. **A rule with no check is
a wish.** When you add a rule to this document, add it to that script too.

## ONE swatch, wherever a colour is picked (owner, Aug '26)

**One way to pick it, too** (owner, Aug '26: "we should just have the std
colour choices pop up for colour items"). Every colour in the app — an item's,
a section's, a table's, the floor background, and now the ACCENT — is one
swatch that opens the same popover. The accent used to be eight swatches laid
out in the settings card, which was a second way to do the same job.

**And ONE palette.** `PRESET_COLORS` — the twelve you get on an item — is
what every colour picker shows, the accent included (owner, Aug '26: "the
preset colours same as item presetting colours"). There is exactly one
exception, `TABLE_MATERIAL_COLORS` on the floor plan, because a table needs
real materials (woods, cloths, stone), not hues. Do not add a third palette:
a bespoke set for one control is the same mistake as a bespoke control.
The accent offers no Clear, because the app always has an accent.

Picking a colour is the same job in all five places it happens — the accent
row, an item's colour, a table's colour, the floor background, and the palette
inside the colour popover — so it is the same control:

**44 x 44, corner `--swatch-r` (10), 8px apart, and TWO RINGS.**

The rings are the part worth keeping (they were already right in the Items
list): `border:2px solid var(--surface)` sits INSIDE the 44 box so the colour
never touches its own outline, and `box-shadow:0 0 0 1px var(--steel-300)`
draws the visible hairline just outside it, costing no layout. That inner ring
is why a pale swatch still reads on a white row instead of dissolving into it.
Chosen = the hairline thickens to `0 0 0 3px var(--text-primary)`; nothing
moves.

The 44 is the box AND the tap target, so a swatch needs no halo.

The rule itself is older than this pass — `colorDotButton()` already said
"colour swatches are one size everywhere". The number was 22px, which is
half a finger, and three places had quietly overridden it. Same rule, honest
number, and the geometry lives in CSS (`--swatch`) instead of being written
onto every button's style attribute.

## The vocabulary — every element has ONE proper name

Owner rule, Aug '26: "I want every element to be named proper." A name is
picked once and reused everywhere — the Design preview's `data-mkname`, the
settings card that controls it, and the button's own `aria-label` all say the
same word. No word names two things (that is why the docket's button row is
"Docket tiles" and not "Quick tiles" — one of the tiles is the Quick note).

- **The bar** — the band with Order / Admin / search / power (`.topbar`).
  It is NOT a nav (owner, Aug '26, correcting exactly this mix-up).
- **Admin nav** — admin's list of pages: Daily, Dashboard, Reservations, Menu,
  Inventory, Staff, Finance, Integrations, Settings (`.admin-sidebar`).
- **Menu nav** — the order screen's section rail (`.catrail`). **Subsection
  bar** below it (a filter inside one section, not navigation).
  A nav is a COLUMN on PC and tablet and a sideways STRIP on the phone. The
  direction changes; the colours must not (owner, Aug '26: "a looks good") —
  not selected is the plain surface, selected is the accent TINT with accent
  text, on every device. The phone was painting a cream chip and a SOLID
  accent chip: a second visual language for the same control.
  A nav laid out as a STRIP is a row of TABS: each one fills the strip's full
  height, square edges, nothing floating in the middle of it (owner, Aug '26:
  "I want the square edge ... I just want to remove the top and bottom
  space"). `--nav-strip-h` is the old chip height plus the padding that used
  to sit above and below it, so the strip keeps the height it had, nothing on
  screen moves, and that padding becomes tappable. The COLUMN layout already
  worked this way; the strip was the odd one out. This is the ONE place a
  square edge is right: a tab is cut FROM the strip, it does not sit on it.
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

## Rows in the docket SHARE their width

The pinned tiles, the course tabs and the action row all sit in the same
narrow panel. Every one of them divides the panel's width evenly — no row
hugs the left and leaves a hole on the right.

- Pinned tiles: `flex:1 1 0` with `min-width:44px` and **no max-width**.
  A cap looks tidy in the CSS and leaves 200px of dead space when the
  owner turns shortcuts off (owner, Aug '26).
- Course tabs: `grid-template-columns:repeat(auto-fill,minmax(84px,1fr))`.
  `auto-fill`, not `auto-fit` — with `auto-fit` a lone tab on the last row
  stretches to the full width and dwarfs the others.

## `state.courseCount` is a CACHE, not the truth

`state.settings.courses` is the truth. `state.courseCount` is a copy,
refreshed only on load, on send, and when a table is opened — so editing
the course list in admin does not refresh it. Anything that asks "how many
courses are there?" must take the **max** of the two, never the cache alone.
That is why adding a 6th course never showed up in the docket.

## The docket has no lines and no total

Two rules, both owner-set (Aug '26), both easy to undo by accident:

- **No divider rules.** `.ticket-head` and `.course-tabs` used to carry a
  `border-bottom`. They do not. The gap between blocks does the dividing.
- **No running total.** The docket lists what was ordered. What it adds up to
  belongs to Pay, and only Pay. `.ticket-totals` is gone from the markup and
  from the stylesheet — do not put a Total, a Subtotal or a count back in the
  docket, however useful it looks.

## A number pad opens on the number it is changing

The price pad used to open blank on `$0.00`, so you could not see what you
were about to change. It now opens on the current value, and confirming
without typing is a no-op instead of a reset. The price it edits is the EACH
price, so when the line has more than one the header spells it out —
"Quail × 2 — each". Any new pad follows this: show the value, then let them
type over it.

## Height has to be passed DOWN, every step

`.admin-content` → `#admin-router` → `.design-split` → `.screen-ctl-scroll`.
Three of those four were flex columns with `min-height:0`; `.design-split`
was left a plain block, so it grew to its content (2354px) inside an 814px
pane with `overflow:hidden` and the controls below the fold could not be
reached at all (owner, Aug '26: "I cant scroll the options any more").
A pane that scrolls needs EVERY ancestor between it and the fixed-height
one to pass the height down. Check the whole chain, not the scroller.

## The Design page: ONE control, and the preview is a card

- **Every value is a stepper** — minus, the value, plus. Tiles across, tiles
  down, text size (`− M +`) and docket width (`− 360px +`). No sliders: a drag
  on a phone steals the scroll. No rows of chips: the owner called them messy
  (Aug '26, after seeing 12 alternatives). `stepper()` in `renderScreenAdmin`
  builds all of them.
- **The preview is a card like the rest** — same `--r-surface` corner, same
  1px border, same width, page showing all round it. It used to run edge to
  edge with square corners and read as chrome, not as one of the things on
  the page.
- **Tablet / Mobile are equal width.** "Mobile" is the longer word and was
  making its button 5px wider. `min-width:96px` on both.
- **The controls pane snaps to card tops.** Scrolling left a ~16px tail of the
  card above stuck under the preview — an empty rounded strip. A fade needs
  ~100px to hide a 16px stub and washes out card titles; snapping costs
  nothing visual. `proximity`, never `mandatory` — the two biggest cards are
  taller than the pane and mandatory strands their bottoms.

## The line editor: one screen, two states

A SENT line and an UNSENT line are the SAME screen (owner, Aug '26: "match the
item sent vs not sent"). Same rows, same order, same controls, built by
`renderLineEditMiddle` and `renderEditSentMiddle` — keep them in step.
`lineEditHead()` draws the head for both: dish name, what the line comes to,
and one line saying NOT SENT YET or SENT TO THE KITCHEN · ROUND n. Nothing on
the old unsent editor said which dish you were editing.

Only two things differ, and both are stated on screen, not implied:
- **What the kitchen already has is dim and dead** — size, modifiers, build,
  under `.le-locked`. Changing them after the ticket is a remake, not an edit.
- **Quantity means something else.** `＋` sends another serving, `−` asks why
  and voids one. The caption under the row says so.

**Seat and course stay live after sending.** They are the two that still matter
once the food is away — the right seat before a split, a later course. The
server grew a `move` action for it (`/api/orders/:id/modify-item`), which
touches `items` and `rounds` and never tells the kitchen, because the dish
has not changed. `doMoveSent` follows the line's new signature afterwards or
the next tap edits a line that no longer exists — and it moves
`state.activeCourse` with it, or the docket is still showing the course you
left and the line looks deleted.

## The gradient means ONE thing

`linear-gradient(120deg, var(--green-sel), var(--teal))` means "this is the
dish you picked off the menu". Nothing else. Seat, course, size and modifiers
are attributes OF a dish, so inside `.line-edit-pane` they use the ACCENT RING
instead — dim fill, accent edge, text left alone, the same style the item
options pop already used:

    border-color:var(--orange); background:var(--orange-dim);
    color:var(--text-primary); box-shadow:0 0 0 2px var(--orange);

Any new selectable control that is not a menu item gets the ring.
