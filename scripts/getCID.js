import hre from "hardhat";

const lockerAddress = "0xa16E02E87b7454126E5E10d957A927A7F5B5d2be"; // from createWill.js output

async function main() {
  const locker = await hre.ethers.getContractAt("WillLocker", lockerAddress);
  const cid = await locker.getCID();
  console.log("CID:", cid);
}

main();
