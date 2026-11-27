<script>
	import { MENTAL, NOT_THIRD, PLACE_TYPES } from '#lib/survey0.js';

	/**
	 * "Add yourself" quiz before the Chapter 02 charts. The reader answers three of the survey's
	 * questions; once added, their answers count as one extra student in every chart below.
	 * Nothing is saved: the parent keeps it in memory only, so a page refresh erases it.
	 * @type {{
	 *   onchange: (you: { mentalHealth: string, connection: number, placeType: string } | null) => void,
	 *   total: number
	 * }}
	 */
	let { onchange, total } = $props();

	const mentalOptions = Object.values(MENTAL);
	const connectionOptions = [
		{ value: 1, label: 'Not connected at all' },
		{ value: 2, label: 'Slightly connected' },
		{ value: 3, label: 'Moderately connected' },
		{ value: 4, label: 'Quite connected' },
		{ value: 5, label: 'Very connected' }
	];
	// Same groups as the bubbles in the favourite-places chart; anything that isn't a third space
	// (home, library, school or work) goes in one last option
	const placeOptions = PLACE_TYPES.map((t) => ({
		value: t,
		label: t === NOT_THIRD ? 'Somewhere else (home, library, school…)' : t
	}));

	/** @type {string | null} */
	let mentalHealth = $state(null);
	/** @type {number | null} */
	let connection = $state(null);
	/** @type {string | null} */
	let placeType = $state(null);
	let added = $state(false);

	let complete = $derived(mentalHealth != null && connection != null && placeType != null);

	// Once added, changing an answer updates the charts straight away.
	$effect(() => {
		if (added && complete) {
			onchange({
				mentalHealth: /** @type {string} */ (mentalHealth),
				connection: /** @type {number} */ (connection),
				placeType: /** @type {string} */ (placeType)
			});
		}
	});

	const remove = () => {
		added = false;
		mentalHealth = connection = placeType = null;
		onchange(null);
	};
</script>

<section class="quiz" aria-labelledby="quiz-title">
	<div class="card">
		<p class="kicker mono"><span class="hl-marker">Your turn</span></p>
		<h2 id="quiz-title">How about you?</h2>
		<p class="intro">
			Answer the same three questions we asked the students.
		</p>

		<fieldset>
			<legend>1. In general, how would you rate your mental health?</legend>
			<div class="options">
				{#each mentalOptions as o (o)}
					<label class="opt" class:on={mentalHealth === o}>
						<input type="radio" name="q-mh" value={o} bind:group={mentalHealth} />
						{o}
					</label>
				{/each}
			</div>
		</fieldset>

		<fieldset>
			<legend>2. How connected do you feel to the people in your surroundings?</legend>
			<div class="options">
				{#each connectionOptions as o (o.value)}
					<label class="opt" class:on={connection === o.value}>
						<input type="radio" name="q-conn" value={o.value} bind:group={connection} />
						{o.label}
					</label>
				{/each}
			</div>
		</fieldset>

		<fieldset>
			<legend>3. What is your favourite place to visit outside of school/work and home?</legend>
			<div class="options">
				{#each placeOptions as o (o.value)}
					<label class="opt" class:on={placeType === o.value}>
						<input type="radio" name="q-place" value={o.value} bind:group={placeType} />
						{o.label}
					</label>
				{/each}
			</div>
		</fieldset>

		<div class="actions" aria-live="polite">
			{#if !added}
				<button type="button" class="add" disabled={!complete} onclick={() => (added = true)}>
					Add me to the charts ↓
				</button>
				{#if !complete}
					<span class="hint">Answer all three to continue.</span>
				{/if}
			{:else}
				<p class="done">
					<b>You're in!</b> The charts below now include you, as 1 of {total} students. Change an answer above to
					update them.
				</p>
				<button type="button" class="remove" onclick={remove}>Remove my answers</button>
			{/if}
		</div>
	</div>
</section>

<style>
	.quiz {
		display: grid;
		justify-items: center;
		padding: 4rem 0 6rem;
	}
	.card {
		width: min(100%, 52rem);
		display: grid;
		gap: 1.3rem;
		padding: clamp(1.4rem, 3vw, 2.4rem);
		background: var(--surface);
		border: 2px solid var(--ink);
		border-radius: var(--wobble);
		box-shadow: var(--shadow);
		rotate: -0.4deg;
	}
	.kicker,
	h2,
	.intro {
		margin: 0;
	}
	h2 {
		font: 700 clamp(2.2rem, 4vw, 3.2rem) / 1 var(--font-display);
	}
	.intro {
		color: var(--muted);
		line-height: 1.5;
	}
	fieldset {
		margin: 0;
		padding: 0;
		border: 0;
		display: grid;
		gap: 0.6rem;
	}
	legend {
		padding: 0;
		margin-bottom: 0.6rem;
		font: 700 clamp(1.35rem, 2.2vw, 1.65rem) / 1.15 var(--font-display);
	}
	.options {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.opt {
		position: relative;
		padding: 0.4rem 0.95rem;
		border: 1.5px solid var(--ink);
		border-radius: var(--wobble-sm);
		background: var(--surface);
		font-size: 0.95rem;
		cursor: pointer;
		transition:
			background 160ms ease,
			transform 160ms ease,
			box-shadow 160ms ease;
	}
	.opt:hover {
		transform: translateY(-1px);
		box-shadow: 2px 3px 0 var(--ink);
	}
	.opt.on {
		background: var(--oi-yellow);
		font-weight: 700;
		box-shadow: 2px 3px 0 var(--ink);
	}
	/* Real radio buttons (keyboard and screen readers), visually replaced by the chip */
	.opt input {
		position: absolute;
		opacity: 0;
		inset: 0;
		margin: 0;
		cursor: pointer;
	}
	.opt:has(input:focus-visible) {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.8rem 1rem;
		padding-top: 0.4rem;
		border-top: 2px dashed color-mix(in srgb, var(--ink) 30%, transparent);
	}
	button {
		font: inherit;
		cursor: pointer;
		border: 2px solid var(--ink);
		border-radius: var(--wobble-sm);
	}
	.add {
		padding: 0.6rem 1.3rem;
		background: var(--accent);
		color: var(--ink);
		font-weight: 700;
		box-shadow: 3px 4px 0 var(--ink);
	}
	.add:disabled {
		opacity: 0.45;
		cursor: default;
		box-shadow: none;
	}
	.add:not(:disabled):hover {
		transform: translateY(-1px);
	}
	.remove {
		padding: 0.4rem 1rem;
		background: var(--surface);
	}
	.hint {
		color: var(--muted);
		font-size: 0.9rem;
	}
	.done {
		margin: 0;
		flex: 1 1 20rem;
		line-height: 1.5;
	}
	button:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
</style>
