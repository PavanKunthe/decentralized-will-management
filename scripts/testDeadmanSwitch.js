// scripts/testDeadmanSwitch.js
const { ethers } = require("hardhat");

async function main() {
    const [owner, beneficiary] = await ethers.getSigners();

    console.log("Owner address:", owner.address);
    console.log("Beneficiary address:", beneficiary.address);

    // Get the deployed WillRegistry
    const registryAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const WillRegistry = await ethers.getContractFactory("WillRegistry");
    const registry = WillRegistry.attach(registryAddress);

    console.log("\n=== Creating Will with Deadman Switch ===");

    // Create a will with short intervals for testing
    const checkInInterval = 60; // 60 seconds
    const gracePeriod = 30; // 30 seconds
    const cid = "QmTestCID123"; // Dummy CID for testing

    const tx = await registry.connect(owner).createWill(
        cid,
        beneficiary.address,
        checkInInterval,
        gracePeriod
    );

    const receipt = await tx.wait();
    console.log("Will created! Transaction hash:", receipt.hash);

    // Get the locker address from the event
    const event = receipt.logs.find(log => {
        try {
            return registry.interface.parseLog(log).name === "WillCreated";
        } catch {
            return false;
        }
    });

    const parsedEvent = registry.interface.parseLog(event);
    const lockerAddress = parsedEvent.args.locker;

    console.log("Locker address:", lockerAddress);

    // Get locker contract
    const WillLocker = await ethers.getContractFactory("WillLocker");
    const locker = WillLocker.attach(lockerAddress);

    // Check initial state
    const lastCheckIn = await locker.lastCheckIn();
    const interval = await locker.checkInInterval();
    const grace = await locker.gracePeriod();
    const certVerified = await locker.certificateVerified();

    console.log("\n=== Locker State ===");
    console.log("Last check-in:", new Date(Number(lastCheckIn) * 1000).toLocaleString());
    console.log("Check-in interval:", interval.toString(), "seconds");
    console.log("Grace period:", grace.toString(), "seconds");
    console.log("Certificate verified:", certVerified);
    console.log("Will expires at:", new Date((Number(lastCheckIn) + Number(interval) + Number(grace)) * 1000).toLocaleString());

    console.log("\n=== Test Instructions ===");
    console.log("1. Wait for", (Number(interval) + Number(grace)), "seconds for the will to expire");
    console.log("2. Or use the frontend to test the flow");
    console.log("3. Beneficiary address:", beneficiary.address);
    console.log("4. Locker address:", lockerAddress);

    // Save addresses for frontend testing
    const fs = require("fs");
    const path = require("path");
    const testDataPath = path.join(__dirname, "../test-data.json");

    fs.writeFileSync(testDataPath, JSON.stringify({
        owner: owner.address,
        beneficiary: beneficiary.address,
        lockerAddress: lockerAddress,
        registryAddress: registryAddress,
        checkInInterval: checkInInterval,
        gracePeriod: gracePeriod,
        expiresAt: Number(lastCheckIn) + Number(interval) + Number(grace)
    }, null, 2));

    console.log("\nTest data saved to:", testDataPath);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
