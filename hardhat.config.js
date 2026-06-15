require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      timeout: 200000,
      // Persistent Hardhat Network
      chainId: 31337,
      saveDeployments: true,
      persistent: true
    },
    hardhat: {
      chainId: 31337,
      // This creates a PERSISTENT DB
      storage: "./persistent-node"
    }
  }
};
