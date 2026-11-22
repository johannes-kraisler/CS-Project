<script>
	/**
	 * Faint hand-drawn Toronto scene: a skyline with the CN Tower, a café, a park bench and
	 * groups of friends laughing. Decorative only (aria-hidden).
	 * Fills its nearest positioned parent (give that parent `position: relative`), anchored to
	 * the bottom. `sky={false}` drops the sun, clouds and birds (e.g. where other doodles sit).
	 * Uses the shared #sketch filter from +layout.svelte for the pen wobble.
	 * @type {{ sky?: boolean }}
	 */
	let { sky = true } = $props();

	/** Standing or sitting person, feet at (0,0), about 150 units tall, laughing. */
	const people = [
		// Café table: two friends sitting, leaning back laughing
		{ x: 215, y: 862, s: 0.78, lean: -8, sit: true, arms: 'up', hair: 'bun' },
		{ x: 330, y: 862, s: 0.78, lean: 10, sit: true, arms: 'belly', hair: 'short', flip: true },
		// Group of three standing in the middle
		{ x: 520, y: 880, s: 1, lean: -6, arms: 'up', hair: 'long' },
		{ x: 590, y: 880, s: 1.08, lean: 4, arms: 'belly', hair: 'short' },
		{ x: 665, y: 880, s: 0.95, lean: 12, arms: 'point', hair: 'curly', flip: true },
		// Park bench: two friends sitting
		{ x: 1215, y: 846, s: 0.8, lean: -10, sit: true, arms: 'up', hair: 'curly' },
		{ x: 1305, y: 846, s: 0.8, lean: 8, sit: true, arms: 'belly', hair: 'long', flip: true }
	];

	const arms = {
		up: 'M-12,-112 q-18,-14 -22,-38 M12,-112 q18,-14 22,-38',
		belly: 'M-12,-112 q-12,22 2,40 q8,4 14,-2 M12,-112 q12,22 -2,40',
		point: 'M-12,-112 q-14,18 -10,44 M12,-112 q20,-4 36,-18'
	};
	const hairs = {
		short: 'M-18,-146 q4,-18 18,-16 q16,-2 18,16 q-8,-8 -18,-8 q-10,0 -18,8',
		long: 'M-19,-142 q-2,-24 19,-24 q21,0 19,24 q4,22 2,34 M-19,-142 q-4,22 -2,34',
		bun: 'M-18,-146 q4,-18 18,-16 q16,-2 18,16 M0,-162 a9,9 0 1,1 0.1,0',
		curly: 'M-20,-140 q-8,-6 -2,-14 q-4,-10 8,-12 q4,-10 14,-4 q10,-6 16,4 q12,2 8,12 q6,8 -2,14'
	};

	// Windows for the skyline towers: [x, y, w, h, cols, rows]
	const towers = [
		[700, 640, 70, 160, 3, 6],
		[780, 590, 60, 210, 2, 8],
		[1000, 610, 80, 190, 3, 7],
		[1090, 660, 60, 140, 2, 5],
		[1390, 630, 70, 170, 3, 6]
	];
	/** @param {number[]} t */
	const windows = ([x, y, w, h, c, r]) => {
		const out = [];
		for (let i = 0; i < c; i++)
			for (let j = 0; j < r; j++)
				out.push(`M${x + 10 + i * ((w - 20) / c)},${y + 14 + j * 24} h${(w - 20) / c - 8} v10 h${-((w - 20) / c - 8)} z`);
		return out.join(' ');
	};
</script>

<svg class="backdrop" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
	<g class="ink" filter="url(#sketch)">
		<!-- Sky: sun, clouds, birds -->
		{#if sky}
		<circle cx="1260" cy="150" r="46" />
		<path d="M1260,82 v-22 M1260,218 v22 M1192,150 h-22 M1328,150 h22 M1212,102 l-15,-15 M1308,198 l15,15 M1308,102 l15,-15 M1212,198 l-15,15" />
		<path d="M180,180 q10,-34 46,-26 q14,-28 50,-14 q30,-6 34,24 q26,8 12,30 h-148 q-20,-6 6,-14 z" />
		<path d="M820,120 q8,-26 36,-20 q12,-22 40,-10 q24,-4 26,18 q20,6 10,22 h-118 q-16,-4 6,-10 z" />
		<path d="M520,230 q8,-8 16,0 q8,-8 16,0 M580,200 q6,-6 12,0 q6,-6 12,0 M1000,260 q8,-8 16,0 q8,-8 16,0" />
		{/if}

		<!-- Skyline (background, lighter) -->
		<g class="far">
			{#each towers as t}
				<rect x={t[0]} y={t[1]} width={t[2]} height={t[3]} />
				<path d={windows(t)} />
			{/each}
			<!-- CN Tower -->
			<path d="M910,800 L922,420 M950,800 L938,420 M922,420 h16" />
			<ellipse cx="930" cy="410" rx="30" ry="14" />
			<path d="M914,398 L918,370 h24 L946,398 M926,370 L928,330 h4 L934,370 M930,330 V250" />
			<!-- Rogers Centre dome -->
			<path d="M840,800 q0,-70 75,-70 q75,0 75,70 M860,770 q55,-40 110,0" />
			<path d="M0,800 H1440" />
		</g>

		<!-- Café (left foreground) -->
		<path d="M40,880 V560 H380 V880" />
		<path d="M30,560 H390 M30,560 l20,50 l20,-50 l20,50 l20,-50 l20,50 l20,-50 l20,50 l20,-50 l20,50 l20,-50 l20,50 l20,-50 l20,50 l20,-50 l20,50 l20,-50 l20,50 l20,-50" />
		<path d="M30,560 V610 M390,560 V610 M50,610 H370" />
		<text x="210" y="545" text-anchor="middle" class="sign">café</text>
		<rect x="70" y="640" width="120" height="110" />
		<path d="M130,640 V750 M70,695 H190" />
		<rect x="250" y="640" width="90" height="240" />
		<circle cx="326" cy="760" r="4" />
		<!-- Café table + mugs -->
		<path d="M230,800 h80 M270,800 V870 M246,870 h48" />
		<path d="M244,800 v-18 h16 v18 M260,786 q8,0 8,7 q0,6 -8,6 M282,800 v-16 h14 v16" />
		<path d="M250,772 q-4,-8 2,-14 M290,776 q-4,-8 2,-14" />

		<!-- Park (right foreground): tree, bench, lamp -->
		<path d="M1420,880 V700 M1405,880 q12,-20 15,-60" />
		<path d="M1340,720 q-40,-10 -30,-50 q-30,-30 0,-60 q0,-40 45,-40 q20,-30 60,-10 q40,-6 40,34" />
		<path d="M1170,800 h200 M1170,780 h200 M1170,760 h200 M1185,800 v46 M1355,800 v46 M1180,760 v40 M1360,760 v40" />
		<path d="M1100,880 V650 M1085,650 h30 l-6,-24 h-18 z" />

		<!-- Ground -->
		<path d="M0,880 H1440" />

		<!-- People laughing -->
		{#each people as p}
			<g transform="translate({p.x},{p.y}) scale({p.flip ? -p.s : p.s},{p.s}) rotate({p.lean} 0 -60)">
				<!-- head, happy closed eyes, open laughing mouth -->
				<circle class="solid" cx="0" cy="-140" r="18" />
				<path d="M-10,-143 q4,-6 8,0 M2,-143 q4,-6 8,0" />
				<path class="mouth" d="M-8,-134 q8,12 16,0 z" />
				<path d={hairs[/** @type {keyof typeof hairs} */ (p.hair)]} />
				<!-- shirt -->
				<path class="solid" d="M-14,-118 L14,-118 L18,-62 L-18,-62 Z" />
				<path d={arms[/** @type {keyof typeof arms} */ (p.arms)]} />
				<!-- legs -->
				{#if p.sit}
					<path d="M-10,-62 h30 v58 M8,-62 h30 v58" />
				{:else}
					<path d="M-8,-62 l-8,62 M8,-62 l8,62" />
				{/if}
				<!-- laugh lines -->
				<path d="M24,-156 l10,-6 M27,-142 h12 M24,-128 l10,6" />
			</g>
		{/each}

		<text x="470" y="680" class="ha" transform="rotate(-10 470 680)">ha ha!</text>
		<text x="600" y="650" class="ha" transform="rotate(8 600 650)">haha</text>
		<text x="405" y="760" class="ha small" transform="rotate(-6 405 760)">hehe</text>
		<text x="1175" y="690" class="ha" transform="rotate(-8 1175 690)">ha!</text>
	</g>
</svg>

<style>
	.backdrop {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		z-index: 0;
		pointer-events: none;
		opacity: var(--backdrop-opacity, 0.14);
	}
	.ink {
		fill: none;
		stroke: var(--fg);
		stroke-width: 2.4;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.far {
		opacity: 0.6;
		stroke-width: 2;
	}
	.mouth {
		fill: var(--fg);
	}
	/* Heads and shirts are filled with the page colour so people sit in front of the scenery. */
	.solid {
		fill: var(--bg);
	}
	text {
		fill: var(--fg);
		stroke: none;
		font-family: var(--font-display);
		font-weight: 700;
	}
	.sign {
		font-size: 40px;
	}
	.ha {
		font-size: 44px;
	}
	.ha.small {
		font-size: 32px;
	}
	@media (max-width: 700px) {
		.backdrop {
			opacity: calc(var(--backdrop-opacity, 0.14) * 0.7);
		}
	}
</style>
