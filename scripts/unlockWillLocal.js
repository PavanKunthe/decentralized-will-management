const hre = require("hardhat");

async function main() {
  const lockerAddress = "0x75537828f2ce51be7289709686A69CbFDbB714F1";

  const locker = await hre.ethers.getContractAt("WillLocker", lockerAddress);

  console.log("⏳ CID before unlock:");
  try {
    await locker.getCID();
  } catch (e) {
    console.log("❌ Locked:", e.reason);
  }

  console.log("⏩ Fast-forwarding 61 seconds...");
  await network.provider.send("evm_increaseTime", [61]);
  await network.provider.send("evm_mine");

  console.log("🔓 CID after unlock:");
  const cid = await locker.getCID();
  console.log("✔ CID:", cid);
}

main().catch(console.error);
