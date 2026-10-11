import {createPublicClient,http,isAddress,verifyMessage,keccak256,toHex} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import {monad,abi} from '../shared/chain.mjs';
import {verifyTrack,sessionMessage,proofTypes,nativeRunMessage} from '../shared/run.mjs';
import {findChallengeStart,validateNativeRun} from '../shared/challenge-start.mjs';
import deployment from '../src/deployment.json';
const json=(v,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function body(request) {
  if(Number(request.headers.get('content-length'))>1000000)throw new Error('Request too large.');
  const reader=request.body?.getReader();if(!reader)throw new Error('Request body required.');
  const chunks=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>1000000){await reader.cancel();throw new Error('Request too large.');}chunks.push(value);}
  const all=new Uint8Array(size);let offset=0;for(const chunk of chunks){all.set(chunk,offset);offset+=chunk.length;}return JSON.parse(new TextDecoder().decode(all));
}
export default {async fetch(request,env) {
  const url=new URL(request.url);if(!url.pathname.startsWith('/api/'))return env.ASSETS.fetch(request);
  if(request.method==='GET'&&url.pathname==='/api/config')return json({...deployment,app:'StepUp on Monad',gpsPrivacy:'Raw coordinates are validated in memory and are not stored. Only distance, duration, signature and session ID are retained.'});
  if(!['GET','POST'].includes(request.method))return json({error:'Method not allowed'},405);
  if(request.method==='POST'&&request.headers.get('Origin')!==env.APP_ORIGIN&&request.headers.get('Origin')!==url.origin)return json({error:'Origin not allowed'},403);
  if(env.RATE_LIMITER&&!(await env.RATE_LIMITER.limit({key:request.headers.get('CF-Connecting-IP')||'local'})).success)return json({error:'Too many requests. Try again in a minute.'},429);
  if(!deployment.escrow)return json({error:'Monad testnet deployment is not configured yet.'},503);
  const client=createPublicClient({chain:monad,transport:http(env.RPC_URL,{timeout:15000,retryCount:1})});
  try {
    if(url.pathname==='/api/native-runs'||url.pathname==='/api/native-proof') {
      const authorization=request.headers.get('Authorization');if(!authorization?.startsWith('Bearer '))return json({error:'Open this challenge from the signed-in Android app.'},401);
      const headers={apikey:env.SUPABASE_ANON_KEY,authorization};
      const userResponse=await fetch(`${env.SUPABASE_URL}/auth/v1/user`,{headers,signal:AbortSignal.timeout(10000)});
      if(!userResponse.ok)return json({error:'Your app session expired. Open challenges from the app again.'},401);
      const user=await userResponse.json();const since=new Date(Date.now()-24*3600000).toISOString();
      const response=await fetch(`${env.SUPABASE_URL}/rest/v1/walk_sessions?select=id,distance_meters,duration_sec,started_at,ended_at,verdict&user_id=eq.${encodeURIComponent(user.id)}&verdict=eq.CLEAN&started_at=gte.${encodeURIComponent(since)}&order=started_at.desc&limit=30`,{headers,signal:AbortSignal.timeout(10000)});
      if(!response.ok)throw new Error('Unable to read your server-verified runs.');const runs=await response.json();
      if(request.method==='GET'&&url.pathname==='/api/native-runs')return json({userId:user.id,runs});
      if(request.method!=='POST')return json({error:'Method not allowed'},405);
      const input=await body(request);if(!isAddress(input.runner)||!Number.isSafeInteger(input.challengeId)||!Number.isSafeInteger(input.runId))throw new Error('Invalid run claim.');
      const run=runs.find(r=>r.id===input.runId);if(!run)throw new Error('A clean run from the last 24 hours is required.');
      const message=nativeRunMessage(env.APP_ORIGIN,user.id,input.runId,input.challengeId,input.runner);
      if(!(await verifyMessage({address:input.runner,message,signature:input.signature})))return json({error:'Wallet signature does not match this app run.'},401);
      const c=await client.readContract({address:deployment.escrow,abi,functionName:'challenges',args:[BigInt(input.challengeId)]});
      let created=await env.DB.prepare('SELECT created_at FROM challenge_start WHERE contract=? AND challenge_id=?').bind(deployment.escrow,String(input.challengeId)).first();
      if(!created){const found=await findChallengeStart(client,{address:deployment.escrow,abi,deploymentBlock:deployment.blockNumber,id:input.challengeId});await env.DB.prepare('INSERT OR IGNORE INTO challenge_start(contract,challenge_id,block_number,created_at) VALUES(?,?,?,?)').bind(deployment.escrow,String(input.challengeId),found.blockNumber,found.timestamp).run();created={created_at:found.timestamp};}
      validateNativeRun(run,{targetMeters:c[3],endsAt:Number(c[2]),claimed:c[5],slots:c[4]},created.created_at);
      const signer=privateKeyToAccount(env.VERIFIER_PRIVATE_KEY);if(signer.address.toLowerCase()!==deployment.verifier.toLowerCase())throw new Error('Verifier configuration mismatch.');
      const proof={challengeId:String(input.challengeId),runner:input.runner,sessionId:keccak256(toHex(`native:${user.id}:${run.id}`)),distanceMeters:Math.floor(run.distance_meters),durationSeconds:run.duration_sec,deadline:Number(c[2])+86400};
      const signature=await signer.signTypedData({domain:{name:'StepUpMonadChallenge',version:'1',chainId:10143,verifyingContract:deployment.escrow},types:proofTypes,primaryType:'RunProof',message:proof});return json({proof,signature});
    }
    if(request.method==='GET'&&url.pathname==='/api/challenges') {
      const count=Number(await client.readContract({address:deployment.escrow,abi,functionName:'challengeCount'}));
      const list=await Promise.all(Array.from({length:Math.min(count,40)},async(_,i)=>{const id=count-i;const c=await client.readContract({address:deployment.escrow,abi,functionName:'challenges',args:[BigInt(id)]});return {id,sponsor:c[0],reward:c[1].toString(),endsAt:Number(c[2]),targetMeters:c[3],slots:c[4],claimed:c[5],remaining:c[6].toString(),title:c[7]};}));return json({challenges:list});
    }
    if(request.method==='POST'&&url.pathname==='/api/session') {
      const input=await body(request);if(!isAddress(input.runner)||!Number.isSafeInteger(input.challengeId)||input.challengeId<1)throw new Error('Invalid runner or challenge.');
      const c=await client.readContract({address:deployment.escrow,abi,functionName:'challenges',args:[BigInt(input.challengeId)]});
      if(Number(c[2])*1000<=Date.now()||c[5]>=c[4])throw new Error('This challenge is closed.');
      const session={id:crypto.randomUUID(),runner:input.runner.toLowerCase(),challenge_id:String(input.challengeId),nonce:crypto.randomUUID(),started_at:Date.now()};
      await env.DB.prepare('INSERT INTO challenges_sessions(id,runner,challenge_id,nonce,started_at) VALUES(?,?,?,?,?)').bind(session.id,session.runner,session.challenge_id,session.nonce,session.started_at).run();
      const saved=session;
      return json({session:saved,message:sessionMessage(env.APP_ORIGIN,saved)});
    }
    if(request.method==='POST'&&url.pathname==='/api/verify') {
      const input=await body(request);if(typeof input.id!=='string'||typeof input.signature!=='string')throw new Error('Session and wallet signature required.');
      const session=await env.DB.prepare('SELECT * FROM challenges_sessions WHERE id=?').bind(input.id).first();if(!session)throw new Error('Session not found. Start a new run.');
      if(!(await verifyMessage({address:session.runner,message:sessionMessage(env.APP_ORIGIN,session),signature:input.signature})))return json({error:'Wallet signature does not match this run.'},401);
      if(session.proof)return json({proof:JSON.parse(session.proof),signature:session.signature});
      const now=Date.now();const track=verifyTrack(input.points,session.started_at,now);
      const c=await client.readContract({address:deployment.escrow,abi,functionName:'challenges',args:[BigInt(session.challenge_id)]});
      if(now>Number(c[2])*1000||track.distanceMeters<c[3]||c[5]>=c[4])throw new Error('Run does not meet this active challenge.');
      if(!env.VERIFIER_PRIVATE_KEY)return json({error:'Verification signer is not configured.'},503);
      const signer=privateKeyToAccount(env.VERIFIER_PRIVATE_KEY);if(signer.address.toLowerCase()!==deployment.verifier?.toLowerCase())throw new Error('Verifier configuration mismatch.');
      const proof={challengeId:session.challenge_id,runner:session.runner,sessionId:keccak256(toHex(session.id)),...track,deadline:Number(c[2])+86400};
      const signature=await signer.signTypedData({domain:{name:'StepUpMonadChallenge',version:'1',chainId:10143,verifyingContract:deployment.escrow},types:proofTypes,primaryType:'RunProof',message:proof});
      await env.DB.prepare('UPDATE challenges_sessions SET proof=?,signature=?,distance_m=?,duration_sec=?,finished_at=? WHERE id=? AND proof IS NULL').bind(JSON.stringify(proof),signature,track.distanceMeters,track.durationSeconds,now,session.id).run();
      const result=await env.DB.prepare('SELECT proof,signature FROM challenges_sessions WHERE id=?').bind(session.id).first();return json({proof:JSON.parse(result.proof),signature:result.signature});
    }
    return json({error:'Not found'},404);
  } catch(error){return json({error:error.shortMessage||error.message||'Request failed'},400);}
}};
