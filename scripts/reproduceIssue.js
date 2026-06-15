const hre = require("hardhat");

async function main() {
    const [owner, beneficiary] = await hre.ethers.getSigners();
    console.log("Owner:", owner.address);
    console.log("Beneficiary:", beneficiary.address);

    // 1. Deploy Registry
    const WillRegistry = await hre.ethers.getContractFactory("WillRegistry");
    const registry = await WillRegistry.deploy();
    await registry.waitForDeployment();
    console.log("Registry deployed to:", await registry.getAddress());

    // 2. Create Will
    const tx = await registry.createWill(
        "QmTestCID",
        beneficiary.address,
        5 // 5 seconds interval
    );
    await tx.wait();
    console.log("Will created with 5s interval");

    // Get Locker Address
    const myWills = await registry.getMyWills();
    const lockerAddress = myWills[0];
    console.log("Locker Address:", lockerAddress);

    const WillLocker = await hre.ethers.getContractFactory("WillLocker");
    const locker = WillLocker.attach(lockerAddress);

    // 3. Wait for expiration (simulated)
    console.log("Waiting for 6 seconds...");
    await new Promise(r => setTimeout(r, 6000));

    // Check if expired according to local time
    // Note: Blockchain time won't move until a block is mined!

    // 4. Try to get CID (Should fail if block time hasn't moved)
    console.log("Attempting to get CID (expecting failure due to stale block time)...");
    try {
        await locker.connect(beneficiary).getCID();
        console.log("SUCCESS: Got CID (Unexpected if time is stale)");
    } catch (e) {
        console.log("FAILED: Could not get CID (Expected):", e.message);
    }

    // 5. Claim (Should move time and succeed)
    console.log("Claiming will as beneficiary...");
    try {
        const claimTx = await locker.connect(beneficiary).claim();
        await claimTx.wait();
        console.log("Claim successful");
    } catch (e) {
        console.log("Claim FAILED:", e.message);
        return;
    }

    // 6. Try to get CID again (Should succeed)
    console.log("Attempting to get CID after claim...");
    try {
        const cid = await locker.connect(beneficiary).getCID();
        console.log("SUCCESS: Got CID:", cid);
    } catch (e) {
        console.log("FAILED: Could not get CID:", e.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
