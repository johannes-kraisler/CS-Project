<script>
	import { onMount } from 'svelte';
	import { geoMercator, geoPath, json, select, zoom as d3zoom, zoomIdentity } from 'd3';

	/**
	 * Zoomable map of students' favourite places (x / y columns of survey_0.csv, which belong to
	 * the "(1)" place). Dots are coloured by how connected the student feels there.
	 * Zoom: buttons, drag to pan, Ctrl/Cmd + scroll or pinch (plain scrolling keeps scrolling the page).
	 * @type {{
	 *   rows: import('#lib/survey0.js').Response[],
	 *   total: number
	 * }}
	 */
	let { rows, total } = $props();

	const W = 760;
	const H = 500;
	const CAMPUS = /** @type {[number, number]} */ ([-79.3957, 43.6629]);

	/** @type {any} */
	let geo = $state(null);
	let loadError = $state('');
	let k = $state(1); // current zoom scale, used to keep dots and text the same size on screen
	/** @type {number | null} */
	let selectedId = $state(null);

	/** @type {SVGSVGElement} */
	let svgEl;
	/** @type {any} */
	let zoomBehaviour;

	let located = $derived(rows.filter((r) => r.x != null && r.y != null));

	// Fit the projection to Toronto plus every point (some places are outside the city).
	let projection = $derived.by(() => {
		const p = geoMercator();
		const pts = located.map((r) => /** @type {[number, number]} */ ([r.x, r.y]));
		/** @type {any} */
		const fc = {
			type: 'FeatureCollection',
			features: [...(geo?.features ?? []), ...(pts.length ? [{ type: 'Feature', geometry: { type: 'MultiPoint', coordinates: pts } }] : [])]
		};
		if (fc.features.length) p.fitExtent([[16, 16], [W - 16, H - 16]], fc);
		return p;
	});
	let path = $derived(geoPath(projection));
	// Neighbourhood name positions, shown only when zoomed in enough to read them.
	let hoodLabels = $derived(
		(geo?.features ?? []).map((/** @type {any} */ f) => ({ name: f.properties.name, xy: path.centroid(f) }))
	);

	/** @param {number | null} c */
	const group = (c) => (c == null ? 'none' : c >= 4 ? 'strong' : c <= 2 ? 'weak' : 'mid');
	const GROUPS = [
		{ id: 'strong', label: 'Strongly connected (4–5)', color: 'var(--good-2)' },
		{ id: 'mid', label: 'In between (3)', color: 'var(--mid)' },
		{ id: 'weak', label: 'Weakly connected (1–2)', color: 'var(--bad-2)' }
	];
	const colorOf = (/** @type {number | null} */ c) => GROUPS.find((g) => g.id === group(c))?.color ?? 'var(--muted)';

	let points = $derived(
		located.map((r) => {
			const [px, py] = projection([/** @type {number} */ (r.x), /** @type {number} */ (r.y)]) ?? [0, 0];
			return { ...r, px, py };
		})
	);
	let selected = $derived(points.find((p) => p.id === selectedId) ?? null);
	let campusXY = $derived(projection(CAMPUS) ?? [0, 0]);

	/** @param {number} factor */
	const zoomBy = (factor) => select(svgEl).transition().duration(350).call(zoomBehaviour.scaleBy, factor);
	const reset = () => select(svgEl).transition().duration(450).call(zoomBehaviour.transform, zoomIdentity);
	const toCampus = () => {
		const [cx, cy] = campusXY;
		const s = 14;
		select(svgEl)
			.transition()
			.duration(650)
			.call(zoomBehaviour.transform, zoomIdentity.translate(W / 2 - s * cx, H / 2 - s * cy).scale(s));
	};

	onMount(() => {
		json('/toronto-neighbourhoods.geojson')
			.then((g) => (geo = g))
			.catch((e) => (loadError = `Couldn't load the map outline: ${e.message}`));

		zoomBehaviour = d3zoom()
			.scaleExtent([1, 60])
			.translateExtent([[-W, -H], [2 * W, 2 * H]])
			// Wheel only zooms with Ctrl/Cmd held, so normal scrolling keeps moving the story.
			// Touch: only pinch (two fingers) is captured; one finger scrolls the page.
			.filter((/** @type {any} */ e) => {
				if (e.type === 'wheel') return e.ctrlKey || e.metaKey;
				if (e.type === 'touchstart') return e.touches?.length > 1;
				return !e.button;
			})
			.on('zoom', (/** @type {any} */ e) => {
				select(svgEl).select('g.world').attr('transform', e.transform);
				k = e.transform.k;
			});
		select(svgEl).call(zoomBehaviour).on('dblclick.zoom', null);
		return () => select(svgEl).on('.zoom', null);
	});
</script>

<figure class="chart">
	<figcaption>
		<h2>Where students' favourite places are</h2>
		<p class="col">Columns: “x”, “y” (location of the favourite place) and “How connected do you feel to the people at this place? (1)”</p>
	</figcaption>

	<div class="controls">
		<div class="zoom-buttons" role="group" aria-label="Map zoom">
			<button type="button" onclick={() => zoomBy(1.8)} aria-label="Zoom in">+</button>
			<button type="button" onclick={() => zoomBy(1 / 1.8)} aria-label="Zoom out">−</button>
			<button type="button" onclick={toCampus}>Zoom to campus</button>
			<button type="button" onclick={reset}>Reset</button>
		</div>
		<p class="hint">Drag to pan · Ctrl/⌘ + scroll or pinch to zoom · click a dot</p>
	</div>

	<div class="map">
		<svg bind:this={svgEl} viewBox="0 0 {W} {H}" role="img" aria-label="Map of {points.length} students' favourite places in and around Toronto">
			<g class="world">
				{#if geo}
					{#each geo.features as f (f.properties.name)}
						<path class="hood" d={path(f)}><title>{f.properties.name}</title></path>
					{/each}
				{/if}

				{#if k >= 5}
					{#each hoodLabels as h (h.name)}
						<text class="hood-label" transform="translate({h.xy[0]},{h.xy[1]}) scale({1 / k})" text-anchor="middle">{h.name}</text>
					{/each}
				{/if}

				<!-- U of T St. George campus marker (label hidden when zoomed in, so it doesn't cover places) -->
				<g class="campus" transform="translate({campusXY[0]},{campusXY[1]}) scale({1 / k})">
					<circle r="22" />
					{#if k < 5}
						<text y="-28" text-anchor="middle">U of T St. George</text>
					{/if}
				</g>

				{#each points as p (p.id)}
					<g transform="translate({p.px},{p.py}) scale({1 / k})">
						<circle
							class="dot"
							class:sel={p.id === selectedId}
							r={p.id === selectedId ? 9 : 6.5}
							fill={colorOf(p.connection)}
							role="button"
							tabindex="0"
							aria-label="{p.placeName || 'Unnamed place'}, connection {p.connection ?? 'unknown'} out of 5"
							onclick={() => (selectedId = p.id === selectedId ? null : p.id)}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									selectedId = p.id === selectedId ? null : p.id;
								}
							}}
						><title>{p.placeName}</title></circle>
						{#if p.id === selectedId}
							<text class="dot-label" y="-14" text-anchor="middle">{p.placeName}</text>
						{/if}
					</g>
				{/each}
			</g>
		</svg>
		{#if loadError}
			<p class="error">{loadError}</p>
		{/if}
	</div>

	<div class="below">
		<ul class="legend">
			{#each GROUPS as g (g.id)}
				<li><span class="swatch" style:background={g.color}></span>{g.label}</li>
			{/each}
		</ul>
		<p class="count">{points.length} of {total} students' places shown{points.length !== total ? ' (filtered)' : ''}</p>
	</div>

	<div class="detail" aria-live="polite">
		{#if selected}
			<p class="detail-name">{selected.placeName || 'Unnamed place'}</p>
			<p>
				{selected.placeType ?? 'Type not given'} · {selected.hours ?? 'hours not given'} a week ·
				connection <b>{selected.connection ?? '–'}</b> out of 5 · mental health {selected.mentalHealth?.toLowerCase() ?? 'not given'} ·
				loneliness {selected.loneliness ?? '–'} out of 10
			</p>
		{:else}
			<p class="muted">Click a dot to see the place and how that student answered.</p>
		{/if}
	</div>
</figure>

<style>
	.chart {
		margin: 0;
		display: grid;
		align-content: start;
		gap: 0.6rem;
		padding: 1.1rem 1.25rem 1rem;
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: 10px;
		min-width: 0;
	}
	h2 {
		margin: 0;
		font: 600 1.15rem/1.2 var(--font-display);
	}
	.col {
		margin: 0.3rem 0 0;
		font-size: 0.75rem;
		color: var(--muted);
		line-height: 1.4;
	}
	.controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.4rem 1rem;
	}
	.zoom-buttons {
		display: flex;
		gap: 0.3rem;
	}
	.zoom-buttons button {
		min-width: 2.1rem;
		padding: 0.3rem 0.65rem;
		border: 1px solid var(--line);
		border-radius: 6px;
		background: var(--surface);
		color: var(--fg);
		font: inherit;
		font-size: 0.85rem;
		cursor: pointer;
	}
	.zoom-buttons button:hover {
		border-color: var(--accent);
	}
	.zoom-buttons button:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.hint {
		margin: 0;
		font-size: 0.75rem;
		color: var(--muted);
	}
	.map {
		position: relative;
		border: 1px solid var(--line);
		border-radius: 8px;
		overflow: hidden;
		background: var(--bg);
	}
	svg {
		display: block;
		width: 100%;
		height: auto;
		max-height: 52vh;
		cursor: grab;
		touch-action: pan-y;
	}
	svg:active {
		cursor: grabbing;
	}
	.hood {
		fill: var(--track);
		stroke: var(--line);
		stroke-width: 1;
		vector-effect: non-scaling-stroke;
	}
	.hood-label {
		fill: var(--muted);
		font-size: 11px;
		pointer-events: none;
		opacity: 0.8;
	}
	.campus circle {
		fill: none;
		stroke: var(--accent);
		stroke-width: 1.5;
		stroke-dasharray: 4 3;
	}
	.campus text {
		fill: var(--accent);
		font-size: 11px;
		font-weight: 600;
		pointer-events: none;
	}
	.dot {
		stroke: var(--surface);
		stroke-width: 2;
		cursor: pointer;
	}
	.dot.sel {
		stroke: var(--fg);
		stroke-width: 2.5;
	}
	.dot:focus-visible {
		outline: none;
		stroke: var(--accent);
		stroke-width: 3;
	}
	.dot-label {
		fill: var(--fg);
		font-size: 12px;
		font-weight: 600;
		paint-order: stroke;
		stroke: var(--surface);
		stroke-width: 3px;
		pointer-events: none;
	}
	.below {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0.4rem 1rem;
	}
	.legend {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem 1rem;
		font-size: 0.78rem;
		color: var(--muted);
	}
	.legend li {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}
	.swatch {
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 50%;
	}
	.count {
		margin: 0;
		font-size: 0.78rem;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
	.detail {
		min-height: 3.2rem;
		padding: 0.6rem 0.8rem;
		background: var(--track);
		border-radius: 6px;
		font-size: 0.85rem;
		line-height: 1.45;
	}
	.detail p {
		margin: 0;
	}
	.detail-name {
		font-weight: 600;
	}
	.muted {
		color: var(--muted);
	}
	.error {
		margin: 0;
		padding: 0.5rem;
		color: var(--bad-2);
		font-size: 0.85rem;
	}
</style>
