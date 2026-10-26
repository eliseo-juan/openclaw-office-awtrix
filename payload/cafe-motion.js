(function(root) {
  const tableFor=typeof module!=='undefined'?require('./kitchen.js').tableFor:root.officeTableFor;
  const caffeineProfiles = {Decaf:{pauseMin:20000,pauseMax:45000,stepMs:200},Coffee:{pauseMin:10000,pauseMax:25000,stepMs:135},Espresso:{pauseMin:4000,pauseMax:10000,stepMs:100}};
  const overlaps = (a,b) => a[0]<b[0]+b[2]&&a[0]+a[2]>b[0]&&a[1]<b[1]+b[3]&&a[1]+a[3]>b[1];
  function obstaclesFor(divider,desktops=[]) {
    return [[0,0,52,1],[0,15,52,1],[0,0,1,16],[51,0,1,6],[51,10,1,6],
      [divider,0,1,6],[divider,10,1,6],[2,1,divider-4,2],tableFor(divider),
      ...desktops.map(d=>[d.x,d.y,d.width,d.height])];
  }
  const collisionBox = p => [p[0]+1,p[1],3,3];
  const free = (p,obstacles,peers) => p[0]>=1&&p[0]+5<=51&&p[1]>=1&&p[1]+3<=15&&
    !obstacles.some(r=>overlaps(collisionBox(p),r))&&!peers.some(other=>overlaps(collisionBox(p),collisionBox(other)));
  function stepToward(position,destination,divider,{desktops=[],cafeOnly=false}={}) {
    if(position.join(',')===destination.join(',')) return [...position];
    const obstacles=obstaclesFor(divider,desktops);
    if(!free(destination,obstacles,[])) return [...position];
    const key=p=>p[1]*52+p[0], start=key(position), goal=key(destination);
    const queue=[position],parents=new Map([[start,-1]]);
    for(let i=0;i<queue.length;i++) {
      const p=queue[i];
      for(const [dx,dy] of [[1,-1],[1,1],[-1,1],[-1,-1],[0,-1],[1,0],[0,1],[-1,0]]) {
        const next=[p[0]+dx,p[1]+dy], id=key(next);
        if(parents.has(id)||(cafeOnly&&next[0]+3>=divider)||!free(next,obstacles,[])) continue;
        if(dx&&dy&&(!free([p[0]+dx,p[1]],obstacles,[])||!free([p[0],p[1]+dy],obstacles,[])))continue;
        parents.set(id,key(p));
        if(id===goal) {
          let node=id;while(parents.get(node)!==start) node=parents.get(node);
          return [node%52,Math.floor(node/52)];
        }
        queue.push(next);
      }
    }
    return [...position];
  }
  class CafeMotion {
    constructor(seed=Math.floor(Math.random()*65521),{caffeine='Coffee',pauseMin,pauseMax,wander=true}={}) {
      const profile=caffeineProfiles[caffeine]??caffeineProfiles.Coffee;
      pauseMin??=profile.pauseMin;pauseMax??=profile.pauseMax;
      this.seed=seed%65521;this.target=null;this.waitUntil=0;this.blocked=0;
      this.pauseMin=pauseMin;this.pauseMax=Math.max(pauseMin,pauseMax);this.wander=wander;
    }
    random(limit) {this.seed=(this.seed*75+74)%65521;return this.seed%limit;}
    advance(position,desk,state,divider,now,{peers=[],reserved=[],desktops=[]}={}) {
      if(state==='unknown') return [...position];
      const context={peers,desktops};
      if(state!=='idle') {this.target=null;this.waitUntil=0;return stepToward(position,desk,divider,context);}
      const entrance=[divider-5,7];
      if(position[0]+3>=divider) {
        this.target=entrance;this.waitUntil=0;
        return stepToward(position,entrance,divider,context);
      }
      context.cafeOnly=true;
      if(this.target?.join(',')===entrance.join(',')){this.target=null;this.waitUntil=0;}

      const obstacles=obstaclesFor(divider,desktops);
      const points=[];
      for(let y=3;y<=12;y++)for(let x=1;x<=divider-4;x++) {
        if(x+4>divider-4&&y<10&&y+3>7)continue;
        points.push([x,y]);
      }
      const available=nearby=>{
        const options=points.filter(p=>free(p,obstacles,[...peers,...reserved])&&
          (p[0]!==position[0]||p[1]!==position[1])&&
          (!nearby||Math.abs(p[0]-position[0])+Math.abs(p[1]-position[1])<=10));
        return options;
      };
      if(!this.target||this.target[0]+3>=divider) {
        const options=available(false);if(!options.length)return [...position];
        this.target=options[this.random(options.length)];this.waitUntil=0;
      }
      if(position.join(',')===this.target.join(',')) {
        if(!this.wander)return [...position];
        if(!this.waitUntil)this.waitUntil=now+this.pauseMin+this.random(this.pauseMax-this.pauseMin+1);
        if(now<this.waitUntil)return [...position];
        const options=available(true);if(!options.length)return [...position];
        this.target=options[this.random(options.length)];this.waitUntil=0;
      }
      const next=stepToward(position,this.target,divider,context);
      if(next.join(',')===position.join(',')) {
        if(!this.blocked)this.blocked=now;
        if(now-this.blocked>5000){this.target=null;this.blocked=0;}
      } else this.blocked=0;
      return next;
    }
  }
  if(typeof module!=='undefined')module.exports={CafeMotion,stepToward,overlaps,obstaclesFor,caffeineProfiles,collisionBox};
  else {root.caffeineProfiles=caffeineProfiles;root.CafeMotion=CafeMotion;root.officeOverlaps=overlaps;}
})(typeof globalThis!=='undefined'?globalThis:this);
