const { expect } = require('chai');
const { ethers } = require('hardhat');
const { time } = require('@nomicfoundation/hardhat-network-helpers');
const types = { RunProof: [{name:'challengeId',type:'uint256'},{name:'runner',type:'address'},{name:'sessionId',type:'bytes32'},{name:'distanceMeters',type:'uint32'},{name:'durationSeconds',type:'uint64'},{name:'deadline',type:'uint64'}] };
async function setup() {
  const [sponsor,verifier,runner,other]=await ethers.getSigners();const contract=await(await ethers.getContractFactory('MonadChallengeEscrow')).deploy(verifier.address);
  const endsAt=(await time.latest())+3600;await contract.createChallenge('River 5K',5000,2,endsAt,{value:ethers.parseEther('2')});
  const domain={name:'StepUpMonadChallenge',version:'1',chainId:(await ethers.provider.getNetwork()).chainId,verifyingContract:await contract.getAddress()};
  const proof={challengeId:1,runner:runner.address,sessionId:ethers.id('session-one'),distanceMeters:5000,durationSeconds:1800,deadline:endsAt};
  return {contract,sponsor,verifier,runner,other,endsAt,domain,proof,sign:(p=proof,d=domain)=>verifier.signTypedData(d,types,p)};
}
describe('Monad funded challenges',()=>{
  it('allows sponsored submission while paying only the signed runner',async()=>{const f=await setup();await expect(f.contract.connect(f.other).claim(f.proof,await f.sign())).changeEtherBalances([f.contract,f.runner],[-ethers.parseEther('1'),ethers.parseEther('1')]);expect((await f.contract.challenges(1)).remaining).eq(ethers.parseEther('1'));});
  it('rejects session replay and multiple claims by one runner',async()=>{const f=await setup();await f.contract.claim(f.proof,await f.sign());await expect(f.contract.claim(f.proof,await f.sign())).revertedWithCustomError(f.contract,'AlreadyClaimed');const p={...f.proof,sessionId:ethers.id('two')};await expect(f.contract.claim(p,await f.sign(p))).revertedWithCustomError(f.contract,'AlreadyClaimed');});
  it('rejects insufficient distance, altered recipient and wrong chain signatures',async()=>{const f=await setup();await expect(f.contract.claim({...f.proof,distanceMeters:100},await f.sign())).revertedWithCustomError(f.contract,'InvalidProof');await expect(f.contract.claim({...f.proof,runner:f.other.address},await f.sign())).revertedWithCustomError(f.contract,'InvalidProof');await expect(f.contract.claim(f.proof,await f.sign(f.proof,{...f.domain,chainId:46630}))).revertedWithCustomError(f.contract,'InvalidProof');});
  it('holds unclaimed funds through a full claim grace period, then refunds sponsor',async()=>{const f=await setup();await expect(f.contract.refund(1)).revertedWithCustomError(f.contract,'Expired');await time.increaseTo(f.endsAt+86401);await expect(f.contract.connect(f.other).refund(1)).revertedWithCustomError(f.contract,'NotSponsor');await expect(f.contract.refund(1)).changeEtherBalance(f.contract,-ethers.parseEther('2'));});
  it('rejects expired proof and invalid or underfunded challenge',async()=>{const f=await setup();await time.increaseTo(f.endsAt+1);await expect(f.contract.claim(f.proof,await f.sign())).revertedWithCustomError(f.contract,'Expired');await expect(f.contract.createChallenge('x',1,0,f.endsAt+300)).revertedWithCustomError(f.contract,'InvalidChallenge');});
});
