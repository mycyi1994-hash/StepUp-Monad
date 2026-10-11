export function haversine(a,b) {
  const rad=Math.PI/180,dLat=(b.lat-a.lat)*rad,dLng=(b.lng-a.lng)*rad;
  const h=Math.sin(dLat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dLng/2)**2;
  return 6371000*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));
}
export function verifyTrack(points,startedAt,now) {
  if(!Array.isArray(points)||points.length<10||points.length>10000)throw new Error('A run needs 10–10,000 GPS samples.');
  if(now-startedAt<30000||now-startedAt>6*3600000)throw new Error('Session duration outside supported range.');
  let distance=0,previous=null,first=null,last=null;
  for(const p of points) {
    if(!p||![p.lat,p.lng,p.at,p.accuracy].every(Number.isFinite)||Math.abs(p.lat)>90||Math.abs(p.lng)>180||p.accuracy<0||p.accuracy>50||p.at<startedAt-5000||p.at>now+5000)throw new Error('Invalid or inaccurate GPS sample.');
    if(previous) {
      const elapsed=(p.at-previous.at)/1000;
      if(elapsed<=0||elapsed>90)throw new Error('GPS timestamps are out of order or have a long gap.');
      const delta=haversine(previous,p);
      if(delta/elapsed>8)throw new Error('This trace exceeds the running speed limit.');
      if(delta>=2)distance+=delta;
    }
    first??=p.at;last=p.at;previous=p;
  }
  const durationSeconds=Math.floor((last-first)/1000);
  if(durationSeconds<30||last-first<0.8*(now-startedAt)||first>startedAt+30000||last<now-30000)throw new Error('The GPS trace does not cover the session.');
  return {distanceMeters:Math.floor(distance),durationSeconds};
}
export const proofTypes={RunProof:[{name:'challengeId',type:'uint256'},{name:'runner',type:'address'},{name:'sessionId',type:'bytes32'},{name:'distanceMeters',type:'uint32'},{name:'durationSeconds',type:'uint64'},{name:'deadline',type:'uint64'}]};
export function sessionMessage(origin,session) {return `StepUp on Monad\n${origin}\nRunner: ${session.runner}\nChallenge: ${session.challenge_id}\nSession: ${session.id}\nNonce: ${session.nonce}\nStarted: ${session.started_at}\nSign to bind this running session. No transaction or token approval.`;}
export function nativeRunMessage(origin,userId,runId,challengeId,runner){return `StepUp native run reward\n${origin}\nAccount: ${userId}\nRun: ${runId}\nChallenge: ${challengeId}\nRunner: ${runner.toLowerCase()}\nAuthorize this verified app run for this Monad challenge. No token approval.`;}
