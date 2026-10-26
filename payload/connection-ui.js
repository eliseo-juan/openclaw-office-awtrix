(function(root) {
  const offlineLetters = [[7,5,5,5,7],[7,4,6,4,4],[7,4,6,4,4],[4,4,4,4,7],[7,2,2,2,7],[5,7,7,7,5],[7,4,6,4,7]];
  function connectionPresentation(connected,receivedAt,now,timeout,wallColor=0x364655) {
    const offline=!connected||now-receivedAt>timeout;
    return {offline,wallColor:offline?0xffa63d:wallColor};
  }
  function offlinePixels() {
    const pixels=[];
    offlineLetters.forEach((rows,letter)=>rows.forEach((mask,row)=>{
      for(let col=0;col<3;col++)if(mask&(1<<(2-col)))pixels.push([12+letter*4+col,5+row]);
    }));
    return pixels;
  }
  const setupLetters = [[7,4,7,1,7],[7,4,6,4,7],[7,2,2,2,2],[5,5,5,5,7],[7,5,7,4,4]];
  function setupPreview() {
    return {divider:26,positions:[[3,4],[9,4],[15,4],[21,4],[3,11],[16,11]],letters:setupLetters,x:29};
  }
  const api={connectionPresentation,offlinePixels,offlineLetters,setupPreview};
  if(typeof module!=='undefined')module.exports=api;
  else root.officeConnectionUi=api;
})(typeof globalThis!=='undefined'?globalThis:this);
