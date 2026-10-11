const hre = require('hardhat');
const fs = require('fs');
async function main() {
  if (hre.network.name !== 'monadTestnet') throw new Error('This manifest targets Monad Testnet');
  if (!process.env.MONAD_EXPLORER_API_KEY) throw new Error('Set an Etherscan API V2 key in MONAD_EXPLORER_API_KEY');
  const d = JSON.parse(fs.readFileSync('deployments/monadTestnet.json'));
  let failures=0;
  for (const [name,address] of Object.entries(d.contracts)) {
    try {
      const factory=await hre.ethers.getContractFactory(name);
      const transaction=await hre.ethers.provider.getTransaction(d.transactions[name].hash);
      const input=name==='StepUpSneakersV3'?transaction.data.slice(66):transaction.data;
      const encoded='0x'+input.slice(factory.bytecode.length);
      const args=Array.from(hre.ethers.AbiCoder.defaultAbiCoder().decode(factory.interface.deploy.inputs,encoded));
      await hre.run('verify:verify',{address,constructorArguments:args});
      console.log(name+': verified');
    } catch(error) {
      if (/already verified/i.test(error.message)) console.log(name+': already verified');
      else { failures++; console.error(name+': '+error.message); }
    }
  }
  if(failures)throw new Error(failures+' contract verification requests failed');
}
main().catch(error=>{console.error(error.message);process.exitCode=1});
