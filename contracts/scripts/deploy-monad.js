const fs=require('node:fs');const {ethers,network}=require('hardhat');const {allModels}=require('./lib/catalog');const {loadConfig,v3Deployment,workerModule}=require('./lib/v3-deploy');
async function main(){
  const chain=await ethers.provider.getNetwork();if(chain.chainId!==10143n&&network.name!=='hardhat')throw new Error('Monad Testnet only');
  const [deployer]=await ethers.getSigners();const key=role=>{const k=process.env[role+'_PRIVATE_KEY'];if(!k)throw new Error('Missing role '+role);return new ethers.Wallet(k,ethers.provider);};
  const roles=Object.fromEntries(['OWNER','TREASURY','ATTESTER','SNEAKER_SIGNER','GUARDIAN','RECORDER','RELAYER','VERIFIER'].map(r=>[r,key(r)]));
  const file='deployments/monadTestnet.json';const record=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)): {chainId:10143,network:'Monad Testnet',contracts:{},transactions:{},deployedAt:new Date().toISOString()};
  const save=()=>fs.writeFileSync(file,JSON.stringify(record,null,2));fs.mkdirSync('deployments',{recursive:true});
  async function deploy(name,args){if(record.contracts[name]){const code=await ethers.provider.getCode(record.contracts[name]);if(code==='0x')throw new Error('Saved deployment has no code');return ethers.getContractAt(name,record.contracts[name]);}const c=await(await ethers.getContractFactory(name)).deploy(...args);await c.waitForDeployment();const r=await c.deploymentTransaction().wait();record.contracts[name]=await c.getAddress();record.transactions[name]={hash:r.hash,blockNumber:r.blockNumber};save();console.log(name,await c.getAddress());return c;}
  const escrow=await deploy('MonadChallengeEscrow',[roles.VERIFIER.address]);
  const web={chainId:10143,escrow:await escrow.getAddress(),verifier:roles.VERIFIER.address,rpc:'https://testnet-rpc.monad.xyz',explorer:'https://testnet.monadscan.com',transactionHash:record.transactions.MonadChallengeEscrow.hash,blockNumber:record.transactions.MonadChallengeEscrow.blockNumber,mode:'testnet',deployedAt:record.deployedAt};fs.writeFileSync('../monad/src/deployment.json',JSON.stringify(web,null,2));
  const sup=await deploy('SUPToken',[roles.TREASURY.address]);
  const distributor=await deploy('RewardDistributor',[await sup.getAddress(),roles.ATTESTER.address]);
  const sneakers=await deploy('StepUpSneakers',[roles.SNEAKER_SIGNER.address,roles.GUARDIAN.address,roles.TREASURY.address,2500,500,100000,'https://stepup-monad-attester.gana003.workers.dev/v2/meta/']);
  const vault=await deploy('SupVault',[await sup.getAddress(),await distributor.getAddress(),roles.GUARDIAN.address]);
  await deploy('CourseRegistry',[roles.RECORDER.address]);
  const schema=await deploy('SchemaRegistry',[]);await deploy('EAS',[await schema.getAddress()]);
  const cfg=loadConfig('monadTestnet'),v3=v3Deployment(cfg);
  if(await ethers.provider.getCode(cfg.proxy)==='0x')throw new Error('Canonical CREATE2 factory missing on Monad');
  if(await ethers.provider.getCode(v3.address)==='0x'){const tx=await deployer.sendTransaction({to:cfg.proxy,data:ethers.concat([v3.salt,v3.initcode])});const r=await tx.wait();record.transactions.StepUpSneakersV3={hash:r.hash,blockNumber:r.blockNumber};}
  record.contracts.StepUpSneakersV3=v3.address;save();fs.writeFileSync('../attester/src/v3-deploy.js',workerModule(cfg,v3));
  const wait=async tx=>(await tx).wait();
  // Roles remain separate even on testnet; only the deployer seeds gas.
  for(const role of ['TREASURY','RELAYER','RECORDER','OWNER'])if(await ethers.provider.getBalance(roles[role].address)<ethers.parseEther('0.05'))await wait(deployer.sendTransaction({to:roles[role].address,value:ethers.parseEther('0.1')}));
  if(await distributor.owner()===deployer.address){await wait(distributor.setGuardian(roles.GUARDIAN.address));await wait(distributor.setLimits(ethers.parseEther('50000'),ethers.parseEther('1000')));}
  if(await sneakers.owner()===deployer.address){const {ids,rarities}=allModels();if(!(await sneakers.modelExists(ids[0])))await wait(sneakers.addModels(ids,rarities));}
  if(await sup.balanceOf(await distributor.getAddress())===0n){await wait(sup.connect(roles.TREASURY).approve(await distributor.getAddress(),ethers.parseEther('50000000')));await wait(distributor.connect(roles.TREASURY).fund(ethers.parseEther('50000000')));}
  for(const name of ['RewardDistributor','StepUpSneakers','SupVault','CourseRegistry']){const c=await ethers.getContractAt(name,record.contracts[name]);if(await c.owner()===deployer.address){await wait(c.transferOwnership(roles.OWNER.address));await wait(c.connect(roles.OWNER).acceptOwnership());}}
  // Seed clearly labelled demo challenges, funded by this testnet deployment wallet.
  if(await escrow.challengeCount()===0n){for(const [title,meters,slots,reward] of [['First strides',100,10,'0.01'],['The daily 3K',3000,10,'0.02'],['Sunday crew 5K',5000,10,'0.03']])await wait(escrow.createChallenge(title,meters,slots,Math.floor(Date.now()/1000)+7*86400,{value:ethers.parseEther(reward)*BigInt(slots)}));}
  let toml=fs.readFileSync('../attester/wrangler.toml','utf8');const vars={DISTRIBUTOR_ADDRESS:record.contracts.RewardDistributor,SNEAKERS_ADDRESS:record.contracts.StepUpSneakers,VAULT_ADDRESS:record.contracts.SupVault,SNEAKERS_V3_ADDRESS:v3.address,EAS_ADDRESS:record.contracts.EAS,SCHEMA_REGISTRY_ADDRESS:record.contracts.SchemaRegistry,START_BLOCK:String(record.transactions.RewardDistributor.blockNumber),SNEAKERS_V3_START_BLOCK:String(record.transactions.StepUpSneakersV3.blockNumber)};for(const [k,v]of Object.entries(vars))toml=toml.replace(new RegExp('^'+k+' = ".*"','m'),`${k} = "${v}"`);fs.writeFileSync('../attester/wrangler.toml',toml);
  let wallet=fs.readFileSync('../web/wallet-config.js','utf8');for(const [k,v]of Object.entries({sup:record.contracts.SUPToken,sneakers:record.contracts.StepUpSneakers,vault:record.contracts.SupVault,sneakersV3:v3.address}))wallet=wallet.replace(new RegExp(k+": '[^']*'"),`${k}: '${v}'`);wallet=wallet.replace(/startBlock: \d+/,`startBlock: ${vars.START_BLOCK}`).replace(/v3StartBlock: \d+/,`v3StartBlock: ${vars.SNEAKERS_V3_START_BLOCK}`);fs.writeFileSync('../web/wallet-config.js',wallet);
  console.log('Monad suite deployed and configured.',file);
}
main().catch(e=>{console.error(e.shortMessage||e.message);process.exitCode=1;});
