// scripts/deployLocal.js

async function main() {
  const Registry = await ethers.getContractFactory("WillRegistry");
  const registry = await Registry.deploy();

  await registry.waitForDeployment();
  const address = await registry.getAddress();
  console.log("WillRegistry deployed to:", address);

  const fs = require("fs");
  const path = require("path");
  const addressPath = path.join(__dirname, "../frontend/src/contracts/contract-address.json");

  // Use async writeFile to avoid potential libuv issues
  await new Promise((resolve, reject) => {
    fs.writeFile(addressPath, JSON.stringify({ WillRegistry: address }, null, 2), (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  console.log("Address saved to:", addressPath);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
