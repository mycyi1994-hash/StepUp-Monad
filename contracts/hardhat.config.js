require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
const { subtask } = require("hardhat/config");
const { TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD } = require("hardhat/builtin-tasks/task-names");

// Hardhat은 기본적으로 binaries.soliditylang.org에서 solc를 내려받는다.
// 사내망·CI처럼 그 호스트로 나갈 수 없는 환경에서는 npm으로 설치한
// solc(soljson wasm)로 대체한다. 같은 버전이면 바이트코드도 동일하므로
// 익스플로러 소스 검증에 영향이 없다.
subtask(TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD, async (args, _hre, runSuper) => {
  try {
    return await runSuper();
  } catch (downloadError) {
    let solcjsPath;
    try {
      solcjsPath = require.resolve("solc/soljson.js");
    } catch {
      throw downloadError;
    }
    // eslint-disable-next-line import/no-extraneous-dependencies
    const longVersion = require("solc").version();
    console.warn(`solc 다운로드 실패 → 로컬 solcjs 사용 (${longVersion})`);
    return {
      compilerPath: solcjsPath,
      isSolcJs: true,
      version: args.solcVersion,
      longVersion,
    };
  }
});

// 배포 키는 .env 에만 둡니다. 저장소에 커밋하지 마세요(.gitignore 처리됨).
const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const accounts = DEPLOYER_KEY ? [DEPLOYER_KEY] : [];

// Monad is an independent EVM-compatible L1. This build targets its testnet.
const MONAD_TESTNET_RPC = process.env.MONAD_TESTNET_RPC || "https://testnet-rpc.monad.xyz";
const MONAD_TESTNET_CHAIN_ID = 10143;
const MONAD_TESTNET_EXPLORER = "https://testnet.monadscan.com";

// Mainnet is defined for tooling only; all committed deployments use testnet.
const MONAD_MAINNET_RPC = process.env.MONAD_MAINNET_RPC || 'https://rpc.monad.xyz';
const MONAD_MAINNET_CHAIN_ID = 143;
const MONAD_MAINNET_EXPLORER = process.env.MONAD_MAINNET_EXPLORER || "https://monadscan.com";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.29",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      // Cancun bytecode is supported by the target Monad deployment.
      evmVersion: "cancun",
    },
  },

  networks: {
    hardhat: {
      chainId: 31337,
    },
    monadTestnet: {
      url: MONAD_TESTNET_RPC,
      chainId: MONAD_TESTNET_CHAIN_ID,
      accounts,
    },
    monad: {
      url: MONAD_MAINNET_RPC,
      chainId: MONAD_MAINNET_CHAIN_ID,
      accounts,
    },
  },

  // Monadscan uses Etherscan API V2 and requires an Etherscan API key.
  etherscan: {
    apiKey: {
      monadTestnet: process.env.MONAD_EXPLORER_API_KEY || "",
      monad: process.env.MONAD_EXPLORER_API_KEY || "",
    },
    customChains: [
      {
        network: "monadTestnet",
        chainId: MONAD_TESTNET_CHAIN_ID,
        urls: {
          apiURL: "https://api.etherscan.io/v2/api?chainid=10143",
          browserURL: MONAD_TESTNET_EXPLORER,
        },
      },
      {
        network: "monad",
        chainId: MONAD_MAINNET_CHAIN_ID,
        urls: {
          apiURL: "https://api.etherscan.io/v2/api?chainid=143",
          browserURL: MONAD_MAINNET_EXPLORER,
        },
      },
    ],
  },

  // Explorer verification is an explicit step, separate from deployment.
  sourcify: {
    enabled: false,
  },

  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
  },
};
