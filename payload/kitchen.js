(function(root) {
  const tableFor = divider => [Math.floor((divider-7)/2),7,7,2];
  function kitchenFor(divider,colors) {
    return [
      [2,1,divider-4,2,colors.wood],[2,2,divider-4,1,colors.edge],
      [2,1,2,2,0x819ba6],[3,1,1,1,0xb8c8ca],
      [6,1,2,2,0x27353e],[7,1,1,1,0xe3e7d8],
      [10,1,2,1,0x819ba6],
      ...(divider>=26?[[divider-8,1,3,1,0x819ba6],[divider-8,1,2,1,0x27353e]]:[]),
      [divider-3,1,1,1,colors.plant],[divider-3,2,1,1,colors.edge],
      [...tableFor(divider),colors.wood]
    ];
  }
  if(typeof module!=='undefined')module.exports={kitchenFor,tableFor};
  else {root.kitchenFor=kitchenFor;root.officeTableFor=tableFor;}
})(typeof globalThis!=='undefined'?globalThis:this);
