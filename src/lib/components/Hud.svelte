<script>
	import { onMount } from 'svelte';

	/**
	 * Fixed reading HUD: a thin progress line across the top and the current chapter on the right
	 * ("[01 / 02] The city"). Hidden on the hero. Chapters are elements with data-chapter / data-title.
	 */
	let progress = $state(0);
	let shown = $state(false);
	let current = $state({ number: '', title: '' });
	let total = $state(0);

	onMount(() => {
		const chapters = /** @type {HTMLElement[]} */ (Array.from(document.querySelectorAll('[data-chapter]')));
		total = chapters.length;
		let frame = 0;
		const update = () => {
			frame = 0;
			const max = document.documentElement.scrollHeight - innerHeight;
			progress = max > 0 ? Math.min(1, scrollY / max) : 0;
			shown = scrollY > innerHeight * 0.6;
			const passed = chapters.filter((c) => c.getBoundingClientRect().top < innerHeight * 0.5);
			const c = passed[passed.length - 1];
			current = c ? { number: c.dataset.chapter ?? '', title: c.dataset.title ?? '' } : { number: '', title: '' };
		};
		const onScroll = () => {
			if (!frame) frame = requestAnimationFrame(update);
		};
		update();
		addEventListener('scroll', onScroll, { passive: true });
		addEventListener('resize', onScroll);
		return () => {
			cancelAnimationFrame(frame);
			removeEventListener('scroll', onScroll);
			removeEventListener('resize', onScroll);
		};
	});
</script>

<div class="hud" class:shown aria-hidden="true">
	<span class="bar" style:transform="scaleX({progress})"></span>
	<div class="row mono">
		<span class="brand">Belonging · Toronto</span>
		{#if current.number}
			<span class="chapter">
				<span class="idx">[{current.number} / {String(total).padStart(2, '0')}]</span>
				{current.title}
			</span>
		{/if}
	</div>
</div>

<style>
	.hud {
		position: fixed;
		inset: 0 0 auto;
		z-index: 50;
		background: linear-gradient(to bottom, var(--bg) 55%, color-mix(in srgb, var(--bg) 0%, transparent));
		opacity: 0;
		transform: translateY(-100%);
		transition:
			opacity 400ms ease,
			transform 500ms var(--ease-out);
		pointer-events: none;
	}
	.hud.shown {
		opacity: 1;
		transform: none;
	}
	.bar {
		display: block;
		height: 6px;
		background: var(--accent);
		transform-origin: left;
		border-radius: 0 4px 4px 0;
		filter: url(#sketch);
	}
	.row {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.7rem 1rem 1.4rem;
		max-width: 80rem;
		margin: 0 auto;
		color: var(--muted);
	}
	.chapter {
		color: var(--fg);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.idx {
		color: var(--ink);
		background: var(--highlight);
		padding: 0 0.25em;
		margin-right: 0.4rem;
	}
	@media (max-width: 520px) {
		.brand {
			display: none;
		}
	}
</style>
