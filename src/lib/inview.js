/**
 * Svelte action: calls `onEnter` once, the first time the element is at least `threshold` visible.
 * Used to start chart entrance animations when the reader actually reaches them
 * (the first scene of each story mounts long before it scrolls into view).
 * @param {Element} node
 * @param {() => void} onEnter
 */
export function inview(node, onEnter) {
	const io = new IntersectionObserver(
		([e]) => {
			if (e.isIntersecting) {
				onEnter();
				io.disconnect();
			}
		},
		{ threshold: 0.3 }
	);
	io.observe(node);
	return { destroy: () => io.disconnect() };
}
