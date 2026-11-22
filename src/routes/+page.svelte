<script>
	import Backdrop from '#lib/components/Backdrop.svelte';
	import Story from '#lib/components/Story.svelte';
	import StudentStory from '#lib/components/StudentStory.svelte';
	import belongingByServices from '#lib/data/belonging-by-services.json';
	import data from '#lib/data/survey-by-age.json';
	import mhByBelonging from '#lib/data/mental-health-by-belonging.json';

	// Belonging and mental health: % strong / weak belonging at each mental health rating (Table1).
	const mhPoints = mhByBelonging.answers.map((a) => ({
		label: a.label,
		n: a.counts.all,
		strong: (a.counts.strong / a.counts.all) * 100,
		weak: (a.counts.weak / a.counts.all) * 100
	}));

	// Community services and belonging: same measures at each level of service use (Table1).
	const serviceDetail = ['0 times', '1–6 times', '7–12 times', '13+ times'];
	const servicePoints = belongingByServices.groups.map((g, i) => ({
		label: g.label.replace(/\s*\(.*\)$/, ''),
		detail: serviceDetail[i],
		n: g.unweighted,
		strong: g.strong,
		weak: g.weak
	}));

	// Ordinal palettes: best-to-worst (or never-to-most) per question.
	const palettes = {
		mental_health: ['var(--good-2)', 'var(--good-1)', 'var(--mid)', 'var(--bad-1)', 'var(--bad-2)'],
		belonging: ['var(--good-2)', 'var(--good-1)', 'var(--bad-1)', 'var(--bad-2)'],
		services: ['var(--seq-1)', 'var(--seq-2)', 'var(--seq-3)', 'var(--seq-4)']
	};
</script>

<svelte:head>
	<title>Toronto Wellbeing by Age</title>
</svelte:head>

<Backdrop />

<main>
	<header>
		<p class="eyebrow">City of Toronto Public Survey · weighted results</p>
		<h1>Wellbeing and community by age</h1>
	</header>

	<Story {data} {palettes} {mhPoints} {servicePoints} />

	<StudentStory />

	<p class="source">
		Source: City of Toronto,
		<a href="https://www.ontariohealthprofiles.ca/toronto-community-survey/#key-results" target="_blank" rel="noopener noreferrer"
			>Toronto Community Survey Results</a
		> (weighted data tables). Percentages are of all respondents in the selected group, including
		those who answered "Don't know" or chose not to answer.
	</p>
</main>

<style>
	:global(:root) {
		--bg: #f5f7f8;
		--surface: #ffffff;
		--fg: #1b2328;
		--muted: #5b6870;
		--line: #dde3e6;
		--track: #eef2f3;
		--accent: #1f6f8b;
		--good-2: #1d7a5f;
		--good-1: #5aae8a;
		--mid: #b9bfa6;
		--bad-1: #e09a5f;
		--bad-2: #c2553b;
		--seq-1: #b6d3de;
		--seq-2: #6ea9c0;
		--seq-3: #2f7f9d;
		--seq-4: #164f66;
		--font-display: 'Source Serif 4', Georgia, serif;
		--font-body: 'IBM Plex Sans', system-ui, sans-serif;
	}
	@media (prefers-color-scheme: dark) {
		:global(:root) {
			--bg: #12181b;
			--surface: #1a2226;
			--fg: #e6ecee;
			--muted: #9aa8ae;
			--line: #2b363b;
			--track: #232d32;
			--accent: #6fbad6;
			--good-2: #3fae88;
			--good-1: #7cc7a5;
			--mid: #8e957d;
			--bad-1: #e6a36c;
			--bad-2: #e0745a;
			--seq-1: #2c5666;
			--seq-2: #3f819b;
			--seq-3: #67adc8;
			--seq-4: #a9d6e6;
			color-scheme: dark;
		}
	}
	:global(body) {
		margin: 0;
		background: var(--bg);
		color: var(--fg);
		font-family: var(--font-body);
	}
	main {
		position: relative;
		z-index: 1;
		max-width: 78rem;
		margin: 0 auto;
		padding: 2.5rem 1rem 3rem;
		display: grid;
		gap: 1.5rem;
	}
	.eyebrow {
		margin: 0 0 0.4rem;
		font-size: 0.75rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--accent);
		font-weight: 600;
	}
	h1 {
		margin: 0;
		font: 600 clamp(1.6rem, 4vw, 2.2rem) / 1.15 var(--font-display);
		text-wrap: balance;
	}
	.source {
		margin: 0;
		font-size: 0.75rem;
		color: var(--muted);
		line-height: 1.5;
	}
	.source a {
		color: var(--accent);
		text-underline-offset: 2px;
	}
	.source a:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
</style>
