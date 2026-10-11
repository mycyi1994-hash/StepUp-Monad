// Public Monad RPC limits eth_getLogs to 100 blocks. Locate a challenge through
// monotonic challengeCount reads instead of an ever-growing historical log scan.
export async function findChallengeStart(client,{address,abi,deploymentBlock,id}) {
  const target=BigInt(id);if(target<1n)throw new Error('Invalid challenge.');
  let low=BigInt(deploymentBlock),high=await client.getBlockNumber();
  if(BigInt(await client.readContract({address,abi,functionName:'challengeCount',blockNumber:high}))<target)throw new Error('Challenge not found.');
  while(low<high){const middle=(low+high)/2n;const count=BigInt(await client.readContract({address,abi,functionName:'challengeCount',blockNumber:middle}));if(count>=target)high=middle;else low=middle+1n;}
  const block=await client.getBlock({blockNumber:low});return {blockNumber:Number(low),timestamp:Number(block.timestamp)};
}
export function validateNativeRun(run,challenge,createdAt,now=Date.now()) {
  const start=Date.parse(run.started_at),end=Date.parse(run.ended_at),elapsed=(end-start)/1000;
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<start||end>now+5000||start<now-24*3600000||start<createdAt*1000)throw new Error('The run must be recent and start after this challenge was created.');
  if(run.verdict!=='CLEAN'||!Number.isFinite(run.distance_meters)||run.distance_meters<challenge.targetMeters||run.distance_meters>100000||!Number.isSafeInteger(run.duration_sec)||run.duration_sec<30||run.duration_sec>21600||elapsed<run.duration_sec-5||run.distance_meters/run.duration_sec>8)throw new Error('This run does not meet the distance, duration or speed checks.');
  if(now>challenge.endsAt*1000||end>challenge.endsAt*1000||challenge.claimed>=challenge.slots)throw new Error('This challenge is closed.');
}
