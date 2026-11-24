<script>
	import Backdrop from '#lib/components/Backdrop.svelte';
	import Story from '#lib/components/Story.svelte';
	import StudentStory from '#lib/components/StudentStory.svelte';
	import ClassroomBackdrop from '#lib/components/ClassroomBackdrop.svelte';
	import ChapterOpener from '#lib/components/ChapterOpener.svelte';
	import Hud from '#lib/components/Hud.svelte';
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
	<meta
		name="description"
		content="A scrollytelling story on mental health, belonging and community spaces in Toronto, from the City survey and our own survey of students."
	/>
</svelte:head>

<Hud />

<!--
	Intro: the title screen and the Chapter 01 opener share ONE Toronto sketch. It is sticky, so it
	stays put while you scroll through both, then scrolls away when the charts begin.
-->
<div class="intro">
	<div class="intro-bg" aria-hidden="true"><div class="intro-pin"><Backdrop sky={false} /></div></div>

<header class="hero">
	<div class="hero-inner">
		<p class="mono eyebrow"><span class="hl-marker">City of Toronto Public Survey · weighted results</span></p>
		<h1>
			<span class="line">Wellbeing and community</span>
			<span class="em">by age</span>
		</h1>
		<p class="deck">
			How mental health and a sense of belonging change across Toronto, and where students find their
			people.
		</p>
		<ul class="meta mono" aria-label="Data sources">
			<li><b>7,222</b> Toronto residents</li>
			<li><b>25</b> undergrad students</li>
			<li><b>2</b> chapters</li>
		</ul>
	</div>

	<!-- Margin doodles -->
	<svg class="doodle star" viewBox="0 0 100 100" aria-hidden="true">
		<path pathLength="1" d="M50 8 L58 40 L92 42 L64 60 L76 92 L50 72 L24 92 L36 60 L8 42 L42 40 Z" />
	</svg>
	<svg class="doodle star-big" viewBox="0 0 100 100" aria-hidden="true">
		<path pathLength="1" d="M50 4 L61 38 L97 38 L68 59 L79 94 L50 73 L21 94 L32 59 L3 38 L39 38 Z" />
	</svg>
	<svg class="doodle spiral-red" viewBox="0 0 120 120" aria-hidden="true">
		<path pathLength="1" d="M62 48 c4 -6 -6 -10 -8 -2 c-3 10 12 12 14 2 c3 -14 -18 -20 -26 -6 c-9 16 6 34 24 30 c18 -4 26 -24 16 -40 c-10 -16 -38 -18 -52 0 c-14 18 -6 44 18 50 h30" />
	</svg>
	<svg class="doodle swirl" viewBox="0 0 120 120" aria-hidden="true">
		<path pathLength="1" d="M60 62 c0 -6 8 -6 8 0 c0 10 -16 10 -16 0 c0 -16 24 -16 24 0 c0 22 -32 22 -32 0 c0 -28 40 -28 40 0 c0 34 -48 34 -48 0" />
	</svg>

	<a class="cue mono" href="#chapter-01">
		<span>Scroll to explore</span>
		<svg class="arrow" viewBox="0 0 40 70" aria-hidden="true">
			<path pathLength="1" d="M20 4 C 14 22, 26 38, 20 62 M 8 50 L 20 64 L 32 49" />
		</svg>
	</a>
</header>

	<div id="chapter-01" class="intro-ch">
		<ChapterOpener
			number="01"
			title="The city"
			hook={"Only half of Toronto residents\nreported good mental health\nand a sense of belonging.\nWhat about the other half?"}
		/>
	</div>
</div>

<main>

	<Story {data} {palettes} {mhPoints} {servicePoints} />

	<!-- Chapter 02 opener over a faint classroom sketch (full-bleed, like the city one) -->
	<div class="students-ch">
		<div class="students-bg" aria-hidden="true"><ClassroomBackdrop /></div>
		<ChapterOpener
			number="02"
			title="Our students"
			hook={"We asked 25 undergrads\nthe same kinds of questions,\nand where they go\nto feel connected."}
			highlight="none"
		/>
	</div>

	<StudentStory />

	<footer class="source">
		<p class="mono"><span class="hl-marker">The end ✎</span></p>
		<p>
			Source: City of Toronto,
			<a
				href="https://www.ontariohealthprofiles.ca/toronto-community-survey/#key-results"
				target="_blank"
				rel="noopener noreferrer">Toronto Community Survey Results</a
			> (weighted data tables). Percentages are of all respondents in the selected group, including
			those who answered "Don't know" or chose not to answer.
		</p>
	</footer>
</main>

<style>
	/* ---------- Hero ---------- */
	.hero {
		position: relative;
		min-height: 100vh;
		min-height: 100svh;
		display: grid;
		align-items: center;
		padding: 0 1rem 0 4.5rem;
		overflow: hidden;
	}
	.hero-inner {
		position: relative; /* above the city sketch */
		width: 100%;
		max-width: 80rem;
		margin: 0 auto;
		display: grid;
		gap: 1.2rem;
	}
	.hero-inner > * {
		margin: 0;
		animation: rise 1000ms var(--ease-out) backwards;
	}
	.eyebrow {
		color: var(--ink);
	}
	h1 {
		/* Sized so "Wellbeing and community" always fits on one line */
		font: 700 min(8.5rem, 9.2vw) / 0.82 var(--font-display);
		text-align: center; /* "by age" sits centred under the title */
		animation-delay: 120ms !important;
	}
	.line {
		display: block;
		white-space: nowrap;
	}
	.em {
		position: relative;
		display: inline-block;
		color: var(--oi-blue);
	}
	.doodle path,
	.arrow path {
		fill: none;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-dasharray: 1;
		stroke-dashoffset: 1;
		animation: draw 1200ms var(--ease-out) forwards;
	}
	@keyframes draw {
		to {
			stroke-dashoffset: 0;
		}
	}
	.deck {
		max-width: 34ch;
		justify-self: center;
		text-align: center;
		font-size: clamp(1.15rem, 2vw, 1.45rem);
		line-height: 1.5;
		color: var(--muted);
		animation-delay: 260ms !important;
	}
	.meta {
		list-style: none;
		padding: 0;
		display: flex;
		flex-wrap: wrap; /* one row; wraps only on narrow phones */
		justify-content: center;
		gap: 0.7rem;
		animation-delay: 400ms !important;
	}
	.meta li {
		padding: 0.35rem 0.9rem;
		border: 2px solid var(--ink);
		border-radius: var(--wobble-sm);
		background: var(--surface);
		box-shadow: 2px 3px 0 var(--ink);
		rotate: -1.5deg;
	}
	.meta li:nth-child(2) {
		rotate: 1.2deg;
		background: color-mix(in srgb, var(--oi-yellow) 45%, var(--surface));
	}
	.meta li:nth-child(3) {
		rotate: -0.6deg;
	}
	.meta b {
		font-weight: 400;
		color: var(--oi-blue);
	}
	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
	}
	.doodle {
		position: absolute;
		pointer-events: none;
	}
	.doodle path {
		stroke-width: 3;
	}
	.star {
		width: clamp(4rem, 9vw, 7rem);
		top: 14%;
		right: 12%;
		rotate: 12deg;
	}
	/* Both stars: yellow crayon (outline a touch darker so it reads on the paper) */
	.star path,
	.star-big path {
		stroke: color-mix(in srgb, var(--oi-yellow) 75%, var(--ink));
		fill: var(--oi-yellow);
		fill-opacity: 0;
		animation:
			draw 1400ms var(--ease-out) 1200ms forwards,
			fill-in 600ms ease 2400ms forwards;
	}
	@keyframes fill-in {
		to {
			fill-opacity: 1;
		}
	}
	/* Red crayon doodles (Okabe-Ito vermillion) */
	.star-big {
		width: clamp(5rem, 11vw, 11rem);
		top: 3%;
		left: 12%;
	}
	.spiral-red {
		width: clamp(5rem, 9vw, 8.5rem);
		bottom: 17%;
		left: 17%;
	}
	.star-big path,
	.spiral-red path {
		filter: url(#sketch);
	}
	.spiral-red path {
		stroke: var(--oi-vermillion);
	}
	.star-big path {
		animation:
			draw 1600ms var(--ease-out) 1000ms forwards,
			fill-in 600ms ease 2600ms forwards;
	}
	.spiral-red path {
		animation-delay: 1800ms;
		animation-duration: 1600ms;
	}
	.swirl {
		width: clamp(5rem, 11vw, 9rem);
		bottom: 18%;
		right: 10%; /* clear of the centred chips */
	}
	.swirl path {
		stroke: var(--oi-sky);
		animation-delay: 1500ms;
		animation-duration: 1800ms;
	}
	.cue {
		position: absolute;
		left: 50%;
		bottom: 1.5rem;
		transform: translateX(-50%);
		display: grid;
		justify-items: center;
		gap: 0.2rem;
		color: var(--ink);
		text-decoration: none;
		animation: rise 1000ms var(--ease-out) 700ms backwards;
	}
	.cue:focus-visible {
		outline: 2px dashed var(--ink);
		outline-offset: 4px;
	}
	.arrow {
		width: 1.6rem;
		height: 2.8rem;
		overflow: visible;
		animation: bob 1.8s ease-in-out 2.2s infinite;
	}
	.arrow path {
		stroke: var(--ink);
		stroke-width: 3;
		animation-delay: 1300ms;
	}
	@keyframes bob {
		50% {
			transform: translateY(6px);
		}
	}
	@media (max-width: 700px) {
		.hero {
			padding-left: 1rem;
		}
		.swirl,
		.spiral-red {
			display: none;
		}
		.star-big {
			top: 6%;
			left: 4%;
			width: 4rem;
		}
	}

	/* ---------- Body ---------- */
	/* ---------- Intro (title + Chapter 01) with one pinned city sketch ---------- */
	.intro {
		position: relative;
	}
	/* Covers the whole intro; the picture inside is pinned to the screen but can never
	   go past the end of the intro, so it never reaches the charts. */
	.intro-bg {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}
	.intro-pin {
		position: sticky;
		top: 0;
		height: 100vh;
		height: 100svh;
		overflow: hidden;
	}
	/* Same width as the rest of the story (it now sits outside <main>) */
	.intro-ch {
		position: relative;
		max-width: 80rem;
		margin: 0 auto;
		padding: 0 1rem;
	}
	.students-ch {
		position: relative;
	}
	/* Spans the full window width even though <main> is narrower */
	.students-bg {
		position: absolute;
		inset: 0 calc(50% - 50vw);
		overflow: hidden;
		pointer-events: none;
	}
	/* The full-bleed sketch must not cause sideways scrolling */
	:global(body) {
		overflow-x: clip;
	}
	main {
		max-width: 80rem;
		margin: 0 auto;
		padding: 0 1rem 4rem;
		display: grid;
	}
	.source {
		margin-top: 6rem;
		padding-top: 1.5rem;
		border-top: 2px dashed var(--ink);
		display: grid;
		gap: 0.6rem;
		max-width: 60rem;
	}
	.source p {
		margin: 0;
		font-size: 0.95rem;
		color: var(--muted);
		line-height: 1.6;
	}
	.source .mono {
		color: var(--ink);
		font-size: 1rem;
	}
	.source a {
		text-underline-offset: 3px;
	}
	.source a:focus-visible {
		outline: 2px dashed var(--ink);
		outline-offset: 2px;
	}
</style>
