const hre = require("hardhat");

async function main() {
  const lockerAddress = "0x75537828f2ce51be7289709686A69CbFDbB714F1";

  const locker = await hre.ethers.getContractAt("WillLocker", lockerAddress);

  const [owner, beneficiary] = await hre.ethers.getSigners();

  console.log("Beneficiary:", beneficiary.address);

  console.log("⏳ Trying to claim...");
  const tx = await locker.connect(beneficiary).claim();
  await tx.wait();

  console.log("✔ Successfully claimed!");
  console.log("Claim status:", await locker.claimed());
}

main().catch(console.error);
