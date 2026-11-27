<script>
	import { onMount } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';
	import WordReveal from '#lib/components/WordReveal.svelte';
	import Backdrop from '#lib/components/Backdrop.svelte';
	import { reducedMotion } from '#lib/motion.js';

	/**
	 * A big centred statement between story sections, lettered at the size of the main title,
	 * over a faint full-width Toronto sketch with two yellow crayon stars (like the title page).
	 * It rises in, the stars draw themselves, and the words get highlighted once it is in view.
	 * A newline (\n) in `text` forces a line break; `highlight` works as in WordReveal.
	 * `small` uses slightly smaller lettering, for longer statements; `lower` sits the text a bit lower.
	 * @type {{ text: string, highlight?: 'all' | 'last-line' | 'none' | 'marked', small?: boolean, lower?: boolean }}
	 */
	let { text, highlight = 'last-line', small = false, lower = false } = $props();

	const reveal = new Tween(0, { duration: 2000, easing: cubicInOut });

	/** @type {HTMLElement} */
	let el;
	let visible = $state(false);

	onMount(() => {
		const io = new IntersectionObserver(
			([e]) => {
				if (e.isIntersecting) {
					visible = true;
					if (reducedMotion()) reveal.set(1, { duration: 0 });
					else setTimeout(() => (reveal.target = 1), 400);
					io.disconnect();
				}
			},
			{ threshold: 0.4 }
		);
		io.observe(el);
		return () => io.disconnect();
	});
</script>

<section class="interlude" class:visible class:lower bind:this={el}>
	<div class="bg" aria-hidden="true"><Backdrop /></div>

	<svg class="doodle star-big" viewBox="0 0 100 100" aria-hidden="true">
		<path pathLength="1" d="M50 4 L61 38 L97 38 L68 59 L79 94 L50 73 L21 94 L32 59 L3 38 L39 38 Z" />
	</svg>
	<svg class="doodle star" viewBox="0 0 100 100" aria-hidden="true">
		<path pathLength="1" d="M50 8 L58 40 L92 42 L64 60 L76 92 L50 72 L24 92 L36 60 L8 42 L42 40 Z" />
	</svg>

	<p class="statement" class:small><WordReveal {text} progress={reveal.current} start={0} end={1} {highlight} /></p>
</section>

<style>
	.interlude {
		position: relative;
		min-height: 100vh;
		min-height: 100svh;
		display: grid;
		place-items: center;
		padding: 0 0 6rem;
		margin-top: -12vh; /* sit a little closer to the bar charts above */
	}
	.interlude.lower {
		padding-top: 9rem;
	}
	/* Faint city sketch spanning the full window width, like the chapter openers */
	.bg {
		position: absolute;
		inset: 0 calc(50% - 50vw);
		overflow: hidden;
		pointer-events: none;
	}
	.statement {
		position: relative; /* above the sketch */
		margin: 0;
		text-align: center;
		/* Same lettering size as the "Wellbeing and Belonging" title */
		font: 700 min(8rem, 8.6vw) / 0.95 var(--font-display);
		color: var(--ink);
		opacity: 0;
		transform: translateY(28px);
		transition:
			opacity 800ms var(--ease-out),
			transform 900ms var(--ease-out);
	}
	.statement.small {
		font-size: min(5.5rem, 5vw);
		line-height: 1.05;
	}
	.visible .statement {
		opacity: 1;
		transform: none;
	}

	/* Yellow crayon stars, drawn in then filled (same as the title page) */
	.doodle {
		position: absolute;
		pointer-events: none;
	}
	.doodle path {
		fill: var(--oi-yellow);
		fill-opacity: 0;
		stroke: color-mix(in srgb, var(--oi-yellow) 75%, var(--ink));
		stroke-width: 3;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-dasharray: 1;
		stroke-dashoffset: 1;
	}
	.star-big {
		width: clamp(5rem, 11vw, 11rem);
		top: 12%;
		left: 4%;
		rotate: -8deg;
	}
	.star-big path {
		filter: url(#sketch);
	}
	.star {
		width: clamp(4rem, 9vw, 7rem);
		top: 20%;
		right: 6%;
		rotate: 12deg;
	}
	.visible .star-big path {
		animation:
			draw 1600ms var(--ease-out) 600ms forwards,
			fill-in 600ms ease 2200ms forwards;
	}
	.visible .star path {
		animation:
			draw 1400ms var(--ease-out) 900ms forwards,
			fill-in 600ms ease 2300ms forwards;
	}
	@keyframes draw {
		to {
			stroke-dashoffset: 0;
		}
	}
	@keyframes fill-in {
		to {
			fill-opacity: 1;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.doodle path {
			stroke-dashoffset: 0;
			fill-opacity: 1;
		}
	}
	@media (max-width: 700px) {
		.statement {
			font-size: 2.6rem;
		}
		.statement.small {
			font-size: 2rem;
		}
		.star-big {
			width: 4rem;
			top: 20%;
		}
		.star {
			width: 3rem;
			top: 22%;
		}
	}
</style>
