// scripts/testCertificateVerification.js
const { ethers } = require("hardhat");
const crypto = require("crypto");

async function main() {
    const [owner, beneficiary] = await ethers.getSigners();

    // Read test data
    const fs = require("fs");
    const path = require("path");
    const testDataPath = path.join(__dirname, "../test-data.json");
    const testData = JSON.parse(fs.readFileSync(testDataPath, "utf8"));

    console.log("=== Test Certificate Verification ===");
    console.log("Locker address:", testData.lockerAddress);
    console.log("Beneficiary address:", beneficiary.address);

    // Get locker contract
    const WillLocker = await ethers.getContractFactory("WillLocker");
    const locker = WillLocker.attach(testData.lockerAddress);

    // Check if will is expired
    const lastCheckIn = await locker.lastCheckIn();
    const interval = await locker.checkInInterval();
    const grace = await locker.gracePeriod();
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = Number(lastCheckIn) + Number(interval) + Number(grace);

    console.log("\n=== Will Status ===");
    console.log("Current time:", new Date(now * 1000).toLocaleString());
    console.log("Expires at:", new Date(expiresAt * 1000).toLocaleString());
    console.log("Is expired:", now > expiresAt);

    if (now <= expiresAt) {
        const waitTime = expiresAt - now;
        console.log("\n⏳ Will not expired yet. Please wait", waitTime, "seconds");
        console.log("Run this script again after the will expires.");
        return;
    }

    console.log("\n✅ Will is expired! Testing certificate verification...");

    // Generate a test certificate hash
    const testCertificateData = "DEATH CERTIFICATE - John Smith - Deceased on 2024-12-10";
    const certificateHash = "0x" + crypto.createHash("sha256").update(testCertificateData).digest("hex");

    console.log("\n=== Submitting Death Certificate ===");
    console.log("Certificate hash:", certificateHash);

    try {
        // Test auto-verify certificate (simplified flow)
        console.log("\nCalling autoVerifyCertificate...");
        const tx = await locker.connect(beneficiary).autoVerifyCertificate(certificateHash);
        const receipt = await tx.wait();

        console.log("✅ Certificate verified! Transaction hash:", receipt.hash);

        // Check certificate status
        const certHash = await locker.certificateHash();
        const certVerified = await locker.certificateVerified();
        const certSubmittedAt = await locker.certificateSubmittedAt();

        console.log("\n=== Certificate Status ===");
        console.log("Certificate hash:", certHash);
        console.log("Verified:", certVerified);
        console.log("Submitted at:", new Date(Number(certSubmittedAt) * 1000).toLocaleString());

        // Test claim
        console.log("\n=== Testing Claim ===");
        const claimTx = await locker.connect(beneficiary).claim();
        const claimReceipt = await claimTx.wait();

        console.log("✅ Will claimed! Transaction hash:", claimReceipt.hash);

        const claimed = await locker.claimed();
        console.log("Claimed status:", claimed);

        // Test getCID
        console.log("\n=== Testing getCID ===");
        const cid = await locker.getCID();
        console.log("✅ CID retrieved:", cid);

        console.log("\n🎉 All tests passed successfully!");

    } catch (error) {
        console.error("\n❌ Error:", error.message);
        if (error.reason) {
            console.error("Reason:", error.reason);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
