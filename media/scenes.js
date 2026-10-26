(function(root){
  const roles=[['Builder','Implementing the settings panel'],['Reviewer','Reviewing a pull request'],['Researcher','Comparing API options'],['Operator','Checking service health'],['Writer','Drafting release notes'],['Planner','Preparing the next task'],['Tester','Running integration checks'],['Analyst','Summarizing usage trends'],['Support','Triaging a support request'],['Designer','Exploring a new layout'],['Security','Checking dependencies'],['Release','Preparing a release']];
  const scenes={
    crew:{count:6,style:'Jelly',caffeine:'Coffee',idle:[2,5],label:'THE EVERYDAY CREW',title:['Your agents.','A little more alive.'],subtitle:'See who’s working. See who’s taking a break.'},
    small:{count:3,style:'Wisp',caffeine:'Decaf',idle:[2],label:'SMALL TEAM. SAME BIG IDEAS.',title:['Small crew.','Big little office.'],subtitle:'Three agents. One glance. A little room to breathe.'},
    busy:{count:8,style:'Circuit',caffeine:'Espresso',idle:[2,5],label:'A FULL HOUSE',title:['Eight agents.','One busy office.'],subtitle:'Six at their desks. Two recharging in the cafe.'},
    fleet:{count:12,style:'Orbit',caffeine:'Coffee',idle:[2,5,10],label:'ROOM FOR THE WHOLE TEAM',title:['More agents?','More floors.'],subtitle:'Eight desks per floor. The office grows with your crew.'},
    styles:{count:6,style:'Jelly',caffeine:'Coffee',idle:[2,5],label:'MAKE IT YOURS',title:['A little character.','Sixteen ways.'],subtitle:'Choose your bot style. Keep the whole crew recognizable.'}
  };
  const palette=[0x55c8c0,0xa59aeb,0xf19865,0xe8c25e,0xe281ad,0x8bc775,0x6da9ee,0xccccba];
  function agentsFor(scene){return roles.slice(0,scene.count).map(([label,task],i)=>({id:`demo-${i}`,label,task,state:scene.idle.includes(i)?'idle':'working',color:palette[i%8]}));}
  if(typeof module!=='undefined')module.exports={scenes,agentsFor};else root.officeShowcase={scenes,agentsFor};
})(typeof globalThis!=='undefined'?globalThis:this);
