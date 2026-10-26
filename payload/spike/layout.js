function layoutFor(agentIds, page = 0) {
  if (!Array.isArray(agentIds) || agentIds.some(id => typeof id !== 'string' || !id)) throw new TypeError('Agent IDs must be nonempty strings');
  if (new Set(agentIds).size !== agentIds.length) throw new TypeError('Agent IDs must be unique');
  if (!Number.isInteger(page) || page < 0) throw new RangeError('Page must be a nonnegative integer');
  const capacity = 8;
  const pageCount = Math.max(1, Math.ceil(agentIds.length / capacity));
  const currentPage = Math.min(page, pageCount - 1);
  const visibleIds = agentIds.slice(currentPage * capacity, (currentPage + 1) * capacity);
  const columns = Math.ceil(visibleIds.length / 2);
  const divider = columns ? Math.min(33, 51 - (columns * 7 + 4)) : 33;
  const firstScreen = 46 - Math.max(0, columns - 1) * 7;
  const desktopStart = columns ? Math.max(divider + 1, firstScreen - 3) : null;
  const seats = visibleIds.map((agentId, i) => {
    const upper = i < columns;
    const x = firstScreen + (i % columns) * 7;
    return {agentId, screen: {x, y: upper ? 1 : 13, width: 3, height: 2}, bot: {x: x - 1, y: upper ? 4 : 9, width: 5, height: 3}, chair: {x, y: upper ? 4 : 10, width: 3, height: 2}, facing: upper ? 'up' : 'down'};
  });
  return {
    width: 52, height: 16, totalAgents: agentIds.length, capacity,
    page: currentPage, pageCount, divider, seats,
    doors: [{x: divider, y: 6, width: 1, height: 4}, {x: 51, y: 6, width: 1, height: 4}],
    desktops: columns ? [{x: desktopStart, y: 1, width: 51 - desktopStart, height: 3}, ...(visibleIds.length > columns ? [{x: desktopStart, y: 12, width: 51 - desktopStart, height: 3}] : [])] : []
  };
}
if (typeof module !== 'undefined') module.exports = {layoutFor};
