// Route chunks are split so the feed doesn't ship the markdown/highlighting code. Exposing the
// loader lets links warm the chunk on hover, before the click.
export const loadPost = () => import('../pages/Post');
