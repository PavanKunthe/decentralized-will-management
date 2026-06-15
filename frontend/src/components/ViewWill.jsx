import { useState, useEffect } from "react";
import { decryptFile } from "../utils/crypto";
import registryABI from "../contracts/WillRegistry.json";
import lockerABI from "../contracts/WillLocker.json";
import { ethers } from "ethers";
import DeathCertificateUpload from "./DeathCertificateUpload";

import addressData from "../contracts/contract-address.json";
const registryAddress = addressData.WillRegistry; // local WillRegistry

export default function ViewWill({ currentAccount }) {
  const [lockerAddress, setLockerAddress] = useState("");
  const [cid, setCid] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [timeLeft, setTimeLeft] = useState(null);
  const [deadline, setDeadline] = useState(null);
  const [beneficiary, setBeneficiary] = useState("");
  const [owner, setOwner] = useState("");
  const [isClaimed, setIsClaimed] = useState(false);
  const [certificateVerified, setCertificateVerified] = useState(false);
  const [lockerContract, setLockerContract] = useState(null);

  // Reset state when account changes
  useEffect(() => {
    setLockerAddress("");
    setCid("");
    setPdfUrl("");
    setTimeLeft(null);
    setDeadline(null);
    setBeneficiary("");
    setOwner("");
    setIsClaimed(false);
    setCertificateVerified(false);
    setLockerContract(null);
  }, [currentAccount]);

  // 1) Get Locker Address
  async function getLocker() {
    try {
      if (!currentAccount) return alert("Please connect wallet first");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner(currentAccount);

      const contract = new ethers.Contract(
        registryAddress,
        registryABI.abi,
        signer
      );

      // MULTI-WILL MODE: fetch all wills for this user
      // Fetch wills created by me
      const myWills = await contract.getMyWills();
      // Fetch wills where I am beneficiary
      const beneficiaryWills = await contract.getWillsAsBeneficiary();

      // Combine and deduplicate
      const allWills = [...new Set([...myWills, ...beneficiaryWills])];

      if (allWills.length === 0) {
        alert("No will found for this account (neither as owner nor beneficiary).");
        return;
      }

      // get the last created will locker
      const latestLocker = allWills[allWills.length - 1];

      setLockerAddress(latestLocker);
      await fetchTimerData(latestLocker, signer);
    } catch (err) {
      console.error("Error in getLocker:", err);
      // Only alert if it's a real error, not just "no will found" which is handled above
      if (err.message && !err.message.includes("No will found")) {
        alert("Error fetching locker: " + (err.reason || err.message));
      }
    }
  }


  async function fetchTimerData(address, signer) {
    try {
      const locker = new ethers.Contract(address, lockerABI.abi, signer);
      setLockerContract(locker);

      const lastCheckIn = await locker.lastCheckIn();
      const interval = await locker.checkInInterval();

      // Try to fetch gracePeriod, default to 0 if not present (backward compatibility or old ABI)
      let grace = 0;
      try {
        grace = await locker.gracePeriod();
      } catch (e) {
        console.warn("gracePeriod() not found on contract", e);
      }

      const ben = await locker.beneficiary();
      const own = await locker.owner();

      let claimedStatus = false;
      try {
        const result = await locker.claimed();
        // Handle potential Ethers Result object or direct value
        claimedStatus = (typeof result === 'object' && '0' in result) ? result[0] : result;
      } catch (e) {
        console.warn("claimed() not found or failed", e);
      }

      // Check certificate verification status
      let certVerified = false;
      try {
        certVerified = await locker.certificateVerified();
      } catch (e) {
        console.warn("certificateVerified() not found", e);
      }

      setBeneficiary(String(ben));
      setOwner(String(own));
      setIsClaimed(!!claimedStatus);
      setCertificateVerified(!!certVerified);
      console.log("Timer Data:", { ben, own, claimedStatus, certVerified, lastCheckIn, interval, grace });

      const warningTime = Number(lastCheckIn) + Number(interval);
      const releaseTime = warningTime + Number(grace);

      setDeadline({ warningTime, releaseTime });
    } catch (err) {
      console.error("Error fetching timer data:", err);
    }
  }

  useEffect(() => {
    if (!deadline) return;
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);

      // Check if we are past release time
      if (now >= deadline.releaseTime) {
        setTimeLeft("Expired (Unlockable)");
        return;
      }

      // Check if we are in grace period (Warning Phase)
      if (now >= deadline.warningTime) {
        const diff = deadline.releaseTime - now;
        const h = Math.floor(diff / 3600);
        const m = Math.floor((diff % 3600) / 60);
        const s = diff % 60;
        setTimeLeft(`WARNING: RELEASE IN ${h}h ${m}m ${s}s`);
        return;
      }

      // Normal Phase
      const diff = deadline.warningTime - now;
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setTimeLeft(`${h}h ${m}m ${s}s`);

    }, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  // 2) Get CID from WillLocker
  async function loadCID() {
    try {
      if (!lockerAddress) return alert("Get locker first.");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner(currentAccount);

      const locker = new ethers.Contract(lockerAddress, lockerABI.abi, signer);
      const storedCid = await locker.getCID();

      setCid(storedCid);
    } catch (err) {
      console.error(err);
      if (err.reason === "CID locked" || err.message.includes("CID locked")) {
        alert("The will is currently locked.\n\nIt is only accessible to the beneficiary if the owner fails to check in before the timer expires.");
      } else {
        alert(`Error loading CID: ${err.reason || err.message || err}. \n\nIf the will is expired, please ensure you have clicked 'Claim Will' to unlock it on the blockchain.`);
      }
    }
  }

  // 3) Fetch encrypted file from Pinata + decrypt
  async function viewWill() {
    try {
      if (!cid) return alert("Load CID first.");

      const password = prompt("Enter decryption password:");
      if (!password) return;

      // Fetch encrypted file from Pinata
      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);
      const encryptedBlob = await response.blob();

      // Decrypt it
      const pdfBlob = await decryptFile(encryptedBlob, password);

      // Display PDF
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);

      alert("Decryption successful!");
    } catch (err) {
      console.error(err);
      alert("Failed to decrypt PDF. Wrong password?");
    }
  }

  // 4) Download PDF (after decryption)
  function downloadPDF() {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = "will.pdf";
    a.click();
  }

  // 5) Check In (I'm Alive)
  async function checkIn() {
    if (!lockerAddress) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner(currentAccount);
      const locker = new ethers.Contract(lockerAddress, lockerABI.abi, signer);

      const tx = await locker.checkIn();
      await tx.wait();
      alert("Checked in successfully! Timer reset.");

      // Refresh timer
      fetchTimerData(lockerAddress, signer);
    } catch (err) {
      console.error(err);
      alert("Check-in failed: " + (err.reason || err.message));
    }
  }


  // 6) Claim Will (Beneficiary)
  async function claimWill() {
    if (!lockerAddress) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner(currentAccount);
      const locker = new ethers.Contract(lockerAddress, lockerABI.abi, signer);

      const tx = await locker.claim();
      await tx.wait();
      alert("Will claimed! You can now load the CID.");
      setIsClaimed(true);

      // Refresh timer/data
      fetchTimerData(lockerAddress, signer);
    } catch (err) {
      console.error(err);
      alert("Claim failed: " + (err.reason || err.message));
    }
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg w-full max-w-xl mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">View My Will</h1>

      {/* Step 1 */}
      <button
        onClick={getLocker}
        className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 mb-3"
      >
        Get My Locker
      </button>

      {lockerAddress && (
        <p className="text-gray-800 mb-3">
          Locker Address: <span className="font-mono">{lockerAddress}</span>
        </p>
      )}

      {/* Step 2 */}
      {lockerAddress && (
        <button
          onClick={loadCID}
          className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600 mb-3"
        >
          Load CID
        </button>
      )}

      {cid && (
        <p className="text-gray-800 mb-3">
          CID: <span className="font-mono break-all">{cid}</span>
        </p>
      )}


      {/* Step 3 */}
      {cid && (
        <button
          onClick={viewWill}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 mb-3"
        >
          Decrypt & View Will
        </button>
      )}

      {/* Dead Man's Switch Controls */}
      {lockerAddress && (
        <div className="mt-6 p-4 bg-gray-50 rounded border">
          <h3 className="font-bold mb-2">Dead Man's Switch</h3>

          {/* Only show "I'm Alive" to the Owner */}
          {currentAccount && owner && String(currentAccount).toLowerCase() === String(owner).toLowerCase() && (
            <button
              onClick={checkIn}
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 mb-2"
            >
              I'm Alive (Reset Timer)
            </button>
          )}

          <p className="text-xs text-gray-500 text-center">
            Clicking this resets the countdown. If you fail to click, the will unlocks.
          </p>
          {timeLeft && (
            <div className="mt-3 text-center">
              <p className="text-sm font-semibold text-gray-700">Time Remaining:</p>
              <p className="text-xl font-mono text-red-600">{timeLeft}</p>
              {timeLeft === "Expired (Unlockable)" && beneficiary && (
                <div className="text-sm text-gray-600 mt-2">
                  {currentAccount && beneficiary && String(currentAccount).toLowerCase() === String(beneficiary).toLowerCase() ? (
                    <>
                      <p className="mb-2">Released from: <span className="font-mono font-bold">{owner}</span></p>

                      {/* Show certificate upload if not verified */}
                      {!certificateVerified && !isClaimed && (
                        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-300 rounded">
                          <p className="text-yellow-800 font-semibold mb-1">⚠️ Death Certificate Required</p>
                          <p className="text-xs text-yellow-700">You must upload and verify a death certificate before claiming the will.</p>
                        </div>
                      )}

                      {/* Show claim button only if certificate is verified */}
                      {certificateVerified && !isClaimed && (
                        <button
                          onClick={claimWill}
                          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-bold w-full"
                        >
                          Claim Will (Unlock on Blockchain)
                        </button>
                      )}

                      {isClaimed && <p className="text-green-600 font-bold">✅ You have claimed this will.</p>}
                    </>
                  ) : (
                    <>
                      Released to: <span className="font-mono font-bold">{beneficiary}</span>
                      {isClaimed && currentAccount && owner && String(currentAccount).toLowerCase() === String(owner).toLowerCase() && (
                        <div className="mt-2 text-red-600 font-bold border-t pt-2">
                          Will claimed by: <span className="font-mono text-black font-normal">{beneficiary}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Death Certificate Upload Section */}
      {lockerAddress &&
        timeLeft === "Expired (Unlockable)" &&
        currentAccount &&
        beneficiary &&
        String(currentAccount).toLowerCase() === String(beneficiary).toLowerCase() &&
        !certificateVerified &&
        !isClaimed &&
        lockerContract && (
          <DeathCertificateUpload
            lockerAddress={lockerAddress}
            lockerContract={lockerContract}
            onCertificateVerified={() => {
              // Refresh data after certificate verification
              const provider = new ethers.BrowserProvider(window.ethereum);
              provider.getSigner(currentAccount).then(signer => {
                fetchTimerData(lockerAddress, signer);
              });
            }}
          />
        )}

      {/* Step 4 — PDF viewer */}
      {pdfUrl && (
        <>
          <iframe
            src={pdfUrl}
            className="w-full h-[500px] border mt-4 rounded"
          ></iframe>

          <button
            onClick={downloadPDF}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 mt-4"
          >
            Download PDF
          </button>
        </>
      )}

      {/* Debug Panel */}
      <div className="mt-8 p-4 bg-gray-100 rounded text-xs font-mono break-all">
        <h4 className="font-bold mb-2">Debug Info</h4>
        <p>Locker: {lockerAddress}</p>
        <p>Current Account: {currentAccount}</p>
        <p>Beneficiary: {beneficiary}</p>
        <p>Owner: {owner}</p>
        <p>Is Claimed: {String(isClaimed)}</p>
        <p>Certificate Verified: {String(certificateVerified)}</p>
        <p>Time Left: {timeLeft}</p>
        <p>Match: {String(currentAccount && beneficiary && String(currentAccount).toLowerCase() === String(beneficiary).toLowerCase())}</p>
      </div>
    </div>
  );
}
