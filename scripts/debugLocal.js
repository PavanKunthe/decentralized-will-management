const hre = require("hardhat");

async function main() {
    const [signer] = await hre.ethers.getSigners();

    const fs = require("fs");
    const path = require("path");
    const addressPath = path.join(__dirname, "../frontend/src/contracts/contract-address.json");
    const addressData = JSON.parse(fs.readFileSync(addressPath, "utf8"));
    const registryAddress = addressData.WillRegistry;

    const Registry = await hre.ethers.getContractFactory("WillRegistry");
    const registry = Registry.attach(registryAddress);

    // Query events to find any wills
    const filter = registry.filters.WillCreated();
    const events = await registry.queryFilter(filter);
    console.log("Found", events.length, "WillCreated events");

    if (events.length === 0) {
        console.log("No wills found on the registry.");
        return;
    }

    // Check the last created will
    const lastEvent = events[events.length - 1];
    const latestLockerAddress = lastEvent.args.locker;
    const owner = lastEvent.args.owner;
    console.log("Latest Locker:", latestLockerAddress);
    console.log("Owner:", owner);

    const Locker = await hre.ethers.getContractFactory("WillLocker");
    const locker = Locker.attach(latestLockerAddress);

    const lastCheckIn = await locker.lastCheckIn();
    const interval = await locker.checkInInterval();
    const unlockTime = Number(lastCheckIn) + Number(interval);

    const latestBlock = await hre.ethers.provider.getBlock("latest");
    const currentTimestamp = latestBlock.timestamp;

    console.log("Current Block Timestamp:", currentTimestamp);
    console.log("Last Check-In:          ", lastCheckIn.toString());
    console.log("Interval:               ", interval.toString());
    console.log("Unlock Time (Calc):     ", unlockTime);
    console.log("Seconds remaining:      ", unlockTime - currentTimestamp);

    if (currentTimestamp < unlockTime) {
        console.log("Status: LOCKED");
        console.log("Attempting to fast-forward time...");
        // Increase time by 60 seconds (or enough to pass the interval)
        const timeToJump = (unlockTime - currentTimestamp) + 10;
        await hre.network.provider.send("evm_increaseTime", [timeToJump]);
        await hre.network.provider.send("evm_mine");

        const newBlock = await hre.ethers.provider.getBlock("latest");
        console.log("New Block Timestamp:    ", newBlock.timestamp);
        if (newBlock.timestamp >= unlockTime) {
            console.log("Status: NOW UNLOCKED");
        }
    } else {
        console.log("Status: UNLOCKED");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
