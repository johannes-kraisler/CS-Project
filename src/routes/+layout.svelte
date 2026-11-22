<script>
	import favicon from '#lib/assets/favicon.svg';
	import '#lib/styles/theme.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<!-- Shared SVG filters: "sketch" roughens edges so bars, lines and markers look drawn by hand -->
<svg class="defs" aria-hidden="true" focusable="false">
	<filter id="sketch" x="-5%" y="-20%" width="110%" height="140%">
		<feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="3" result="noise" />
		<feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
	</filter>
	<filter id="sketch-strong" x="-5%" y="-20%" width="110%" height="140%">
		<feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves="3" seed="8" result="noise" />
		<feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G" />
	</filter>
</svg>

{@render children()}

<style>
	.defs {
		position: absolute;
		width: 0;
		height: 0;
		overflow: hidden;
	}
</style>
