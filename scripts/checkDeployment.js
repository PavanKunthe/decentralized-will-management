const fs = require("fs");
const path = require("path");

async function main() {
    const addressPath = path.join(__dirname, "../frontend/src/contracts/contract-address.json");
    if (!fs.existsSync(addressPath)) {
        console.log("No address file found.");
        return;
    }
    const addressData = JSON.parse(fs.readFileSync(addressPath, "utf8"));
    const address = addressData.WillRegistry;
    console.log("Checking address:", address);

    const code = await ethers.provider.getCode(address);
    console.log("Code length:", code.length);
    if (code === "0x") {
        console.log("No code at address (Not Deployed)");
    } else {
        console.log("Code found at address (Deployed)");
    }
}

main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});
