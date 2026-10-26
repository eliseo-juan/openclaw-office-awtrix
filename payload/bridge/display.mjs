import {createRequire} from 'node:module';
const {layoutFor} = createRequire(import.meta.url)('../spike/layout.js');
const colors = [0x55c8c0,0xa59aeb,0xf19865,0xe8c25e,0xe281ad,0x8bc775,0x6da9ee,0xccccba];
export function displaySnapshot(state, page = 0) {
  const layout = layoutFor(state.agents.map(agent => agent.id), page);
  return {
    schema: 1, connected: state.connected, complete: state.complete, page: layout.page, pages: layout.pageCount,
    total: state.agents.length, divider: layout.divider,
    agents: layout.seats.map((seat, i) => {
      const agent = state.agents[layout.page*8+i];
      const hash = [...agent.id].reduce((h,c) => (h*31+c.charCodeAt(0))>>>0, 0);
      return {id: agent.id, state: agent.state, x: seat.screen.x, y: seat.bot.y, color: colors[hash%colors.length]};
    })
  };
}
