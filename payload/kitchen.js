(function(root) {
  function kitchenFor(divider,colors) {
    return [
      [2,1,2,3,0x819ba6],[2,1,1,2,0xb8c8ca],[3,2,1,1,0xe3e7d8],
      [6,1,divider-12,1,colors.wood],[6,2,divider-12,1,0x686b60],[6,3,divider-12,1,colors.wood],
      [6,1,2,2,0x27353e],[7,1,1,1,0x69d6bd],[7,2,1,1,0xe3e7d8],
      [9,2,2,1,0x819ba6],[10,1,1,1,0xb8c8ca],[12,2,1,1,0xe3e7d8],
      ...(divider>=26?[[divider-10,1,3,2,0x819ba6],[divider-10,1,2,1,0x27353e]]:[]),
      [9,9,3,1,colors.wood],[10,9,1,1,0xe3e7d8],[8,10,1,1,colors.edge],[12,10,1,1,colors.edge],
      [divider-2,1,1,1,colors.plant],[divider-2,2,1,1,colors.wood]
    ];
  }
  if(typeof module!=='undefined')module.exports={kitchenFor};else root.kitchenFor=kitchenFor;
})(typeof globalThis!=='undefined'?globalThis:this);
