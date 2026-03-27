// Empty module shim for Node.js-only imports in browser context
export default {};
export const createRequire = () => () => {};
export const fileURLToPath = (url) => url;
export const pathToFileURL = (path) => path;
