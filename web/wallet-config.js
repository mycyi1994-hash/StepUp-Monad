// 지갑 페이지 공개 설정. 컨트랙트 v2 와 어테스터 워커를 배포한 뒤 주소를 채운다
// (contracts/deployments/monadTestnet-v2.json). 비어 있으면 페이지는 "준비 중"만 보여준다.
// supabaseKey 는 앱에도 들어 있는 공개(publishable) 키다. 비밀 키는 절대 넣지 않는다.
window.STEPUP_WALLET_CONFIG = Object.freeze({
  chainId: 10143,
  rpcUrl: 'https://testnet-rpc.monad.xyz',
  explorer: 'https://testnet.monadscan.com',
  supabaseUrl: 'https://rltvflvnqvknsuayvrnt.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsdHZmbHZucXZrbnN1YXl2cm50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2OTA5MDksImV4cCI6MjEwNzI2NjkwOX0.hds1NxdZ2i7etR9y_z66AIqe09bWhTfsSmLNsFMpNWw',
  attesterUrl: 'https://stepup-monad-attester.gana003.workers.dev',
  sup: '0x9a82Fbf7de1cAF6bC07575BD555373BC2eF2578B',
  sneakers: '0x7CcD058dF1C65b96195E54AC88c8887A0096eE9B',
  vault: '0xdDB78B6B26caD6db34868d7f76522359885d5128',
  startBlock: 70021928,
  // v3 — 앱에서 뽑은 신발을 금고로 발행하는 컨트랙트(contracts/deployments/monadTestnet-v3.json).
  // 금고의 신발을 지갑으로 꺼내면 이 컨트랙트의 번호(1000001~)로 온다.
  sneakersV3: '0x5DF140781d54Ec75d7Ca947f5D193d02A243aeA6',
  v3StartBlock: 70021960,
})
