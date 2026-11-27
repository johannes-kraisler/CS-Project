# CLAUDE.md

Guidance for working on this project. Read it before making changes.

## Project overview

**Wellbeing and Belonging by Age** is a scrollytelling website about mental health, sense of
belonging and third spaces in Toronto. It is a University of Toronto course project, built with
SvelteKit (Svelte 5), D3 and scrollama, in a hand-drawn "sketchbook" style.

The story has two chapters:

1. **Chapter 01 – The city.** Weighted results from the City of Toronto Public Survey
   (7,222 residents): mental health and belonging by age, then how belonging relates to mental
   health and to the use of community services.
2. **Chapter 02 – Our students.** Our own survey of 25 University of Toronto undergraduates
   (4 November 2026): mental health, connection, time spent at a favourite place, where those
   places are, and which of them are third spaces.

## Running the project

```sh
npm install
npm run dev -- --open      # http://localhost:5173
npm run build && npm run preview
```

Type-check with `npx svelte-check --threshold error`. The project currently has **16
pre-existing type errors** (D3 typings and JSDoc gaps). A change must not add new ones; compare the
count before and after.

## Repository layout

| Path | Contents |
|---|---|
| `src/routes/+page.svelte` | Page order: hero, Chapter 01 opener, `Story`, Chapter 02 opener, `StudentStory`, sources footer |
| `src/routes/+layout.svelte` | Fonts and the shared SVG `#sketch` / `#sketch-strong` pen-wobble filters |
| `src/lib/components/Story.svelte` | Chapter 01: steps, sticky charts, statement slides, third-spaces slide |
| `src/lib/components/StudentStory.svelte` | Chapter 02: quiz, steps, sticky charts, live figures |
| `src/lib/components/` | Charts (`BarChart`, `SurveyBars`, `BelongingLines`, `PlacesMap`, `PlaceCloud`) and story pieces (`ChapterOpener`, `Interlude`, `ThirdSpaces`, `YourAnswers`, `WordReveal`, `Backdrop`, `ClassroomBackdrop`, `Hud`, `CountUp`) |
| `src/lib/survey0.js` | Cleaning and grouping rules for the student survey |
| `src/lib/data/*.json` | Chapter 01 figures extracted from the City survey tables |
| `src/lib/styles/theme.css` | Colour tokens, fonts and the shared scrollytelling layout |
| `static/` | `survey_0.csv`, the City survey Excel tables, the neighbourhood GeoJSON and images |

## Story structure and scroll behaviour

- Each **kind** of chart has its own sticky `<section class="story">`, so a chart scrolls away with
  its cards and the next one scrolls in. Do not swap unrelated charts inside one sticky panel.
- Charts of the **same kind** share one frame and rewrite only what changes. For example, the
  mental-health and community-services line charts in Chapter 01, and the mental-health and
  time-spent charts in Chapter 02, use one `BelongingLines`. Its axes and gridlines stay in place
  while the title, lines, labels and summary fade over.
- Step cards are yellow sticky notes. Their numbers (`01 / 05`) are generated, so adding or
  removing a step renumbers them automatically.
- Full-screen statements use `Interlude`: large hand-lettered text over the faint city sketch,
  with two yellow stars that draw themselves in.
  - Pass `small` for long statements and `lower` to sit the text lower on the screen.
  - The `highlight` prop takes `"last-line"`, `"all"`, `"none"` or `"marked"`. With `"marked"`,
    wrap the words to highlight in `[[double brackets]]`; a marked phrase may span line breaks.
  - Use `\n` in the text for line breaks.
- Chapter 01 currently runs: opener → age bar charts (55+, then 18–34) → "So, how can mental
  health be improved…" → line charts → "So, Belonging and Community Services…" → third-spaces
  slide with Ray Oldenburg.
- Chapter 02 currently runs: opener → "How about you?" quiz → survey bars → line charts → map →
  "Mental health and belonging go hand in hand…" → "Without 3rd Spaces…" with the "no regular
  place to socialize" figure → word cloud.
- `Interlude` can show extra content under its statement (pass it as children), as the
  "Without 3rd Spaces…" slide does with its figure.

## Data rules

### City of Toronto survey (Chapter 01)

- Percentages use the weighted counts and are shares of **all** respondents in the group,
  including "Don't know" and no answer. This is stated in the sources footer.
- Combined age groups are built by summing weighted counts, never by averaging percentages. The
  `18-34` group in `survey-by-age.json` is `18-24` plus `25-34`.

### Student survey (Chapter 02)

- Read through `cleanRow` in `src/lib/survey0.js`. Never change the CSV.
- Only the "(1)" columns are used; "(2)" columns are ignored. Multi-select answers keep the first
  value.
- Student percentages are unweighted shares of the students who answered that question.
- Connection is on a 1–5 scale. Strongly connected = 4–5 and weakly connected = 1–2.

### Third spaces

A **third space** (Ray Oldenburg) is a place outside home (the first place) and school or work
(the second place) where people go to socialize and connect with their community, not to study or
work.

- Every favourite place is put into one group in `survey0.js`:
  - Third-space groups: Campus social space; Pub, bar, café; Friend's place; Gym or rec centre;
    Park or outdoors; Club or community group; Religious space; Events; Online gaming.
  - Everything else goes into **Not a third space**: the student's own home, school or academic
    buildings, libraries, and "no place".
- The place **name** decides the group when it is clearer than the ticked type (`NAME_GROUP`).
  For example, "Cafe" was ticked as Library, and the Bahen Centre is an academic building.
- Long free-text names are shortened for display (`NAME_SHORT`), e.g. "Cool events".
- `PLACE_TYPES` and `PLACE_STYLE` are the single source of group names, order and colours. The
  word cloud, the map and the quiz must all read from them.
- The "no regular place to socialize" figure counts the **Not a third space** group. Do not use the separate
  yes/no question "Do you have a place you regularly go to socialize…?": many students answered
  "No" while still naming a café, park or lounge.

## Bar-chart filters

Clicking a bar in Chapter 02's first two charts filters **only the other bar chart**. The line
charts, the map and the word cloud always show all students (plus the reader, if added).

## The reader's answers (quiz)

- `YourAnswers` asks four of the survey's questions: mental health, connection, favourite place
  (by third-space group, or "No place") and weekly time spent there (the time-spent chart's groups). When the reader adds their answers, they become
  one extra row (`id: -1`) in Chapter 02's data.
- The answers live in memory only. Never store them, send them anywhere, or keep them across a
  refresh.
- Every Chapter 02 figure that depends on the data must stay live: the charts, the first card's
  percentages, the "no regular place to socialize" figure and the closing paragraph. Use `$derived` values or
  getters, not hard-coded numbers.
- Charts mark the reader's answer with a hand-drawn arrow and "you are here". The marker must
  never overlap labels, numbers, titles or other bubbles; check this with a screenshot.
- The quiz does not ask for a location, so the map shows no marker.

## Visual design

- **Style:** notebook paper, ink outlines, wobbly corners (`--wobble`, `--wobble-sm`), hard ink
  shadows (`--shadow`), hatched bar fills and the `#sketch` filter for a pen wobble.
- **Fonts:** Caveat for display text, Kalam for body text, Patrick Hand for small "mono" labels.
- **Colours:** only the Okabe-Ito tokens in `theme.css`. Use the data roles consistently:
  - Blue means good or strong; orange to vermillion means bad or weak; yellow means in between.
  - Order categorical scales from best to worst, e.g. mental health from Excellent to Poor and
    connection from 5 to 1.
  - Yellow (`--oi-yellow`) is the highlighter and the stars.
  - Reddish purple (`--accent`) is the annotation colour: progress bar, markers, captions such as
    "Ray Oldenburg, Sociologist", and the "you are here" marker. When purple is used for text,
    deepen it with `color-mix(in srgb, var(--accent) 80%, var(--ink))` so it stays readable.
    Never use it for body text.
- **Decoration:** yellow stars that draw themselves in, the faint Toronto sketch (`Backdrop`) and
  the classroom sketch (`ClassroomBackdrop`). Background pictures must be faded and must clear
  away behind text.
- **Motion:** entrances are triggered when an element scrolls into view (`inview`), not when it
  mounts. Every animation must respect `prefers-reduced-motion`.
- Layouts must work at phone width with no sideways scrolling.

## Writing style for on-page text

- Keep the text short and plain. When the team removes a sentence, do not reintroduce it
  elsewhere.
- Do not show data-plumbing text to readers: no "Column: …" captions, no "(1)" suffixes and no
  interaction hints such as "Drag to pan" or "Click a bar to filter".
- Titles use sentence case and have no full stop.
- Use Canadian/British spelling ("favourite", "centre") and "Torontonians" for residents.
- Card findings state one point each. Statement slides use deliberate line breaks.
- Credit external images and people on the page.

## Working with Git

- The remote is `johannes-kraisler/CS-Project`. Work on `main`; a teammate pulls from it.
- Commit and push only when asked. Stage the files that changed by name, never `git add -A`.
- Do not commit the local working files `STYLE_PROMPT.md`, `style-update.patch` or `.Rhistory`.
- Commit messages: a short summary line, then a few lines on what changed and why.

## Checking a change

1. The page loads at `http://localhost:5173/` without errors in the dev server log.
2. `npx svelte-check --threshold error` reports no more than the 16 pre-existing errors and no
   new warnings. Remove CSS selectors that a change leaves unused.
3. For anything visual, take a screenshot at desktop (1440×900) and phone (390×844) widths and
   check overlaps, line breaks and colours.
4. For anything that depends on the quiz, test with and without the reader's answers, and after
   "Remove my answers".
