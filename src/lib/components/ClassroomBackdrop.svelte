<script>
	/**
	 * Faint hand-drawn classroom: a chalkboard, bookshelf, window and clock, with happy students
	 * at their desks, waving and high-fiving. Companion to Backdrop.svelte (same pen, same people),
	 * used behind the "Our students" chapter opener. Decorative only (aria-hidden).
	 * Fills its nearest positioned parent (give that parent `position: relative`), anchored to the bottom.
	 * Uses the shared #sketch filter from +layout.svelte for the pen wobble.
	 */

	/** Person with feet at (0,0), about 150 units tall, smiling. */
	const people = [
		// Standing by the bookshelf, hugging books and waving
		{ x: 300, y: 880, s: 1, lean: -4, arms: 'books', hair: 'long' },
		// Desk 1
		{ x: 445, y: 880, s: 0.9, lean: -6, sit: true, arms: 'up', hair: 'curly' },
		{ x: 545, y: 880, s: 0.9, lean: 6, sit: true, arms: 'wave', hair: 'bun', flip: true },
		// Desk 2
		{ x: 705, y: 880, s: 0.9, lean: 0, sit: true, arms: 'wave', hair: 'short' },
		{ x: 805, y: 880, s: 0.9, lean: 8, sit: true, arms: 'chin', hair: 'long', flip: true },
		// Desk 3
		{ x: 965, y: 880, s: 0.9, lean: -8, sit: true, arms: 'up', hair: 'short' },
		// Two friends high-fiving by the window
		{ x: 1150, y: 880, s: 1.02, lean: 6, arms: 'hi5', hair: 'curly' },
		{ x: 1232, y: 880, s: 0.97, lean: 6, arms: 'hi5', hair: 'bun', flip: true }
	];

	const arms = {
		up: 'M-12,-112 q-18,-14 -22,-38 M12,-112 q18,-14 22,-38',
		wave: 'M-12,-112 q-12,22 2,40 M12,-112 q16,-10 20,-40 M28,-156 l6,-8 M36,-150 l9,-3',
		books: 'M-12,-112 q-6,24 10,34 M12,-112 q16,-10 20,-40 M28,-156 l6,-8 M36,-150 l9,-3',
		chin: 'M-12,-112 q-12,22 2,40 M12,-112 q14,18 0,30 q-6,-4 -6,-22',
		hi5: 'M-12,-112 q-12,22 2,40 M12,-112 q20,-16 30,-50 M38,-170 l4,-10 M44,-166 l10,-4'
	};
	const hairs = {
		short: 'M-18,-146 q4,-18 18,-16 q16,-2 18,16 q-8,-8 -18,-8 q-10,0 -18,8',
		long: 'M-19,-142 q-2,-24 19,-24 q21,0 19,24 q4,22 2,34 M-19,-142 q-4,22 -2,34',
		bun: 'M-18,-146 q4,-18 18,-16 q16,-2 18,16 M0,-162 a9,9 0 1,1 0.1,0',
		curly: 'M-20,-140 q-8,-6 -2,-14 q-4,-10 8,-12 q4,-10 14,-4 q10,-6 16,4 q12,2 8,12 q6,8 -2,14'
	};

	// Desks in front of the seated students: [left x, width]
	const desks = [
		[395, 200],
		[655, 200],
		[915, 110]
	];
	const DESK_TOP = 800;

	/** @type {{ y: number, books: { x: number, w: number, h: number, kind?: string }[] }[]} */
	// Books on the shelf, per shelf row (shelf bottoms at 560, 700, 840)
	const shelves = [
		{ y: 560, books: [{ x: 62, w: 18, h: 70 }, { x: 82, w: 14, h: 82 }, { x: 98, w: 22, h: 64 }, { x: 124, w: 16, h: 76 }, { x: 150, w: 30, h: 18, kind: 'flat' }, { x: 186, w: 18, h: 72 }] },
		{ y: 700, books: [{ x: 62, w: 22, h: 76 }, { x: 86, w: 16, h: 66 }, { x: 104, w: 14, h: 80 }, { x: 140, w: 18, h: 70, kind: 'lean' }, { x: 178, w: 20, h: 60 }] },
		{ y: 840, books: [{ x: 62, w: 16, h: 74 }, { x: 80, w: 24, h: 62 }, { x: 108, w: 16, h: 80 }, { x: 128, w: 18, h: 70 }, { x: 150, w: 14, h: 76 }, { x: 168, w: 22, h: 64 }] }
	];
</script>

<svg class="backdrop" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
	<g class="ink" filter="url(#sketch)">
		<!-- Bunting across the top -->
		<path d="M40,70 q680,90 1360,0" />
		{#each Array.from({ length: 13 }, (_, i) => i) as i}
			{@const x = 90 + i * 105}
			{@const sag = 70 + 90 * 4 * ((x - 40) / 1360) * (1 - (x - 40) / 1360) * 0.5}
			<path d="M{x - 24},{sag} L{x},{sag + 44} L{x + 24},{sag}" />
		{/each}

		<!-- Chalkboard -->
		<rect x="330" y="190" width="760" height="300" rx="6" />
		<rect x="346" y="206" width="728" height="268" rx="3" />
		<path d="M320,506 h780 M320,506 v-12 M1100,506 v-12" />
		<path d="M420,500 h34 v-6 h-34 z M840,500 h22 v-6 h-22 z" />
		<g class="chalk">
			<!-- smiley + heart + star doodles on the board -->
			<circle cx="930" cy="290" r="38" />
			<path d="M916,280 v6 M944,280 v6 M910,300 q20,22 40,0" />
			<path d="M980,400 c0,-22 32,-22 32,0 c0,-22 32,-22 32,0 c0,24 -32,40 -32,48 c0,-8 -32,-24 -32,-48 z" />
			<path d="M860,420 l8,20 l22,2 l-17,13 l6,21 l-19,-12 l-19,12 l6,-21 l-17,-13 l22,-2 z" />
		</g>

		<!-- Clock -->
		<circle cx="1230" cy="150" r="44" />
		<path d="M1230,150 V118 M1230,150 l22,12" />
		<path d="M1230,112 v6 M1230,182 v6 M1192,150 h6 M1262,150 h6" />

		<!-- Window with a plant on the sill -->
		<rect x="1180" y="250" width="220" height="330" />
		<path d="M1290,250 V580 M1180,415 H1400" />
		<path d="M1170,580 h240" />
		<path d="M1200,300 q20,-24 46,-6 q20,-14 34,6" class="far" />
		<path d="M1320,560 h50 l-6,-40 h-38 z" />
		<path d="M1345,520 q-24,-30 -10,-64 M1345,520 q4,-40 28,-60 M1345,520 q-30,-6 -44,-34 M1345,520 q30,-10 40,-34" />

		<!-- Bookshelf -->
		<path d="M40,420 V880 M240,420 V880 M40,420 H240" />
		{#each shelves as sh}
			<path d="M40,{sh.y} H240" />
			{#each sh.books as { x, w, h, kind }}
				{#if kind === 'flat'}
					<rect x={x} y={sh.y - w * 0.6} width={w + 10} height={h} />
					<rect x={x + 4} y={sh.y - w * 0.6 - h} width={w} height={h} />
				{:else if kind === 'lean'}
					<rect x={x} y={sh.y - h} width={w} height={h} transform="rotate(-16 {x} {sh.y})" />
				{:else}
					<rect x={x} y={sh.y - h} width={w} height={h} />
					<path d="M{x},{sh.y - h + 12} h{w}" />
				{/if}
			{/each}
		{/each}
		<!-- Globe on top of the shelf -->
		<circle cx="140" cy="370" r="36" />
		<path d="M104,370 h72 M140,334 q-22,36 0,72 M140,334 q22,36 0,72 M140,406 v14 M118,420 h44" />

		<!-- Ground -->
		<path d="M0,880 H1440" />

		<!-- Students -->
		{#each people as p}
			<g transform="translate({p.x},{p.y}) scale({p.flip ? -p.s : p.s},{p.s}) rotate({p.lean} 0 -60)">
				<!-- head, happy closed eyes, big smile -->
				<circle class="solid" cx="0" cy="-140" r="18" />
				<path d="M-10,-143 q4,-6 8,0 M2,-143 q4,-6 8,0" />
				<path class="mouth" d="M-8,-134 q8,10 16,0 z" />
				<path d={hairs[/** @type {keyof typeof hairs} */ (p.hair)]} />
				<!-- shirt -->
				<path class="solid" d="M-14,-118 L14,-118 L18,-62 L-18,-62 Z" />
				<path d={arms[/** @type {keyof typeof arms} */ (p.arms)]} />
				{#if p.arms === 'books'}
					<!-- books hugged to the chest -->
					<path class="solid" d="M-22,-96 h30 v-12 h-30 z M-20,-84 h28 v-12 h-28 z" />
				{/if}
				<!-- legs -->
				{#if p.sit}
					<path d="M-10,-62 h30 v58 M8,-62 h30 v58" />
				{:else}
					<path d="M-8,-62 l-8,62 M8,-62 l8,62" />
				{/if}
			</g>
		{/each}

		<!-- Desks, drawn over the seated students' legs -->
		{#each desks as [x, w]}
			<path class="solid" d="M{x},{DESK_TOP} h{w} v12 h{-w} z" />
			<path class="solid" d="M{x + 12},{DESK_TOP + 12} h{w - 24} v44 h{-(w - 24)} z" />
			<path d="M{x + 12},{DESK_TOP + 56} V880 M{x + w - 12},{DESK_TOP + 56} V880" />
		{/each}
		<!-- Things on the desks: open book, apple, pencil cup, laptop -->
		<path d="M420,{DESK_TOP} q20,-12 40,0 q20,-12 40,0 M460,{DESK_TOP} v-6" />
		<path d="M568,{DESK_TOP} q-14,-2 -12,-16 q4,-12 14,-6 q10,-6 14,6 q2,14 -12,16 z M570,{DESK_TOP - 22} q2,-8 8,-10" />
		<path d="M680,{DESK_TOP} v-26 h22 v26 M686,{DESK_TOP - 26} l-4,-16 M694,{DESK_TOP - 26} l2,-18 M700,{DESK_TOP - 26} l6,-12" />
		<path d="M760,{DESK_TOP} h60 l-8,-4 M768,{DESK_TOP - 4} l6,-38 h44 l-6,38" />
		<path d="M980,{DESK_TOP} q20,-12 40,0 q20,-12 40,0 M1020,{DESK_TOP} v-6" />

		<!-- Happy words and hearts -->
		<text x="575" y="715" class="ha small" transform="rotate(-8 575 715)">yay!</text>
		<text x="1110" y="660" class="ha" transform="rotate(-10 1110 660)">hi-five!</text>
		<text x="250" y="680" class="ha small" transform="rotate(6 250 680)">hi!</text>
		<path d="M866,706 c0,-12 18,-12 18,0 c0,-12 18,-12 18,0 c0,14 -18,22 -18,26 c0,-4 -18,-12 -18,-26 z" />
		<path d="M1020,600 c0,-9 13,-9 13,0 c0,-9 13,-9 13,0 c0,10 -13,16 -13,19 c0,-3 -13,-9 -13,-19 z" />
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
	.chalk {
		stroke-width: 2;
	}
	.mouth {
		fill: var(--fg);
	}
	/* Heads, shirts and desks are filled with the page colour so they sit in front of what's behind. */
	.solid {
		fill: var(--bg);
	}
	text {
		fill: var(--fg);
		stroke: none;
		font-family: var(--font-display);
		font-weight: 700;
	}
	.ha {
		font-size: 44px;
	}
	.ha.small {
		font-size: 34px;
	}
	@media (max-width: 700px) {
		.backdrop {
			opacity: calc(var(--backdrop-opacity, 0.14) * 0.7);
		}
	}
</style>
