<script>
	import { onMount } from 'svelte';
	import { inview } from '#lib/inview.js';
	import WordReveal from '#lib/components/WordReveal.svelte';
	import CountUp from '#lib/components/CountUp.svelte';
	import { csv } from 'd3';
	import SurveyBars from '#lib/components/SurveyBars.svelte';
	import BelongingLines from '#lib/components/BelongingLines.svelte';
	import PlacesMap from '#lib/components/PlacesMap.svelte';
	import PlaceCloud from '#lib/components/PlaceCloud.svelte';
	import YourAnswers from '#lib/components/YourAnswers.svelte';
	import Interlude from '#lib/components/Interlude.svelte';
	import { cleanRow, COLUMNS, NOT_THIRD, VIEWS } from '#lib/survey0.js';

	/**
	 * Storyboard for our own survey of undergrad students (static/survey_0.csv).
	 * Sticky charts on the right, text steps on the left (scrollama). Clicking a bar filters
	 * the other chart; "Clear filters" restores the full data.
	 */

	/** @type {import('#lib/survey0.js').Response[]} */
	let surveyRows = $state([]);
	// The reader's own answers from the quiz, added as one extra student. Kept in memory only,
	// so they vanish on refresh.
	/** @type {import('#lib/survey0.js').Response | null} */
	let you = $state(null);
	let rows = $derived(you ? [...surveyRows, you] : surveyRows);
	/** @param {{ mentalHealth: string, connection: number, placeType: string, hours: string } | null} a */
	const setYou = (a) =>
		(you = a && {
			id: -1,
			loneliness: null,
			placeName: 'You',
			hours: a.hours,
			created: null,
			age: null,
			mentalHealth: a.mentalHealth,
			hasPlace: 'Yes',
			connection: a.connection,
			placeType: a.placeType,
			x: null,
			y: null
		});
	let error = $state('');

	const mentalHealthView = VIEWS.find((v) => v.field === 'mentalHealth');
	const belongingView = {
		...VIEWS.find((v) => v.field === 'connection'),
		title: 'Sense of belonging',
		// Wording shown under the chart title (the CSV column itself is unchanged)
		question: 'How connected do you feel to the people in your surroundings?',
		categories: [5, 4, 3, 2, 1] // best to worst, like the mental health chart
	};
	const views = /** @type {const} */ ([mentalHealthView, belongingView]);

	const palettes = {
		mentalHealth: ['var(--good-2)', 'var(--good-1)', 'var(--mid)', 'var(--bad-1)', 'var(--bad-2)'],
		connection: ['var(--good-2)', 'var(--good-1)', 'var(--mid)', 'var(--bad-1)', 'var(--bad-2)']
	};

	/** @type {Record<string, string | number>} */
	let filters = $state({});
	let activeFilters = $derived(Object.entries(filters));

	/** Rows matching every filter except those in `skip` (so a view still shows all of its own categories). */
	const subset = (/** @type {string | string[] | null} */ skip) => {
		const skips = skip == null ? [] : [skip].flat();
		return rows.filter((r) =>
			Object.entries(filters).every(([f, v]) => skips.includes(f) || r[/** @type {keyof typeof r} */ (f)] === v)
		);
	};

	// Step 2: % strongly (4-5) / weakly (1-2) connected at each mental health rating.
	// Always all students: clicking a bar filters only the other bar chart, never the later charts.
	let mhPoints = $derived.by(() => {
		const base = rows;
		return (mentalHealthView?.categories ?? []).map((m) => {
			const g = base.filter((r) => r.mentalHealth === m && r.connection != null);
			const pct = (/** @type {(c: number) => boolean} */ test) =>
				g.length ? (g.filter((r) => test(/** @type {number} */ (r.connection))).length / g.length) * 100 : 0;
			return { label: String(m), n: g.length, strong: pct((c) => c >= 4), weak: pct((c) => c <= 2) };
		});
	});
	let mhSelected = $state('Fair');

	// Step 3: same measures by weekly hours spent at the favourite place, grouped as
	// Rarely (<3 h), Occasionally (3–5 h), Frequently (5–8 h), Very frequently (8+ h).
	const HOURS_GROUPS = [
		{ value: 'Less than 3 hours', label: 'Rarely', detail: 'less than 3 hours a week' },
		{ value: '3–5 hours', label: 'Occasionally', detail: '3–5 hours a week' },
		{ value: '5–8 hours', label: 'Frequently', detail: '5–8 hours a week' },
		{ value: 'More than 8 hours', label: 'Very frequently', detail: 'more than 8 hours a week' }
	];
	let hoursPoints = $derived.by(() => {
		const base = rows; // all students, like the chart above
		return HOURS_GROUPS.map((h) => {
			const g = base.filter((r) => r.hours === h.value && r.connection != null);
			const pct = (/** @type {(c: number) => boolean} */ test) =>
				g.length ? (g.filter((r) => test(/** @type {number} */ (r.connection))).length / g.length) * 100 : 0;
			return { label: h.label, n: g.length, strong: pct((c) => c >= 4), weak: pct((c) => c <= 2) };
		});
	});
	let hoursSelected = $state('Very frequently');

	// The reader's point on the line chart now showing: their mental health rating, or their
	// time-spent group, with their connection score deciding which line the arrow points at
	let youLine = $derived.by(() => {
		if (!you || you.connection == null) return null;
		const label =
			lineScene === 'lines' ? you.mentalHealth : HOURS_GROUPS.find((h) => h.value === you?.hours)?.label;
		return label ? { label, connection: you.connection } : null;
	});

	// Share of students whose favourite place is not a Third Place (home, school, library or
	// nowhere), shown above the word cloud. Based on the place grouping, not the separate yes/no
	// question, which many students answered "No" while still naming a café, park or lounge.
	let evidence = $derived.by(() => {
		const noPlace = rows.filter((r) => r.placeType === NOT_THIRD).length;
		return { noPlace, noPlacePct: rows.length ? Math.round((noPlace / rows.length) * 100) : 0, total: rows.length };
	});

	let filteredCount = $derived(subset(null).length);

	/** @param {string} field @param {string | number} value */
	const toggle = (field, value) => {
		if (filters[field] === value) {
			const { [field]: _, ...rest } = filters;
			filters = rest;
		} else {
			filters = { ...filters, [field]: value };
		}
	};
	const clear = () => (filters = {});

	/** @param {string} field @param {string | number} value */
	const filterLabel = (field, value) => {
		const v = VIEWS.find((x) => x.field === field);
		const name = field === 'connection' ? 'Belonging' : v?.title;
		return `${name}: ${v?.label ? v.label(value) : value}`;
	};

	// Headline shares for the first card (of students who answered each question)
	let shares = $derived.by(() => {
		const mh = rows.filter((r) => r.mentalHealth != null);
		const conn = rows.filter((r) => r.connection != null);
		const pct = (/** @type {number} */ k, /** @type {number} */ n) => (n ? Math.round((k / n) * 100) : 0);
		const mhIn = (/** @type {string[]} */ v) => mh.filter((r) => v.includes(/** @type {string} */ (r.mentalHealth))).length;
		return {
			mhHigh: pct(mhIn(['Excellent', 'Very good']), mh.length),
			mhLow: pct(mhIn(['Fair', 'Poor']), mh.length),
			strong: pct(conn.filter((r) => /** @type {number} */ (r.connection) >= 4).length, conn.length),
			weak: pct(conn.filter((r) => /** @type {number} */ (r.connection) <= 2).length, conn.length)
		};
	});

	/** @type {{ scene: 'bars' | 'lines' | 'hours' | 'map' | 'cloud', kicker: string, title?: string, message?: string, text?: string[], findings?: string[] }[]} */
	const steps = [
		{
			scene: 'bars',
			kicker: 'Our survey',
			title: 'Only a third of students rate their mental health highly',
			// Computed live, so the figures include the reader once they add their answers
			get findings() {
				return [
					`Only ${shares.mhHigh}% of students rate their mental health as excellent or very good. ${shares.mhLow}% say fair or poor.`,
					`${shares.strong}% feel very or quite connected; ${shares.weak}% feel weakly connected.`
				];
			}
		},
		{
			scene: 'lines',
			kicker: 'Our survey · Belonging and mental health',
			title: 'Students show the same trend as Torontonians',
			findings: ['Strong mental health reports strong connection, while negative mental health trends toward weak connection.']
		},
		{
			scene: 'hours',
			kicker: 'Our survey · Time spent and belonging',
			title: 'Spending time at Third Places builds connection',
			findings: ['The more time spent at Third Places, students reported stronger belonging']
		},
		{
			scene: 'map',
			kicker: 'Where the places are',
			title: 'Most students find their place around campus',
			findings: [
				'16 of 25 favourite places (64%) are within 2 km of U of T\'s St. George campus, and 8 are in the University neighbourhood itself: Hart House, the Athletic Centre, Bahen, dining halls.'
			]
		},
		{
			scene: 'cloud',
			kicker: 'Future actions',
			title: 'Third Places are worth investing in!',
			text: [
				'More places of socialization, community, and belonging.',
				'Not Home or Work, but free or low-cost places of gathering.',
				'More of these gives belonging a place to grow.'
			]
		}
	];

	let active = $state(0);
	let progress = $state(0); // 0–1 through the active step, drives the word reveal

	// Like Chapter 01: each kind of chart gets its own sticky section, so one chart scrolls off with its
	// cards and the next scrolls on. The two line charts share one frame whose contents are rewritten
	// in place when moving from mental health to time spent.
	const idx = steps.map((_, i) => i);
	/** @param {string[]} scenes */
	const group = (...scenes) => idx.filter((i) => scenes.includes(steps[i].scene));
	const sections = {
		bars: group('bars'),
		lines: group('lines', 'hours'),
		map: group('map'),
		cloud: group('cloud')
	};
	/** The step a section's chart shows: the active one if it's in the section, else its nearest end. */
	const shownIn = (/** @type {number[]} */ s) =>
		s.includes(active) ? active : active < s[0] ? s[0] : s[s.length - 1];
	let lineScene = $derived(steps[shownIn(sections.lines)].scene);
	let evidenceSeen = $state(false); // the evidence tiles animate in when first scrolled into view
	/** @type {HTMLElement} */
	let rootEl;

	onMount(() => {
		csv('/survey_0.csv', cleanRow)
			.then((d) => (surveyRows = d))
			.catch((e) => (error = `Couldn't load survey_0.csv: ${e.message}`));

		/** @type {any} */
		let scroller;
		const onResize = () => scroller?.resize();
		// How far (0–1) the reader is through the active step, measured at the same 55% line as scrollama.
		const onScroll = () => {
			const el = rootEl.querySelectorAll('.step')[active];
			if (!el) return;
			const r = el.getBoundingClientRect();
			progress = Math.min(1, Math.max(0, (innerHeight * 0.55 - r.top) / r.height));
		};
		addEventListener('scroll', onScroll, { passive: true });
		import('scrollama').then(({ default: scrollama }) => {
			scroller = scrollama();
			scroller
				.setup({ step: Array.from(rootEl.querySelectorAll('.step')), offset: 0.55 })
				.onStepEnter((/** @type {{ index: number }} */ r) => {
					active = r.index;
					onScroll();
				});
			window.addEventListener('resize', onResize);
		});
		return () => {
			scroller?.destroy();
			window.removeEventListener('resize', onResize);
			removeEventListener('scroll', onScroll);
		};
	});
</script>


{#snippet cards(/** @type {number[]} */ section)}
	<div class="steps">
		{#each section as i (i)}
			{@const s = steps[i]}
			<div class="step" class:is-active={i === active} data-step={i}>
				<div class="card" class:main={!!s.message}>
					<div class="card-top">
						<p class="kicker mono">{s.kicker}</p>
						<span class="step-no mono">{String(i + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</span>
					</div>
					{#if s.message}
						<p class="statement">
							<WordReveal text={s.message} progress={i === active ? progress : i < active ? 1 : 0} />
						</p>
					{/if}
					{#if s.title}
						<h3>{s.title}</h3>
					{/if}
					{#each s.text ?? [] as t}
						<p class="para">{t}</p>
					{/each}
					{#if s.findings}
						<div class="findings">
							<p class="findings-head mono">Key findings</p>
							<ul>
								{#each s.findings as f}
									<li>{f}</li>
								{/each}
							</ul>
						</div>
					{/if}
				</div>
			</div>
		{/each}
		<div class="tail" aria-hidden="true"></div>
	</div>
{/snippet}

<div bind:this={rootEl} role="region" aria-label="Story: our survey of undergrad students">
	<YourAnswers onchange={setYou} total={rows.length} />

	<section class="story" aria-label="Our survey: mental health and belonging">
		<div class="graphic">
			<div class="stage">
				<div class="scene">
				<div class="toolbar">
					<p class="count">
						Showing <b>{filteredCount}</b> of {rows.length} students
					</p>
					{#each activeFilters as [field, value] (field)}
						<button type="button" class="chip" onclick={() => toggle(field, value)} title="Remove this filter">
							{filterLabel(field, value)} <span aria-hidden="true">×</span>
						</button>
					{/each}
					<button type="button" class="clear" onclick={clear} disabled={!activeFilters.length}>Clear filters</button>
				</div>

				{#if error}
					<p class="error">{error}</p>
				{:else}
					<div class="pair">
						{#each views as view (view.field)}
							<SurveyBars
								{view}
								rows={subset(view.field)}
								total={rows.length}
								selected={filters[view.field] ?? null}
								colors={palettes[/** @type {'mentalHealth' | 'connection'} */ (view.field)]}
								onselect={(v) => toggle(view.field, v)}
								youPlacement={view?.field === 'mentalHealth' ? 'left' : 'below'}
							/>
						{/each}
					</div>
				{/if}
				</div>
			</div>
		</div>
		{@render cards(sections.bars)}
	</section>
	<section class="story" aria-label="Our survey: belonging, mental health and time spent">
		<div class="graphic">
			<div class="stage">
				<div class="scene">
					<BelongingLines
						id="students-lines"
						compact
						title={lineScene === 'lines'
							? 'Belonging and mental health: our students'
							: 'Time spent at favourite Third Place and belonging'}
						intro=""
						pickerLegend=""
						points={lineScene === 'lines' ? mhPoints : hoursPoints}
						bind:selected={
							() => (lineScene === 'lines' ? mhSelected : hoursSelected),
							(v) => (lineScene === 'lines' ? (mhSelected = v) : (hoursSelected = v))
						}
						yMax={115}
						yTicks={[0, 25, 50, 75, 100]}
						nouns={['student', 'students']}
						lineLabels={['Strongly connected', 'Weakly connected']}
						phrases={['strongly connected', 'weakly connected']}
						xLabel={lineScene === 'lines' ? 'Self-rated mental health' : 'Time spent at favourite Third Place each week'}
						namedBand={lineScene === 'hours'}
						you={youLine}
						heading={lineScene === 'lines'
							? (label) => `Students with ${label.toLowerCase()} mental health`
							: (label) =>
									`Students who spend ${HOURS_GROUPS.find((h) => h.label === label)?.detail ?? label} at their favourite place`}
					/>
				</div>
			</div>
		</div>
		{@render cards(sections.lines)}
	</section>
	<section class="story" aria-label="Where the places are">
		<div class="graphic">
			<div class="stage">
				<div class="scene">
					<PlacesMap {rows} total={rows.length} autoCampus />
				</div>
			</div>
		</div>
		{@render cards(sections.map)}
	</section>
	<!-- Main insight, as two full-screen statements in the same style as the chapter 01 questions -->
	<Interlude
		small
		lower
		highlight="marked"
		text={"Mental health and belonging [[go hand in hand]],\nand belonging [[needs a place to grow]]"}
	/>

	<Interlude small highlight="all" text={"Without Third Places, many people's\nmental health could be in trouble…"}>
		<!-- Live: counts the "Not a Third Place" group, including the reader's quiz answer -->
		<div class="tile" class:seen={evidenceSeen} use:inview={() => (evidenceSeen = true)}>
			<p class="big"><span class="bad"><CountUp value={evidenceSeen ? evidence.noPlacePct : 0} />%</span></p>
			<p class="what">of students reported no regular place to socialize outside of home, school, and work…</p>
		</div>
	</Interlude>

	<section class="story" aria-label="Future actions">
		<div class="graphic">
			<div class="stage">
				<div class="scene">
					<PlaceCloud {rows} total={rows.length} column={COLUMNS.placeType} />
				</div>
			</div>
		</div>
		{@render cards(sections.cloud)}
	</section>
</div>

<style>
	/* As in Chapter 01: each chart centres in its sticky panel */
	.graphic .stage {
		height: 100%;
	}
	.graphic .scene {
		align-self: center;
	}
	@media (max-width: 900px) {
		.graphic .scene {
			align-self: start;
		}
	}
	/* "No regular place to socialize" figure under the main-insight statement: number left, words right */
	.tile {
		max-width: 40rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.6rem;
		background: var(--surface);
		border: 2px solid var(--ink);
		border-radius: var(--wobble);
		box-shadow: var(--shadow);
		opacity: 0;
	}
	.tile.seen {
		opacity: 1;
		animation: tile-in 700ms var(--ease-out) backwards;
	}
	@keyframes tile-in {
		from {
			opacity: 0;
			transform: translateY(20px) scale(0.97);
		}
	}
	.tile p {
		margin: 0;
	}
	.big {
		font: 700 clamp(3rem, 6vw, 4.6rem) / 0.95 var(--font-display);
	}
	.big .bad {
		color: var(--bad-2);
	}
	.what {
		font-size: clamp(1.05rem, 1.6vw, 1.3rem);
		line-height: 1.4;
	}
	.para {
		font-size: 0.92rem;
		line-height: 1.65;
	}
	.card.main {
		padding-block: 1.8rem;
	}
	.toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem 0.6rem;
		font-size: 0.85rem;
	}
	.count {
		margin: 0 0.4rem 0 0;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
	.count b {
		color: var(--fg);
	}
	.chip,
	.clear {
		font: inherit;
		font-size: 0.8rem;
		padding: 0.35rem 0.8rem;
		border-radius: 999px;
		cursor: pointer;
		transition:
			background 200ms ease,
			border-color 200ms ease;
	}
	.chip {
		border: 1.5px solid var(--ink);
		background: var(--highlight);
		color: var(--ink);
		font-weight: 700;
	}
	.clear {
		border: 1.5px solid var(--ink);
		background: var(--surface);
		color: var(--fg);
	}
	.clear:not(:disabled):hover {
		border-color: var(--accent);
	}
	.clear:disabled {
		opacity: 0.5;
		cursor: default;
	}
	.chip:focus-visible,
	.clear:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.error {
		color: var(--bad-2);
	}
</style>
