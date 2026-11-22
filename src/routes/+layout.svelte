<script>
	import favicon from '#lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<!--
	Shared "hand-drawn" filters for the charts. Turbulence noise nudges each mark's edges a few
	pixels so lines and bars look sketched with a pen. Use with `filter: url(#sketch)` (or
	#sketch-alt, a different noise seed, for a second overlapping stroke).
-->
<svg class="sketch-defs" aria-hidden="true" focusable="false">
	<defs>
		<filter id="sketch" x="-5%" y="-5%" width="110%" height="110%">
			<feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="3" />
			<feDisplacementMap in="SourceGraphic" scale="3.5" xChannelSelector="R" yChannelSelector="G" />
		</filter>
		<filter id="sketch-alt" x="-5%" y="-5%" width="110%" height="110%">
			<feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="11" />
			<feDisplacementMap in="SourceGraphic" scale="4" xChannelSelector="G" yChannelSelector="R" />
		</filter>
	</defs>
</svg>

{@render children()}

<style>
	.sketch-defs {
		position: absolute;
		width: 0;
		height: 0;
		overflow: hidden;
	}
	:global(:root) {
		--font-hand: 'Patrick Hand', 'Comic Sans MS', 'Segoe Print', cursive;
		--font-hand-title: 'Caveat', 'Patrick Hand', cursive;
		/* Irregular corners: reads as a box drawn freehand. */
		--wobble: 22px 6px 26px 5px / 5px 20px 6px 24px;
		--wobble-sm: 8px 3px 9px 2px / 3px 9px 2px 8px;
	}
	/* Hand-drawn bar: pen outline + diagonal hatching in the bar's colour (set --c). */
	:global(.hand-bar) {
		box-sizing: border-box;
		border: 2px solid var(--c);
		border-radius: var(--wobble-sm);
		background:
			repeating-linear-gradient(-55deg, var(--c) 0 1.6px, transparent 1.6px 5.5px),
			color-mix(in srgb, var(--c) 14%, transparent) !important;
		filter: url(#sketch);
	}
	/* Hand-drawn chart card. */
	:global(figure.chart) {
		font-family: var(--font-hand);
	}
	:global(figure.chart h2) {
		font-family: var(--font-hand-title) !important;
		font-size: 1.6rem !important;
		font-weight: 700 !important;
	}
</style>
