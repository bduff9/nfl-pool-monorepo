export const getHashId = (hash: string) => (hash.startsWith("#") ? hash.slice(1) : hash);
