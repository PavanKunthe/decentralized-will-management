// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract WillLocker {
    // AutomationCompatibleInterface
    // We define the interface here to avoid importing the whole library if not strictly needed, 
    // but best practice is to import from @chainlink/contracts if installed.
    // For simplicity/speed in this local setup, we'll implement the logic directly.

    address public owner;
    address public beneficiary;
    string public cid;
    
    uint256 public gracePeriod;
    uint256 public lastCheckIn;
    uint256 public checkInInterval;
    bool public claimed;
    
    // Death certificate verification
    bytes32 public certificateHash;
    bool public certificateVerified;
    uint256 public certificateSubmittedAt;
    address public certificateVerifier; // Optional: for manual verification

    event CheckedIn(uint256 timestamp);
    event Unlocked(uint256 timestamp);
    event DeathCertificateSubmitted(address indexed beneficiary, bytes32 certificateHash, uint256 timestamp);
    event DeathCertificateVerified(address indexed verifier, uint256 timestamp);

    constructor(
        address _owner,
        string memory _cid,
        address _beneficiary,
        uint256 _checkInInterval,
        uint256 _gracePeriod
    ) {
        require(_owner != address(0), "Invalid owner");
        require(_beneficiary != address(0), "Invalid beneficiary");
        require(_checkInInterval > 0, "Interval must be > 0");

        owner = _owner;
        cid = _cid;
        beneficiary = _beneficiary;
        checkInInterval = _checkInInterval;
        gracePeriod = _gracePeriod;
        lastCheckIn = block.timestamp;
        certificateVerifier = _owner; // Owner can verify, or set to a trusted third party
    }

    // Owner calls this to reset the timer ("I'm Alive")
    function checkIn() external {
        require(msg.sender == owner, "Only owner can check in");
        require(!claimed, "Already claimed");
        lastCheckIn = block.timestamp;
        emit CheckedIn(lastCheckIn);
    }

    // Chainlink Automation: Check if upkeep is needed
    // Returns true if (now - lastCheckIn) > checkInInterval + gracePeriod
    function checkUpkeep(bytes calldata /* checkData */) 
        external 
        view 
        returns (bool upkeepNeeded, bytes memory /* performData */) 
    {
        upkeepNeeded = (block.timestamp - lastCheckIn) > (checkInInterval + gracePeriod) && !claimed;
    }

    // Chainlink Automation: Perform the upkeep (unlock)
    function performUpkeep(bytes calldata /* performData */) external {
        // Revalidate condition
        if ((block.timestamp - lastCheckIn) > (checkInInterval + gracePeriod) && !claimed) {
            // We don't strictly set a "claimed" flag here to stop the logic, 
            // but effectively the will is now "unlocked" for the beneficiary.
            // In this design, "claimed" tracks if beneficiary took it? 
            // Actually, let's just emit an event. The beneficiary can claim anytime after this.
            // For the sake of the 'claimed' variable in the original contract:
            // The original contract used 'claimed' to prevent double claiming.
            // We'll keep that logic in 'claim()'.
            
            // We can emit an event here to signal it's ready.
            emit Unlocked(block.timestamp);
        }
    }

    // Beneficiary submits death certificate hash
    function submitDeathCertificate(bytes32 _certificateHash) external {
        require(msg.sender == beneficiary, "Only beneficiary can submit certificate");
        require((block.timestamp - lastCheckIn) > (checkInInterval + gracePeriod), "Owner is still active");
        require(!claimed, "Already claimed");
        require(certificateHash == bytes32(0), "Certificate already submitted");
        require(_certificateHash != bytes32(0), "Invalid certificate hash");
        
        certificateHash = _certificateHash;
        certificateSubmittedAt = block.timestamp;
        
        emit DeathCertificateSubmitted(msg.sender, _certificateHash, block.timestamp);
    }
    
    // Verifier approves the death certificate
    function verifyDeathCertificate() external {
        require(msg.sender == certificateVerifier, "Only verifier can verify");
        require(certificateHash != bytes32(0), "No certificate submitted");
        require(!certificateVerified, "Already verified");
        
        certificateVerified = true;
        
        emit DeathCertificateVerified(msg.sender, block.timestamp);
    }
    
    // Auto-verify function (for testing or if using automated verification)
    function autoVerifyCertificate(bytes32 _certificateHash) external {
        require(msg.sender == beneficiary, "Only beneficiary");
        require((block.timestamp - lastCheckIn) > (checkInInterval + gracePeriod), "Owner is still active");
        require(!claimed, "Already claimed");
        
        certificateHash = _certificateHash;
        certificateSubmittedAt = block.timestamp;
        certificateVerified = true; // Auto-verify for simplified flow
        
        emit DeathCertificateSubmitted(msg.sender, _certificateHash, block.timestamp);
        emit DeathCertificateVerified(msg.sender, block.timestamp);
    }

    function claim() external {
        require(msg.sender == beneficiary, "Not beneficiary");
        require((block.timestamp - lastCheckIn) > (checkInInterval + gracePeriod), "Owner is still active");
        require(!claimed, "Already claimed");
        require(certificateVerified, "Death certificate not verified");
        claimed = true;
    }

    function getCID() external view returns (string memory) {
        require((block.timestamp - lastCheckIn) > (checkInInterval + gracePeriod), "CID locked");
        require(certificateVerified, "Death certificate not verified");
        return cid;
    }
}
