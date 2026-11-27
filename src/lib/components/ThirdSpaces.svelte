<script>
	import { inview } from '#lib/inview.js';

	/**
	 * Full-screen definition slide: a pencil-sketch portrait taped to the page like a photo, next
	 * to a hand-lettered definition of third spaces. Both rise in when the slide scrolls into view.
	 */
	let visible = $state(false);
</script>

<section class="slide" class:visible use:inview={() => (visible = true)}>
	<figure class="who">
		<div class="photo">
			<span class="tape tape-l" aria-hidden="true"></span>
			<span class="tape tape-r" aria-hidden="true"></span>
			<img src="/portrait-sketch.png" alt="Pencil sketch of Ray Oldenburg holding his glasses, in front of bookshelves" width="700" height="986" loading="lazy" />
		</div>
		<!-- Hand-drawn arrow from the name up to the photo -->
		<svg class="arrow" viewBox="0 0 120 90" aria-hidden="true">
			<path pathLength="1" d="M108 82 C 92 50, 60 30, 18 18 M18 18 L 36 10 M18 18 L 30 34" />
		</svg>
		<figcaption class="name"><b>Ray Oldenburg</b>, Sociologist</figcaption>
	</figure>

	<p class="definition">
		<span class="term">Third spaces</span> are places outside of the home and workplace where people go to converse with
		others and connect with their community.
	</p>
</section>

<style>
	.slide {
		min-height: 100vh;
		min-height: 100svh;
		display: grid;
		grid-template-columns: minmax(14rem, 26rem) minmax(0, 1fr);
		align-items: center;
		gap: clamp(2rem, 6vw, 5rem);
		padding: 4rem 0;
	}

	.who {
		position: relative;
		margin: 0 0 5.5rem;
	}
	/* Handwritten name under the photo, with an arrow pointing up at it */
	.name {
		position: absolute;
		right: -3.5rem;
		bottom: -5rem;
		rotate: -3deg;
		font: 400 clamp(1.7rem, 2.6vw, 2.3rem) / 1.1 var(--font-display);
		color: var(--ink);
		white-space: nowrap;
		opacity: 0;
		transition: opacity 700ms var(--ease-out) 1400ms;
	}
	.name b {
		font-weight: 700;
	}
	.arrow {
		position: absolute;
		right: -2.6rem;
		bottom: -3rem;
		width: 6.5rem;
		overflow: visible;
	}
	.arrow path {
		fill: none;
		stroke: var(--ink);
		stroke-width: 4;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-dasharray: 1;
		stroke-dashoffset: 1;
		filter: url(#sketch);
		transition: stroke-dashoffset 900ms var(--ease-out) 1000ms;
	}
	.visible .arrow path {
		stroke-dashoffset: 0;
	}
	.visible .name {
		opacity: 1;
	}

	/* The sketch, taped to the page at a slight tilt */
	.photo {
		position: relative;
		margin: 0;
		padding: 0.9rem 0.9rem 2.2rem;
		background: var(--surface);
		border: 2px solid var(--ink);
		border-radius: var(--wobble-sm);
		box-shadow: var(--shadow);
		rotate: -3deg;
		opacity: 0;
		transform: translateY(40px) rotate(-4deg);
		transition:
			opacity 800ms var(--ease-out),
			transform 1000ms var(--ease-out);
	}
	.photo img {
		display: block;
		width: 100%;
		height: auto;
	}
	.tape {
		position: absolute;
		top: -0.9rem;
		width: 5.5rem;
		height: 1.8rem;
		background: color-mix(in srgb, var(--oi-yellow) 55%, transparent);
		border: 1px solid color-mix(in srgb, var(--ink) 15%, transparent);
	}
	.tape-l {
		left: -1.2rem;
		rotate: -28deg;
	}
	.tape-r {
		right: -1.2rem;
		rotate: 24deg;
	}

	.definition {
		margin: 0;
		max-width: 22ch;
		font: 700 clamp(2.2rem, 4.2vw, 3.8rem) / 1.1 var(--font-display);
		color: var(--ink);
		text-wrap: pretty;
		opacity: 0;
		transform: translateY(30px);
		transition:
			opacity 800ms var(--ease-out) 250ms,
			transform 900ms var(--ease-out) 250ms;
	}
	/* "Third spaces" gets the yellow highlighter, swept in after the text appears */
	.term {
		background: linear-gradient(100deg, transparent 1%, var(--oi-yellow) 3%, var(--oi-yellow) 97%, transparent 99%)
			no-repeat 0 60% / 0% 80%;
		padding: 0 0.15em;
		transition: background-size 900ms var(--ease-out) 1100ms;
	}

	.visible .photo {
		opacity: 1;
		transform: none;
	}
	.visible .definition {
		opacity: 1;
		transform: none;
	}
	.visible .term {
		background-size: 100% 80%;
	}

	@media (max-width: 760px) {
		.slide {
			grid-template-columns: 1fr;
			justify-items: center;
			text-align: center;
			gap: 2.5rem;
		}
		.who {
			width: min(13rem, 60vw);
		}
		.name {
			right: -2rem;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.photo,
		.definition,
		.term,
		.name,
		.arrow path {
			transition: none;
		}
	}
</style>
