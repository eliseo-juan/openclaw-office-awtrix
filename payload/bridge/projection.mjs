import projection from '../spike/agent-state.cjs';

export function projectSnapshot(agents, sessions, {connected = true, complete = false} = {}) {
  const attributable = sessions.every(row => typeof row.agentId === 'string');
  return {
    connected, complete: connected && complete && attributable,
    agents: agents.filter(agent => agent.kind !== 'system').map(agent => ({
      id: agent.id,
      label: String(agent.name ?? agent.id),
      state: projection.projectAgentState(sessions.filter(row => row.agentId === agent.id), {connected, rosterComplete: complete && attributable})
    }))
  };
}

export async function readSessions(request) {
  const rows = [];
  const seen = new Set();
  let offset = 0;
  for (let page = 0; page < 1000; page++) {
    const result = await request('sessions.list', {limit: 100, offset});
    rows.push(...(result.sessions ?? []));
    if (result.hasMore === false) return {rows, complete: true};
    const next = result.nextOffset;
    if (!Number.isInteger(next) || next <= offset || seen.has(next)) return {rows, complete: false};
    seen.add(next); offset = next;
  }
  return {rows, complete: false};
}
