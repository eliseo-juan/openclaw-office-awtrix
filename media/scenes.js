(function(root){
  const roles=[['Builder','Implementing the settings panel'],['Reviewer','Reviewing a pull request'],['Researcher','Comparing API options'],['Operator','Checking service health'],['Writer','Drafting release notes'],['Planner','Preparing the next task'],['Tester','Running integration checks'],['Analyst','Summarizing usage trends'],['Support','Triaging a support request'],['Designer','Exploring a new layout'],['Security','Checking dependencies'],['Release','Preparing a release']];
  const scenes={
    crew:{count:6,style:'Jelly',caffeine:'Coffee',idle:[2,5],label:'THE EVERYDAY CREW',title:['Your agents.','A little more alive.'],subtitle:'See who’s working. See who’s taking a break.'},
    small:{count:3,style:'Wisp',caffeine:'Decaf',idle:[2],label:'SMALL TEAM. SAME BIG IDEAS.',title:['Small crew.','Big little office.'],subtitle:'Three agents. One glance. A little room to breathe.'},
    busy:{count:8,style:'Circuit',caffeine:'Espresso',idle:[2,5],label:'A FULL HOUSE',title:['Eight agents.','One busy office.'],subtitle:'Six at their desks. Two recharging in the cafe.'},
    fleet:{count:12,style:'Orbit',caffeine:'Coffee',idle:[2,5,10],label:'ROOM FOR THE WHOLE TEAM',title:['More agents?','More floors.'],subtitle:'Eight desks per floor. The office grows with your crew.'},
    styles:{count:6,style:'Jelly',caffeine:'Coffee',idle:[2,5],label:'MAKE IT YOURS',title:['A little character.','Sixteen ways.'],subtitle:'Choose your bot style. Keep the whole crew recognizable.'}
  };
  const filmDuration=24000,coverDuration=10000;
  const filmShots=[
    {at:0,scene:'crew',title:'Meet your crew.',camera:[1.06,0,4]},
    {at:1200,scene:'crew',title:'Back to work.',states:[[2,'working']],camera:[1.08,-20,0]},
    {at:3300,scene:'crew',title:'Coffee break.',states:[[4,'idle']],camera:[1.03,12,0]},
    {at:6000,scene:'small',title:'Start small.',states:[[2,'working']],camera:[1.06,-12,0]},
    {at:9000,scene:'busy',title:'Room for eight.',states:[[2,'working']],camera:[1.02,10,0]},
    {at:10500,scene:'busy',title:'Room for eight.',states:[[4,'idle']],camera:[1.07,-12,0]},
    {at:12000,scene:'fleet',title:'Keep growing.',page:0,states:[[2,'working'],[4,'idle']],camera:[1.02,10,0]},
    {at:14000,scene:'fleet',title:'Keep growing.',page:1,states:[[10,'working'],[9,'idle']],camera:[1.06,-15,0]},
    {at:16000,scene:'crew',title:'Make it yours.',style:'Wisp',states:[[2,'working']],camera:[1.02,8,0]},
    {at:17250,scene:'crew',title:'Make it yours.',style:'Circuit',states:[[4,'idle']],camera:[1.04,-8,0]},
    {at:18500,scene:'crew',title:'Make it yours.',style:'Orbit',states:[[5,'working']],camera:[1.02,8,0]},
    {at:19750,scene:'crew',title:'Make it yours.',style:'Jelly',states:[[1,'idle']],camera:[1.04,-8,0]},
    {at:21000,scene:'crew',title:'OpenClaw Office.',camera:[1,0,0]}
  ];
  function filmShotAt(time){return filmShots.findLast(shot=>shot.at<=Math.max(0,time)%filmDuration);}
  const palette=[0x55c8c0,0xa59aeb,0xf19865,0xe8c25e,0xe281ad,0x8bc775,0x6da9ee,0xccccba];
  function agentsFor(scene){return roles.slice(0,scene.count).map(([label,task],i)=>({id:`demo-${i}`,label,task,state:scene.idle.includes(i)?'idle':'working',color:palette[i%8]}));}
  if(typeof module!=='undefined')module.exports={scenes,agentsFor,filmShots,filmDuration,coverDuration,filmShotAt};else root.officeShowcase={scenes,agentsFor,filmShots,filmDuration,coverDuration,filmShotAt};
})(typeof globalThis!=='undefined'?globalThis:this);
