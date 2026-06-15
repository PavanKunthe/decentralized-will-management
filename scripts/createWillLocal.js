const hre = require("hardhat");

async function main() {
  const registryAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

  const registry = await hre.ethers.getContractAt("WillRegistry", registryAddress);

  const [owner, beneficiary] = await hre.ethers.getSigners();

  const cid = "QmFakeCID123456";
  const unlockTime = Math.floor(Date.now() / 1000) + 60; // 60 sec lock

  const tx = await registry.createWill(cid, beneficiary.address, unlockTime);
  await tx.wait();

  console.log("✔ Will created by:", owner.address);

  const locker = await registry.getLocker(owner.address);
  console.log("✔ WillLocker deployed at:", locker);
}

main().catch(console.error);
