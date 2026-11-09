<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
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
	 *   kicker: string, hook?: string, title?: string, text?: string[], findings?: string[] }} Step
	 * @type {Step[]}
	 */
	const steps = [
		{
			scene: 'age',
			age: 'all',
			kicker: 'Hook',
			hook: 'Only half of Toronto residents reported good mental health and a sense of belonging. What about the other half?'
		},
		{
			scene: 'age',
			age: '18-24',
			kicker: 'Rising action · Age',
			title: 'Mental health improves with age',
			text: [
				'Self-rated mental health improves steadily with age.',
				'Younger adults (18–34) report the worst mental health. About a third of 18–24s say Fair or Poor (32%), and 12% say Poor, which is twice the city average.'
			]
		},
		{
			scene: 'age',
			age: '25-34',
			kicker: 'Rising action · Age',
			title: '25–34s feel the least connected',
			text: [
				'People aged 25–34 feel the least connected. They are the only age group where most people (53%) report a weak sense of belonging.'
			]
		},
		{
			scene: 'age',
			age: '55+',
			kicker: 'Rising action · Age',
			title: 'People 55+ feel the most connected',
			text: ['People 55+ feel the most connected: 58% strong and 34% weak.']
		},
		{
			scene: 'mh',
			selected: 'Poor',
			kicker: 'Rising action · Belonging and mental health',
			title: 'Belonging and mental health go together',
			findings: [
				'The better people rate their mental health, the more likely they are to feel a strong sense of belonging: 67% of those with excellent mental health, compared with 18% of those with poor mental health.',
				'Weak belonging does the opposite: it rises from 27% among people with excellent mental health to 77% among those with poor mental health. The lines cross at "Good".',
				'Strong belonging drops at every step down the scale. The biggest drop is from "Good" (45%) to "Fair" (28%).',
				'This shows the two go together, not that one causes the other.'
			]
		},
		{
			scene: 'services',
			selected: 'Very frequently',
			kicker: 'Community services and belonging',
			title: 'People who use community services feel they belong more',
			findings: [
				'The more often people use community centres and programs, the stronger their sense of belonging: from 42% among people who never use them to 70% among very frequent users.',
				'Among very frequent users, 24% feel very strongly connected, twice the city average (12%).',
				'The correlation is clear across groups but weak for individuals (ρ = 0.19): many people feel connected without using services, and some users still feel isolated.',
				'Community spaces may build connection, but people who already feel connected may also be more likely to show up.'
			]
		}
	];

	let active = $state(0);
	let step = $derived(steps[active]);
	let age = $derived(step.age ?? 'all');
	let ageLabel = $derived(data.ageGroups.find((/** @type {any} */ g) => g.id === age)?.label ?? 'All ages');

	let mentalHealth = $derived(data.questions.find((/** @type {any} */ q) => q.id === 'mental_health'));
	let belonging = $derived(data.questions.find((/** @type {any} */ q) => q.id === 'belonging'));

	/** @type {HTMLElement} */
	let stepsEl;

	onMount(() => {
		/** @type {any} */
		let scroller;
		const onResize = () => scroller?.resize();
		import('scrollama').then(({ default: scrollama }) => {
			scroller = scrollama();
			scroller
				.setup({ step: Array.from(stepsEl.querySelectorAll('.step')), offset: 0.55 })
				.onStepEnter((/** @type {{ index: number }} */ r) => (active = r.index));
			window.addEventListener('resize', onResize);
		});
		return () => {
			scroller?.destroy();
			window.removeEventListener('resize', onResize);
		};
	});
</script>

<section class="story" aria-label="Story: wellbeing and belonging in Toronto">
	<div class="graphic">
		<div class="stage">
			{#key step.scene}
				<div class="scene" transition:fade={{ duration: 300 }}>
					{#if step.scene === 'age'}
						<p class="scene-label">
							Showing: <b>{ageLabel}</b>
						</p>
						<div class="pair">
							<BarChart question={mentalHealth} {age} {ageLabel} colors={palettes.mental_health} />
							<BarChart question={belonging} {age} {ageLabel} colors={palettes.belonging} />
						</div>
					{:else if step.scene === 'mh'}
						<BelongingLines
							id="story-mh"
							compact
							title="Belonging and mental health"
							intro=""
							pickerLegend=""
							points={mhPoints}
							selected={step.selected}
							heading={(label) => `People with ${label.toLowerCase()} mental health`}
						/>
					{:else}
						<BelongingLines
							id="story-services"
							compact
							title="Community services and belonging"
							intro=""
							pickerLegend=""
							points={servicePoints}
							selected={step.selected}
							heading={(label) => {
								const p = servicePoints.find((x) => x.label === label);
								return label === 'Never'
									? 'People who never used community services'
									: `People who used services ${label.toLowerCase()} (${p?.detail} a year)`;
							}}
						/>
					{/if}
				</div>
			{/key}
		</div>
	</div>

	<div class="steps" bind:this={stepsEl}>
		{#each steps as s, i (i)}
			<div class="step" class:is-active={i === active} data-step={i}>
				<div class="card" class:hook={!!s.hook}>
					<p class="kicker">{s.kicker}</p>
					{#if s.hook}
						<p class="hook-text">{s.hook}</p>
						<p class="hint" aria-hidden="true">Scroll to find out ↓</p>
					{/if}
					{#if s.title}
						<h3>{s.title}</h3>
					{/if}
					{#each s.text ?? [] as t}
						<p>{t}</p>
					{/each}
					{#if s.findings}
						<div class="findings">
							<p class="findings-head">Key findings</p>
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
	.story {
		position: relative;
		display: grid;
		grid-template-columns: minmax(16rem, 23rem) minmax(0, 1fr);
		gap: 2rem;
	}
	/* Steps on the left, sticky chart on the right */
	.steps {
		grid-column: 1;
		grid-row: 1;
		position: relative;
		z-index: 1;
	}
	.graphic {
		grid-column: 2;
		grid-row: 1;
		position: sticky;
		top: 0;
		height: 100vh;
		height: 100dvh;
		display: flex;
		align-items: center;
		min-width: 0;
	}
	.stage {
		display: grid;
		width: 100%;
	}
	.scene {
		grid-area: 1 / 1;
		display: grid;
		gap: 0.75rem;
		min-width: 0;
	}
	.scene-label {
		margin: 0;
		font-size: 0.8rem;
		color: var(--muted);
	}
	.scene-label b {
		display: inline-block;
		padding: 0.15rem 0.6rem;
		border-radius: 999px;
		background: var(--accent);
		color: var(--bg);
	}
	.pair {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
		gap: 1rem;
	}
	.step {
		min-height: 90vh;
		display: flex;
		align-items: center;
	}
	.step:first-child {
		min-height: 100vh;
	}
	.tail {
		height: 30vh;
	}
	.card {
		display: grid;
		gap: 0.6rem;
		padding: 1.25rem 1.35rem;
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: 10px;
		opacity: 0.35;
		transition: opacity 300ms ease;
		box-shadow: 0 6px 24px rgb(0 0 0 / 0.06);
	}
	.is-active .card {
		opacity: 1;
	}
	.card p,
	.card h3 {
		margin: 0;
	}
	.kicker {
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--accent);
	}
	h3 {
		font: 600 1.25rem/1.25 var(--font-display);
		text-wrap: balance;
	}
	.card p {
		font-size: 0.95rem;
		line-height: 1.55;
	}
	.hook-text {
		font: 600 clamp(1.5rem, 3vw, 2rem) / 1.25 var(--font-display) !important;
		text-wrap: balance;
	}
	.hint {
		font-size: 0.8rem !important;
		color: var(--muted);
	}
	.findings {
		padding: 0.75rem 0.9rem;
		background: var(--track);
		border-radius: 6px;
	}
	.findings-head {
		margin: 0 0 0.35rem !important;
		font-size: 0.7rem !important;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--muted);
	}
	.findings ul {
		margin: 0;
		padding-left: 1.1rem;
		display: grid;
		gap: 0.4rem;
		font-size: 0.875rem;
		line-height: 1.45;
	}

	/* Narrow screens: chart stays pinned at the top, text cards scroll over it */
	@media (max-width: 900px) {
		.story {
			display: block;
		}
		.graphic {
			height: 100vh;
			height: 100dvh;
			align-items: flex-start;
			padding-top: 0.5rem;
			overflow: hidden;
		}
		.steps {
			margin-top: -100vh;
			margin-top: -100dvh;
			pointer-events: none;
		}
		.card {
			pointer-events: auto;
			opacity: 0.95;
		}
		.is-active .card {
			opacity: 1;
		}
		.step {
			align-items: flex-end;
			padding-bottom: 8vh;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.card {
			transition: none;
		}
	}
</style>
