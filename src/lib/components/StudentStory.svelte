<script>
	import { onMount } from 'svelte';
	import { sceneIn, sceneOut } from '#lib/motion.js';
	import WordReveal from '#lib/components/WordReveal.svelte';
	import CountUp from '#lib/components/CountUp.svelte';
	import { csv } from 'd3';
	import SurveyBars from '#lib/components/SurveyBars.svelte';
	import BelongingLines from '#lib/components/BelongingLines.svelte';
	import PlacesMap from '#lib/components/PlacesMap.svelte';
	import PlaceCloud from '#lib/components/PlaceCloud.svelte';
	import { cleanRow, COLUMNS, VIEWS } from '#lib/survey0.js';

	/**
	 * Storyboard for our own survey of undergrad students (static/survey_0.csv).
	 * Sticky charts on the right, text steps on the left (scrollama). Clicking a bar filters
	 * the other chart; "Clear filters" restores the full data.
	 */

	/** @type {import('#lib/survey0.js').Response[]} */
	let rows = $state([]);
	let error = $state('');

	const mentalHealthView = VIEWS.find((v) => v.field === 'mentalHealth');
	const belongingView = {
		...VIEWS.find((v) => v.field === 'connection'),
		title: 'Sense of belonging'
	};
	const views = /** @type {const} */ ([mentalHealthView, belongingView]);

	const palettes = {
		mentalHealth: ['var(--good-2)', 'var(--good-1)', 'var(--mid)', 'var(--bad-1)', 'var(--bad-2)'],
		connection: ['var(--bad-2)', 'var(--bad-1)', 'var(--mid)', 'var(--good-1)', 'var(--good-2)']
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
	// Mental health and connection define this chart's axes, so their filters don't apply to it;
	// any other filter does.
	let mhPoints = $derived.by(() => {
		const base = subset(['mentalHealth', 'connection']);
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
		const base = subset(['hours', 'connection']);
		return HOURS_GROUPS.map((h) => {
			const g = base.filter((r) => r.hours === h.value && r.connection != null);
			const pct = (/** @type {(c: number) => boolean} */ test) =>
				g.length ? (g.filter((r) => test(/** @type {number} */ (r.connection))).length / g.length) * 100 : 0;
			return { label: h.label, n: g.length, strong: pct((c) => c >= 4), weak: pct((c) => c <= 2) };
		});
	});
	let hoursSelected = $state('Very frequently');

	// Step 4 evidence. Student figures are computed from survey_0.csv (all 25 students);
	// City figures come from the Toronto Community Survey tables used in the first story.
	let evidence = $derived.by(() => {
		const all = rows;
		const strongPct = (/** @type {typeof rows} */ g) =>
			g.length ? Math.round((g.filter((r) => (r.connection ?? 0) >= 4).length / g.length) * 100) : 0;
		const byMh = (/** @type {string} */ m) => all.filter((r) => r.mentalHealth === m);
		const byHours = (/** @type {string} */ h) => all.filter((r) => r.hours === h);
		const noPlace = all.filter((r) => r.hasPlace === 'No').length;
		return {
			studentsExcellent: strongPct(byMh('Excellent')),
			studentsFair: strongPct(byMh('Fair')),
			studentsRarely: strongPct(byHours('Less than 3 hours')),
			studentsVeryOften: strongPct(byHours('More than 8 hours')),
			noPlace,
			noPlacePct: all.length ? Math.round((noPlace / all.length) * 100) : 0,
			total: all.length
		};
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

	/** @type {{ scene: 'bars' | 'lines' | 'hours' | 'message' | 'map' | 'cloud', kicker: string, title?: string, message?: string, text?: string[], findings?: string[] }[]} */
	const steps = [
		{
			scene: 'bars',
			kicker: 'Our survey',
			title: 'We conducted a survey among undergrad students (25 people)',
			findings: [
				'Only 32% of students (8 of 25) rate their mental health excellent or very good, compared with 52% of all Torontonians in the City survey. 28% (7) say fair or poor.',
				'48% (12) feel strongly connected (4 or 5 out of 5) to the people at their favourite place to socialize; 28% (7) feel weakly connected (1 or 2).',
				'The same link as in the City data: of the 7 students with fair or poor mental health, 5 feel weakly connected. Of the 8 with excellent or very good mental health, none do.',
				'Click a bar to see the other chart for just those students. With 25 people, treat these as signals, not firm numbers.'
			]
		},
		{
			scene: 'lines',
			kicker: 'Our survey · Belonging and mental health',
			title: 'Students show the same link as the city',
			findings: [
				'Students who rate their mental health excellent: 67% feel strongly connected and none weakly, the same 67% as Torontonians with excellent mental health.',
				'Students with fair mental health: 67% feel weakly connected and only 17% strongly (City: 63% weak).',
				'Students rating their mental health "good" still mostly feel connected (60% strong), so the switch comes at "fair", one step later than in the City data.',
				'Very good (2 students) and poor (1 student) are too small to read on their own. Click a rating on the chart to see its numbers.',
				'Different question: students rated their connection to people at their favourite place; the City asked about belonging to their local community.'
			]
		},
		{
			scene: 'hours',
			kicker: 'Our survey · Time spent and belonging',
			title: 'The more time students spend there, the more they belong',
			findings: [
				'Students who spend more than 8 hours a week at their favourite place: 83% feel strongly connected (5 of 6).',
				'Students who go rarely (less than 3 hours a week): only 22% feel strongly connected and 44% weakly, the only group where weak outnumbers strong.',
				'The same pattern as the City data, where strong belonging rises from 42% among people who never use community services to 70% among very frequent users.',
				'Spending time may build connection, or students who already feel connected may simply spend more time there. Groups have 4–9 students, so treat this as a signal. Click a group on the chart to see its numbers.'
			]
		},
		{
			scene: 'message',
			kicker: 'Main insight',
			message:
				"Mental health and belonging go hand in hand, and belonging needs a place to grow. Without third spaces, many people's mental health could be in trouble."
		},
		{
			scene: 'map',
			kicker: 'Falling action · Where the places are',
			title: 'Most students find their place around campus',
			findings: [
				'16 of 25 favourite places (64%) are within 2 km of U of T\'s St. George campus, and 8 are in the University neighbourhood itself: Hart House, the Athletic Centre, Bahen, dining halls.',
				'The places farther away (friends\' homes, a gym, a community group) are a little more often strongly connected: 5 of 9, compared with 7 of 16 near campus.',
				'3 places are outside Toronto\'s city limits.',
				'Zoom in with + / −, "Zoom to campus", or Ctrl/⌘ + scroll; drag to pan; click a dot to see the place and how that student answered.'
			]
		},
		{
			scene: 'cloud',
			kicker: 'Future actions',
			title: 'Encourage people to socialize!',
			text: [
				'This story keeps finding the same two links. Belonging goes with mental health: 67% of Torontonians and of our students with excellent mental health feel strongly connected, compared with 18% of Torontonians with poor mental health and 17% of students with fair mental health. And belonging grows where people spend time together: strong belonging rises from 42% to 70% among Torontonians who use community services more often, and from 22% to 83% among students who spend more hours at their favourite place. Yet 44% of the students we asked have no regular place to socialize outside home, school and work.',
				'That makes third spaces worth investing in: free or low-cost places, open when people are free, where they can keep coming back. The word cloud shows where students already find connection, and it can serve as a starting list: campus lounges and dining halls, gyms and recreation centres, parks, clubs and community groups, libraries, and informal spots such as pubs, friends\' homes and even online games. More of these, closer to where people live and study, gives belonging a place to grow.'
			]
		}
	];

	let active = $state(0);
	let progress = $state(0); // 0–1 through the active step, drives the word reveal
	let scene = $derived(steps[active].scene);
	/** @type {HTMLElement} */
	let stepsEl;

	onMount(() => {
		csv('/survey_0.csv', cleanRow)
			.then((d) => (rows = d))
			.catch((e) => (error = `Couldn't load survey_0.csv: ${e.message}`));

		/** @type {any} */
		let scroller;
		const onResize = () => scroller?.resize();
		// How far (0–1) the reader is through the active step, measured at the same 55% line as scrollama.
		const onScroll = () => {
			const el = stepsEl.querySelectorAll('.step')[active];
			if (!el) return;
			const r = el.getBoundingClientRect();
			progress = Math.min(1, Math.max(0, (innerHeight * 0.55 - r.top) / r.height));
		};
		addEventListener('scroll', onScroll, { passive: true });
		import('scrollama').then(({ default: scrollama }) => {
			scroller = scrollama();
			scroller
				.setup({ step: Array.from(stepsEl.querySelectorAll('.step')), offset: 0.55 })
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

<section class="story" aria-label="Story: our survey of undergrad students">
	<div class="graphic">
		<div class="stage">
			{#key scene}
				<div class="scene" in:sceneIn out:sceneOut>
					{#if scene === 'bars'}
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
								/>
							{/each}
						</div>
					{/if}
					{:else if scene === 'lines'}
						<BelongingLines
							id="students-mh"
							compact
							title="Belonging and mental health: our students"
							intro=""
							pickerLegend=""
							points={mhPoints}
							bind:selected={mhSelected}
							yMax={115}
							yTicks={[0, 25, 50, 75, 100]}
							nouns={['student', 'students']}
							lineLabels={['Strongly connected', 'Weakly connected']}
							phrases={['strongly connected', 'weakly connected']}
							heading={(label) => `Students with ${label.toLowerCase()} mental health`}
						/>
						<p class="note">
							Columns: “In general, how would you rate your mental health?” and “How connected do you feel to
							the people at this place? (1)”. Strongly connected = 4–5, weakly = 1–2 (out of 5). Click a
							rating to see its numbers.
						</p>
					{:else if scene === 'hours'}
						<BelongingLines
							id="students-hours"
							compact
							title="Time spent at favourite place and belonging"
							intro=""
							pickerLegend=""
							points={hoursPoints}
							bind:selected={hoursSelected}
							yMax={115}
							yTicks={[0, 25, 50, 75, 100]}
							nouns={['student', 'students']}
							lineLabels={['Strongly connected', 'Weakly connected']}
							phrases={['strongly connected', 'weakly connected']}
							heading={(label) =>
								`Students who spend ${HOURS_GROUPS.find((h) => h.label === label)?.detail ?? label} at their favourite place`}
						/>
						<p class="note">
							Columns: “How many hours weekly do you spend here? (1)” and “How connected do you feel to the
							people at this place? (1)”. Rarely = less than 3 hours a week, Occasionally = 3–5, Frequently =
							5–8, Very frequently = more than 8. Strongly connected = 4–5, weakly = 1–2. Click a group to see
							its numbers.
						</p>
					{:else if scene === 'message'}
						<div class="evidence">
							<section class="ev-group">
								<h2>Mental health and belonging go hand in hand</h2>
								<div class="tiles">
									<div class="tile">
										<p class="big"><span class="bad"><CountUp value={18} />%</span> vs <span class="good"><CountUp value={67} />%</span></p>
										<p class="what">of Torontonians with poor vs excellent mental health feel a strong sense of belonging</p>
										<p class="src">City survey · 7,222 residents</p>
									</div>
									<div class="tile">
										<p class="big">
											<span class="bad"><CountUp value={evidence.studentsFair} />%</span> vs <span class="good"><CountUp value={evidence.studentsExcellent} />%</span>
										</p>
										<p class="what">of students with fair vs excellent mental health feel strongly connected</p>
										<p class="src">Our survey · {evidence.total} students</p>
									</div>
								</div>
							</section>
							<section class="ev-group">
								<h2>Belonging needs a place to grow</h2>
								<div class="tiles">
									<div class="tile">
										<p class="big"><span class="bad"><CountUp value={42} />%</span> → <span class="good"><CountUp value={70} />%</span></p>
										<p class="what">strong belonging among Torontonians who never vs very frequently use community services</p>
										<p class="src">City survey · 7,222 residents</p>
									</div>
									<div class="tile">
										<p class="big">
											<span class="bad"><CountUp value={evidence.studentsRarely} />%</span> → <span class="good"><CountUp value={evidence.studentsVeryOften} />%</span>
										</p>
										<p class="what">
											of students strongly connected when they spend under 3 vs over 8 hours a week at their favourite place
										</p>
										<p class="src">Our survey · {evidence.total} students</p>
									</div>
									<div class="tile wide">
										<p class="big"><span class="bad"><CountUp value={evidence.noPlacePct} />%</span></p>
										<p class="what">
											of students ({evidence.noPlace} of {evidence.total}) have no regular place to socialize outside home,
											school and work
										</p>
										<p class="src">Our survey · column “Do you have a place you regularly go to socialize, outside of home, school, and work?”</p>
									</div>
								</div>
							</section>
						</div>
					{:else if scene === 'map'}
						<PlacesMap rows={subset(null)} total={rows.length} autoCampus />
					{:else if scene === 'cloud'}
						<PlaceCloud rows={subset(null)} total={rows.length} column={COLUMNS.placeType} />
					{/if}
				</div>
			{/key}
		</div>
	</div>

	<div class="steps" bind:this={stepsEl}>
		{#each steps as s, i (i)}
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
</section>

<style>
	.evidence {
		display: grid;
		gap: 1.5rem;
	}
	.ev-group {
		display: grid;
		gap: 0.7rem;
	}
	.ev-group h2 {
		margin: 0;
		font: 700 clamp(1.8rem, 2.6vw, 2.2rem) / 1.05 var(--font-display);
	}
	.tiles {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem;
	}
	@media (max-width: 560px) {
		.tiles {
			grid-template-columns: 1fr;
		}
	}
	.tile {
		display: grid;
		align-content: start;
		gap: 0.4rem;
		padding: 1.1rem 1.2rem;
		background: var(--surface);
		border: 2px solid var(--ink);
		border-radius: var(--wobble);
		box-shadow: var(--shadow);
		animation: tile-in 700ms var(--ease-out) backwards;
	}
	.tile:nth-child(2) {
		animation-delay: 120ms;
	}
	.tile:nth-child(3) {
		animation-delay: 240ms;
	}
	.ev-group + .ev-group .tile {
		animation-delay: 300ms;
	}
	.ev-group + .ev-group .tile:nth-child(2) {
		animation-delay: 420ms;
	}
	.ev-group + .ev-group .tile:nth-child(3) {
		animation-delay: 540ms;
	}
	@keyframes tile-in {
		from {
			opacity: 0;
			transform: translateY(20px) scale(0.97);
		}
	}
	.tile.wide {
		grid-column: 1 / -1;
	}
	.tile p {
		margin: 0;
	}
	.big {
		font: 700 clamp(2.6rem, 5vw, 3.6rem) / 0.95 var(--font-display);
		color: var(--muted);
	}
	.big .good {
		color: var(--good-2);
	}
	.big .bad {
		color: var(--bad-2);
	}
	.what {
		font-size: 1rem;
		line-height: 1.4;
	}
	.src {
		font-family: var(--font-mono);
		font-size: 0.85rem;
		color: var(--muted);
	}
	.para {
		font-size: 0.92rem;
		line-height: 1.65;
	}
	.card.main {
		padding-block: 1.8rem;
	}
	.note {
		margin: 0;
		font-size: 0.75rem;
		color: var(--muted);
		line-height: 1.45;
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
