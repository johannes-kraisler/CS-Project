<script>
	import { onMount } from 'svelte';
	import { sceneIn, sceneOut } from '#lib/motion.js';
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
	 *   kicker: string, hook?: string, title?: string, text?: string[], findings?: string[] }} Step
	 * @type {Step[]}
	 */
	const steps = [
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
	let progress = $state(0); // 0–1 through the active step, drives the word reveal
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

<section class="story" aria-label="Story: wellbeing and belonging in Toronto">
	<div class="graphic">
		<div class="stage">
			{#key step.scene}
				<div class="scene" in:sceneIn out:sceneOut>
					{#if step.scene === 'age'}
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
					<div class="card-top">
						<p class="kicker mono">{s.kicker}</p>
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
</section>

<style>
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
