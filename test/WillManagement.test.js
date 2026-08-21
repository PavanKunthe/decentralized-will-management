const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("Will Management", function () {
  const CID = "ipfs://QmTest123";
  const CHECK_IN_INTERVAL = 30 * 24 * 60 * 60; // 30 days
  const GRACE_PERIOD = 7 * 24 * 60 * 60; // 7 days
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

  async function deployRegistryFixture() {
    const [owner, beneficiary, otherAccount] = await ethers.getSigners();
    
    const WillRegistry = await ethers.getContractFactory("WillRegistry");
    const registry = await WillRegistry.deploy();

    return { registry, owner, beneficiary, otherAccount };
  }

  async function deployRegistryAndCreateWillFixture() {
    const { registry, owner, beneficiary, otherAccount } = await loadFixture(deployRegistryFixture);
    
    const tx = await registry.createWill(CID, beneficiary.address, CHECK_IN_INTERVAL, GRACE_PERIOD);
    const receipt = await tx.wait();
    
    const willCreatedEvent = receipt.logs.find(
      (log) => {
        try {
          const parsed = registry.interface.parseLog(log);
          return parsed && parsed.name === "WillCreated";
        } catch (e) {
          return false;
        }
      }
    );
    const parsedEvent = registry.interface.parseLog(willCreatedEvent);
    const lockerAddress = parsedEvent.args.locker;
    
    const locker = await ethers.getContractAt("WillLocker", lockerAddress);

    return { registry, locker, owner, beneficiary, otherAccount };
  }

  describe("WillRegistry", function () {
    it("1. Should deploy successfully", async function () {
      const { registry } = await loadFixture(deployRegistryFixture);
      expect(await registry.getAddress()).to.be.properAddress;
    });

    it("2. Should create a will and emit WillCreated event", async function () {
      const { registry, owner, beneficiary } = await loadFixture(deployRegistryFixture);
      await expect(registry.createWill(CID, beneficiary.address, CHECK_IN_INTERVAL, GRACE_PERIOD))
        .to.emit(registry, "WillCreated");
    });

    it("3. Should store locker in owner's will list (getMyWills)", async function () {
      const { registry, locker, owner } = await loadFixture(deployRegistryAndCreateWillFixture);
      const wills = await registry.getMyWills();
      expect(wills[0]).to.equal(await locker.getAddress());
    });

    it("4. Should store locker in beneficiary's will list (getWillsAsBeneficiary)", async function () {
      const { registry, locker, beneficiary } = await loadFixture(deployRegistryAndCreateWillFixture);
      const wills = await registry.connect(beneficiary).getWillsAsBeneficiary();
      expect(wills[0]).to.equal(await locker.getAddress());
    });

    it("5. Should allow multiple wills per owner", async function () {
      const { registry, owner, beneficiary, otherAccount } = await loadFixture(deployRegistryFixture);
      await registry.createWill("cid1", beneficiary.address, CHECK_IN_INTERVAL, GRACE_PERIOD);
      await registry.createWill("cid2", otherAccount.address, CHECK_IN_INTERVAL, GRACE_PERIOD);
      const wills = await registry.getMyWills();
      expect(wills.length).to.equal(2);
    });

    it("6. Should revert if beneficiary is zero address", async function () {
      const { registry } = await loadFixture(deployRegistryFixture);
      await expect(registry.createWill(CID, ZERO_ADDRESS, CHECK_IN_INTERVAL, GRACE_PERIOD))
        .to.be.revertedWith("Invalid beneficiary");
    });

    it("7. Should revert if checkInInterval is 0", async function () {
      const { registry, beneficiary } = await loadFixture(deployRegistryFixture);
      await expect(registry.createWill(CID, beneficiary.address, 0, GRACE_PERIOD))
        .to.be.revertedWith("Interval must be > 0");
    });
  });

  describe("WillLocker", function () {
    it("8. Should initialize with correct state", async function () {
      const { locker, owner, beneficiary } = await loadFixture(deployRegistryAndCreateWillFixture);
      expect(await locker.owner()).to.equal(owner.address);
      expect(await locker.beneficiary()).to.equal(beneficiary.address);
      expect(await locker.cid()).to.equal(CID);
      expect(await locker.checkInInterval()).to.equal(CHECK_IN_INTERVAL);
      expect(await locker.gracePeriod()).to.equal(GRACE_PERIOD);
      expect(await locker.claimed()).to.equal(false);
    });

    it("9. Owner should be able to check in", async function () {
      const { locker, owner } = await loadFixture(deployRegistryAndCreateWillFixture);
      await expect(locker.checkIn()).to.emit(locker, "CheckedIn");
    });

    it("10. Non-owner should NOT be able to check in", async function () {
      const { locker, otherAccount } = await loadFixture(deployRegistryAndCreateWillFixture);
      await expect(locker.connect(otherAccount).checkIn()).to.be.revertedWith("Only owner can check in");
    });

    it("11. checkUpkeep should return false when owner is active", async function () {
      const { locker } = await loadFixture(deployRegistryAndCreateWillFixture);
      const upkeep = await locker.checkUpkeep("0x");
      expect(upkeep[0]).to.be.false;
    });

    it("12. checkUpkeep should return true after interval + grace period expires", async function () {
      const { locker } = await loadFixture(deployRegistryAndCreateWillFixture);
      await time.increase(CHECK_IN_INTERVAL + GRACE_PERIOD + 1);
      const upkeep = await locker.checkUpkeep("0x");
      expect(upkeep[0]).to.be.true;
    });

    it("13. performUpkeep should emit Unlocked event when expired", async function () {
      const { locker } = await loadFixture(deployRegistryAndCreateWillFixture);
      await time.increase(CHECK_IN_INTERVAL + GRACE_PERIOD + 1);
      await expect(locker.performUpkeep("0x")).to.emit(locker, "Unlocked");
    });

    it("14. Only beneficiary can submit death certificate (after expiry)", async function () {
      const { locker, beneficiary, otherAccount } = await loadFixture(deployRegistryAndCreateWillFixture);
      await time.increase(CHECK_IN_INTERVAL + GRACE_PERIOD + 1);
      const hash = ethers.id("cert1");
      
      await expect(locker.connect(otherAccount).submitDeathCertificate(hash))
        .to.be.revertedWith("Only beneficiary can submit certificate");

      await expect(locker.connect(beneficiary).submitDeathCertificate(hash))
        .to.emit(locker, "DeathCertificateSubmitted");
    });

    it("15. Owner cannot submit death certificate", async function () {
      const { locker, owner } = await loadFixture(deployRegistryAndCreateWillFixture);
      await time.increase(CHECK_IN_INTERVAL + GRACE_PERIOD + 1);
      const hash = ethers.id("cert1");
      await expect(locker.connect(owner).submitDeathCertificate(hash))
        .to.be.revertedWith("Only beneficiary can submit certificate");
    });

    it("16. Cannot submit certificate while owner is active", async function () {
      const { locker, beneficiary } = await loadFixture(deployRegistryAndCreateWillFixture);
      const hash = ethers.id("cert1");
      await expect(locker.connect(beneficiary).submitDeathCertificate(hash))
        .to.be.revertedWith("Owner is still active");
    });

    it("17. Cannot submit zero hash", async function () {
      const { locker, beneficiary } = await loadFixture(deployRegistryAndCreateWillFixture);
      await time.increase(CHECK_IN_INTERVAL + GRACE_PERIOD + 1);
      await expect(locker.connect(beneficiary).submitDeathCertificate(ethers.ZeroHash))
        .to.be.revertedWith("Invalid certificate hash");
    });

    it("18. Cannot submit certificate twice", async function () {
      const { locker, beneficiary } = await loadFixture(deployRegistryAndCreateWillFixture);
      await time.increase(CHECK_IN_INTERVAL + GRACE_PERIOD + 1);
      const hash = ethers.id("cert1");
      await locker.connect(beneficiary).submitDeathCertificate(hash);
      await expect(locker.connect(beneficiary).submitDeathCertificate(hash))
        .to.be.revertedWith("Certificate already submitted");
    });

    it("19. Verifier can verify death certificate", async function () {
      const { locker, owner, beneficiary } = await loadFixture(deployRegistryAndCreateWillFixture);
      await time.increase(CHECK_IN_INTERVAL + GRACE_PERIOD + 1);
      const hash = ethers.id("cert1");
      await locker.connect(beneficiary).submitDeathCertificate(hash);
      
      await expect(locker.connect(owner).verifyDeathCertificate())
        .to.emit(locker, "DeathCertificateVerified");
    });

    it("20. Non-verifier cannot verify", async function () {
      const { locker, beneficiary, otherAccount } = await loadFixture(deployRegistryAndCreateWillFixture);
      await time.increase(CHECK_IN_INTERVAL + GRACE_PERIOD + 1);
      const hash = ethers.id("cert1");
      await locker.connect(beneficiary).submitDeathCertificate(hash);
      
      await expect(locker.connect(otherAccount).verifyDeathCertificate())
        .to.be.revertedWith("Only verifier can verify");
    });

    it("21. autoVerifyCertificate works for beneficiary after expiry", async function () {
      const { locker, beneficiary } = await loadFixture(deployRegistryAndCreateWillFixture);
      await time.increase(CHECK_IN_INTERVAL + GRACE_PERIOD + 1);
      const hash = ethers.id("cert1");
      
      await expect(locker.connect(beneficiary).autoVerifyCertificate(hash))
        .to.emit(locker, "DeathCertificateVerified");
      
      expect(await locker.certificateVerified()).to.be.true;
    });

    it("22. Beneficiary can claim after certificate verification", async function () {
      const { locker, owner, beneficiary } = await loadFixture(deployRegistryAndCreateWillFixture);
      await time.increase(CHECK_IN_INTERVAL + GRACE_PERIOD + 1);
      const hash = ethers.id("cert1");
      await locker.connect(beneficiary).submitDeathCertificate(hash);
      await locker.connect(owner).verifyDeathCertificate();
      
      await locker.connect(beneficiary).claim();
      expect(await locker.claimed()).to.be.true;
    });

    it("23. Cannot claim without verified certificate", async function () {
      const { locker, beneficiary } = await loadFixture(deployRegistryAndCreateWillFixture);
      await time.increase(CHECK_IN_INTERVAL + GRACE_PERIOD + 1);
      const hash = ethers.id("cert1");
      await locker.connect(beneficiary).submitDeathCertificate(hash);
      
      await expect(locker.connect(beneficiary).claim())
        .to.be.revertedWith("Death certificate not verified");
    });

    it("24. Cannot claim twice", async function () {
      const { locker, beneficiary } = await loadFixture(deployRegistryAndCreateWillFixture);
      await time.increase(CHECK_IN_INTERVAL + GRACE_PERIOD + 1);
      const hash = ethers.id("cert1");
      await locker.connect(beneficiary).autoVerifyCertificate(hash);
      
      await locker.connect(beneficiary).claim();
      await expect(locker.connect(beneficiary).claim())
        .to.be.revertedWith("Already claimed");
    });

    it("25. getCID returns CID after verification and expiry", async function () {
      const { locker, beneficiary } = await loadFixture(deployRegistryAndCreateWillFixture);
      await time.increase(CHECK_IN_INTERVAL + GRACE_PERIOD + 1);
      const hash = ethers.id("cert1");
      await locker.connect(beneficiary).autoVerifyCertificate(hash);
      
      expect(await locker.getCID()).to.equal(CID);
    });

    it("26. getCID reverts when locked (owner active)", async function () {
      const { locker } = await loadFixture(deployRegistryAndCreateWillFixture);
      await expect(locker.getCID()).to.be.revertedWith("CID locked");
    });

    it("27. getCID reverts when certificate not verified", async function () {
      const { locker } = await loadFixture(deployRegistryAndCreateWillFixture);
      await time.increase(CHECK_IN_INTERVAL + GRACE_PERIOD + 1);
      await expect(locker.getCID()).to.be.revertedWith("Death certificate not verified");
    });
  });
});
