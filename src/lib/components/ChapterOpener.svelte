<script>
	import { onMount } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';
	import WordReveal from '#lib/components/WordReveal.svelte';
	import { reducedMotion } from '#lib/motion.js';

	/**
	 * Full-screen numbered chapter title. Its parts rise in one after another when it scrolls into view.
	 * `data-chapter` lets the progress HUD know which chapter the reader is in.
	 * `hook` (optional) is shown instead of the deck as a big statement whose words get highlighted
	 * one after another once the opener is in view.
	 * @type {{ number: string, title: string, deck?: string, hook?: string }}
	 */
	let { number, title, deck = '', hook = '' } = $props();

	const reveal = new Tween(0, { duration: 2400, easing: cubicInOut });

	/** @type {HTMLElement} */
	let el;
	let visible = $state(false);

	onMount(() => {
		const io = new IntersectionObserver(
			([e]) => {
				if (e.isIntersecting) {
					visible = true;
					if (reducedMotion()) reveal.set(1, { duration: 0 });
					else setTimeout(() => (reveal.target = 1), 700);
					io.disconnect();
				}
			},
			{ threshold: 0.35 }
		);
		io.observe(el);
		return () => io.disconnect();
	});
</script>

<section class="opener" class:visible bind:this={el} data-chapter={number} data-title={title}>
	<p class="num" aria-hidden="true">{number}</p>
	<p class="mono label"><span class="hl-marker">Chapter {number}</span></p>
	<h2>{title}</h2>
	<!-- Hand-drawn squiggle under the title; draws itself in -->
	<svg class="rule" viewBox="0 0 220 24" aria-hidden="true">
		<path pathLength="1" d="M4 15 C 30 4, 52 22, 80 12 S 130 4, 156 14 S 200 18, 216 8" />
	</svg>
	{#if hook}
		<p class="deck hook"><WordReveal text={hook} progress={reveal.current} start={0} end={1} highlight="last-line" /></p>
	{:else}
		<p class="deck">{deck}</p>
	{/if}
</section>

<style>
	.opener {
		position: relative;
		min-height: 90vh;
		min-height: 90svh;
		display: grid;
		align-content: center;
		justify-items: start;
		gap: 0.6rem;
		padding: 4rem 0;
	}
	.num {
		position: absolute;
		right: 2%;
		top: 50%;
		margin: 0;
		transform: translateY(-50%) rotate(-6deg);
		font: 700 clamp(10rem, 32vw, 24rem) / 0.8 var(--font-display);
		color: var(--accent-soft);
		-webkit-text-stroke: 2.5px var(--ink);
		filter: url(#sketch-strong);
		pointer-events: none;
		user-select: none;
	}
	.label {
		margin: 0;
		color: var(--ink);
	}
	h2 {
		margin: 0;
		max-width: 14ch;
		font: 700 clamp(4rem, 10vw, 7.5rem) / 0.85 var(--font-display);
	}
	.deck {
		margin: 0.4rem 0 0;
		max-width: 38ch;
		font-size: clamp(1.1rem, 1.7vw, 1.3rem);
		line-height: 1.55;
		color: var(--muted);
	}
	.deck.hook {
		position: relative; /* above the big chapter number */
		justify-self: center;
		text-align: center;
		max-width: 100%; /* line breaks come from \n in the hook text */
		margin-top: 0.8rem;
		font: 700 clamp(2.2rem, 4vw, 3.4rem) / 1.1 var(--font-display);
		color: var(--ink);
		text-wrap: pretty;
	}
	.rule {
		width: min(16rem, 60vw);
		height: auto;
		overflow: visible;
	}
	.rule path {
		fill: none;
		stroke: var(--accent);
		stroke-width: 5;
		stroke-linecap: round;
		stroke-dasharray: 1;
		stroke-dashoffset: 1;
		transition: stroke-dashoffset 1100ms var(--ease-out) 450ms;
	}
	.visible .rule path {
		stroke-dashoffset: 0;
	}

	/* Staggered rise-in */
	.label,
	h2,
	.deck,
	.num {
		opacity: 0;
		transition:
			opacity 800ms var(--ease-out),
			transform 900ms var(--ease-out);
	}
	.label,
	h2,
	.deck {
		transform: translateY(28px);
	}
	.num {
		transform: translateY(-40%) rotate(-14deg) scale(0.9);
	}
	.visible .label,
	.visible h2,
	.visible .deck,
	.visible .num {
		opacity: 1;
	}
	.visible .label,
	.visible h2,
	.visible .deck {
		transform: none;
	}
	.visible .num {
		transform: translateY(-50%) rotate(-6deg);
	}
	.visible h2 {
		transition-delay: 120ms;
	}
	.visible .deck {
		transition-delay: 300ms;
	}
</style>
