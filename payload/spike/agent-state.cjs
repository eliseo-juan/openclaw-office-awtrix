function projectAgentState(sessions, {connected = true, rosterComplete = true, pendingApproval = false} = {}) {
  if (!connected) return 'unknown';
  if (pendingApproval) return 'approval';
  const activity = sessions.map(row => {
    if (row.hasActiveRun === true || Array.isArray(row.activeRunIds) && row.activeRunIds.length > 0) return 'working';
    if (row.hasActiveRun === false || Array.isArray(row.activeRunIds) && row.activeRunIds.length === 0) return 'idle';
    return 'unknown';
  });
  if (activity.includes('working')) return 'working';
  if (!rosterComplete || activity.includes('unknown')) return 'unknown';
  return 'idle';
}

function mergeSession(previous, delta) {
  if (previous && previous.sessionId !== delta.sessionId) return {...delta};
  return {...previous, ...delta};
}
module.exports = {projectAgentState, mergeSession};
