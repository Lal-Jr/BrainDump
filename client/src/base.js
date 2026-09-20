// The blog is served from the portfolio under /blog (proxied), so every
// absolute URL the client builds must carry this prefix.
export const BASE = import.meta.env.BASE_URL; // '/blog/'
export const ROUTER_BASENAME = BASE.replace(/\/$/, ''); // '/blog'
export const withBase = (p = '') => BASE + p.replace(/^\//, '');
