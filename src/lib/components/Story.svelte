<script>
	import { onMount } from 'svelte';
	import { sceneIn } from '#lib/motion.js';
	import WordReveal from '#lib/components/WordReveal.svelte';
	import BarChart from '#lib/components/BarChart.svelte';
	import BelongingLines from '#lib/components/BelongingLines.svelte';

	/**
	 * Scrollytelling storyboard: a sticky chart panel that changes as text steps scroll past
	 * (driven by scrollama).
	 * @type {{
	 *   data: any,
	 *   palettes: Record<string, string[]>,
	 *   mhPoints: { label: string, n: number, strong: number, weak: number }[],
	 *   servicePoints: { label: string, detail: string, n: number, strong: number, weak: number }[]
	 * }}
	 */
	let { data, palettes, mhPoints, servicePoints } = $props();

	/**
	 * @typedef {{ scene: 'age' | 'mh' | 'services', age?: string, selected?: string,
	 *   hook?: string, title?: string, text?: string[], findings?: string[] }} Step
	 * @type {Step[]}
	 */
	const steps = [
		{
			scene: 'age',
			age: '18-24',
			title: 'Mental health improves with age',
			text: [
				'Younger adults (18–34) report the worst mental health.',
				'About a third of 18–24s say Fair or Poor (32%), and 12% say Poor, which is twice the city average.'
			]
		},
		{
			scene: 'age',
			age: '25-34',
			title: '25–34s feel the least connected',
			text: [
				'They are the only age group where most people (53%) report a weak sense of belonging.',
				'Their mental health is almost as low as 18–24s: 31% say Fair or Poor (city average 21%), and only 38% say Excellent or Very good.'
			]
		},
		{
			scene: 'age',
			age: '55+',
			title: 'People 55+ feel the most connected',
			text: [
				'58% strong and 34% weak.',
				'They also report the best mental health: 67% say Excellent or Very good (city average 52%), and only 12% say Fair or Poor.'
			]
		},
		{
			scene: 'mh',
			selected: 'Poor',
			title: 'Belonging and mental health go together',
			findings: [
				'The better people rate their mental health, the more likely they are to feel a strong sense of belonging.',
				'This shows the two go together.'
			]
		},
		{
			scene: 'services',
			selected: 'Very frequently',
			title: 'People who use community services feel they belong more',
			findings: [
				'The more often people use community centres and programs, the stronger their sense of belonging.'
			]
		}
	];

	let active = $state(0);
	let progress = $state(0); // 0–1 through the active step, drives the word reveal

	// Two chapters, each with its own sticky chart: the age bar charts, then the belonging line charts.
	// Splitting them means the bar charts scroll off the page and the line chart scrolls on,
	// just like the cards, instead of swapping in place.
	const idx = steps.map((_, i) => i);
	const chapters = [idx.filter((i) => steps[i].scene === 'age'), idx.filter((i) => steps[i].scene !== 'age')];
	/** The step a chapter's chart shows: the active one if it's in the chapter, else its nearest end. */
	const shownIn = (/** @type {number[]} */ ch) =>
		ch.includes(active) ? active : active < ch[0] ? ch[0] : ch[ch.length - 1];

	let ageStep = $derived(steps[shownIn(chapters[0])]);
	let lineStep = $derived(steps[shownIn(chapters[1])]);
	let age = $derived(ageStep.age ?? 'all');
	let ageLabel = $derived(data.ageGroups.find((/** @type {any} */ g) => g.id === age)?.label ?? 'All ages');

	let mentalHealth = $derived(data.questions.find((/** @type {any} */ q) => q.id === 'mental_health'));
	let belonging = $derived(data.questions.find((/** @type {any} */ q) => q.id === 'belonging'));

	/** @param {string} label */
	const mhHeading = (label) => `People with ${label.toLowerCase()} mental health`;
	/** @param {string} label */
	const serviceHeading = (label) => {
		const p = servicePoints.find((x) => x.label === label);
		return label === 'Never'
			? 'People who never used community services'
			: `People who used services ${label.toLowerCase()} (${p?.detail} a year)`;
	};

	/** @type {HTMLElement} */
	let rootEl;

	onMount(() => {
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

{#snippet cards(/** @type {number[]} */ chapter)}
	<div class="steps">
		{#each chapter as i (i)}
			{@const s = steps[i]}
			<div class="step" class:is-active={i === active} data-step={i}>
				<div class="card" class:hook={!!s.hook}>
					<div class="card-top corner">
						<span class="step-no mono">{String(i + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</span>
					</div>
					{#if s.hook}
						<p class="statement">
							<WordReveal text={s.hook} progress={i === active ? progress : i < active ? 1 : 0} />
						</p>
						<p class="hint mono" aria-hidden="true">Keep scrolling ↓</p>
					{/if}
					{#if s.title}
						<h3>{s.title}</h3>
					{/if}
					{#each s.text ?? [] as t}
						<p>{t}</p>
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

<div bind:this={rootEl} role="region" aria-label="Story: wellbeing and belonging in Toronto">
	<section class="story">
		<div class="graphic">
			<div class="stage">
				<div class="scene">
					<p class="scene-label mono">
						Showing
						{#key ageLabel}
							<b in:sceneIn>{ageLabel}</b>
						{/key}
					</p>
					<div class="pair">
						<BarChart question={mentalHealth} {age} {ageLabel} colors={palettes.mental_health} />
						<BarChart question={belonging} {age} {ageLabel} colors={palettes.belonging} />
					</div>
				</div>
			</div>
		</div>
		{@render cards(chapters[0])}
	</section>

	<section class="story">
		<div class="graphic">
			<div class="stage">
				<!-- One frame for both line charts: moving from mental health to community services
				     rewrites the chart's contents in place instead of swapping the whole chart -->
				<div class="scene">
					<BelongingLines
						id="story-lines"
						compact
						title={lineStep.scene === 'mh' ? 'Belonging and mental health' : 'Community services and belonging'}
						intro=""
						pickerLegend=""
						points={lineStep.scene === 'mh' ? mhPoints : servicePoints}
						selected={lineStep.selected}
						heading={lineStep.scene === 'mh' ? mhHeading : serviceHeading}
						xLabel={lineStep.scene === 'mh' ? 'Self-rated mental health' : 'Use of community services in the past 12 months'}
					/>
				</div>
			</div>
		</div>
		{@render cards(chapters[1])}
	</section>
</div>

<style>
	/* The stage fills the sticky panel and each chart centres itself in it, so swapping
	   between charts of different heights doesn't make the panel jump */
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
	/* Step number sits in the card's top-right corner so the title starts at the top */
	.card-top.corner {
		position: absolute;
		top: 1.3rem;
		right: 1.5rem;
	}
	.step .card {
		padding-top: 1.3rem;
	}
	.card h3 {
		padding-right: 3.5rem;
	}
	.scene-label {
		margin: 0;
		display: flex;
		align-items: center;
		gap: 0.6rem;
		color: var(--muted);
	}
	.scene-label b {
		display: inline-block;
		padding: 0.3rem 0.75rem;
		border-radius: 999px;
		background: var(--highlight);
		color: var(--ink);
		border: 1.5px solid var(--ink);
		border-radius: var(--wobble-sm);
	}
	.step:first-child {
		min-height: 110vh;
	}
	.card.hook {
		padding-block: 1.8rem 1.6rem;
	}
	.hint {
		color: var(--muted);
		font-size: 0.7rem !important;
	}
</style>
