let lastUserId: null | number = null;

// Next keeps previously visited pages mounted (hidden) so going back is instant. After signing out and in as
// someone else without a page load, those pages would still hold the previous user's unsaved client state, so the
// caller reloads when the signed-in user changes. The variable resets on every page load, so this can't loop.
export const isUserSwitch = (userId: number): boolean => {
  const switched = lastUserId !== null && lastUserId !== userId;

  lastUserId = userId;

  return switched;
};
