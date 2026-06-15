import { useState } from "react";
import { encryptFile } from "../utils/crypto";
import registryABI from "../contracts/WillRegistry.json";
import { ethers } from "ethers";

import addressData from "../contracts/contract-address.json";
const REGISTRY_ADDRESS = addressData.WillRegistry;
const BACKEND_UPLOAD_URL = "http://localhost:5000/upload-encrypted";

export default function CreateWill({ currentAccount }) {
  const [file, setFile] = useState(null);
  const [beneficiary, setBeneficiary] = useState("");
  const [cid, setCid] = useState("");
  const [status, setStatus] = useState("");

  async function encryptAndUpload() {
    if (!file) return alert("Select PDF first");

    const password = prompt("Enter password:");
    if (!password) return;

    setStatus("Encrypting...");
    const encrypted = await encryptFile(file, password);

    setStatus("Uploading encrypted file to backend...");
    const form = new FormData();
    form.append("file", new File([encrypted], file.name + ".enc"));

    const res = await fetch(BACKEND_UPLOAD_URL, {
      method: "POST",
      body: form,
    });

    const data = await res.json();
    if (!res.ok) return alert("Upload failed: " + data.error);

    setCid(data.cid);
    alert("Upload OK! CID: " + data.cid);
    setStatus("Uploaded: " + data.cid);
  }

  const [interval, setInterval] = useState(60); // default 60 seconds for testing
  const [gracePeriod, setGracePeriod] = useState(60); // default 60 seconds for testing

  async function createWillOnChain() {
    if (!cid) return alert("No CID yet");
    if (!beneficiary) return alert("Enter beneficiary address");

    if (!currentAccount) return alert("Please connect wallet first");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner(currentAccount);
    const contract = new ethers.Contract(REGISTRY_ADDRESS, registryABI.abi, signer);

    setStatus("Sending tx...");
    try {
      // Pass the interval and gracePeriod
      const tx = await contract.createWill(cid, beneficiary, interval, gracePeriod);
      await tx.wait();

      alert("Will created!");
      setStatus("Will created on chain");
    } catch (error) {
      console.error("Error creating will:", error);
      alert("Error creating will: " + (error.reason || error.message));
      setStatus("Error: " + (error.reason || error.message));
    }
  }

  return (
    <div className="p-6 bg-white rounded-xl max-w-xl mx-auto mt-10">
      <h2 className="text-xl font-bold mb-4">Create Will (Dead Man's Switch)</h2>

      <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files[0])} className="mb-3" />

      <button onClick={encryptAndUpload} className="bg-blue-600 text-white py-2 px-4 rounded mb-3 w-full">
        Encrypt & Upload
      </button>

      <input type="text" placeholder="CID" value={cid} readOnly className="border p-2 rounded w-full mb-3" />

      <input type="text" placeholder="Beneficiary Address" value={beneficiary} onChange={(e) => setBeneficiary(e.target.value)} className="border p-2 rounded w-full mb-3" />

      <label className="block mb-2 text-sm font-medium text-gray-900">Check-In Interval</label>
      <select
        value={interval}
        onChange={(e) => setInterval(Number(e.target.value))}
        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 mb-4"
      >
        <option value={60}>60 Seconds (Testing)</option>
        <option value={300}>5 Minutes</option>
        <option value={86400}>1 Day</option>
        <option value={2592000}>30 Days</option>
        <option value={31536000}>1 Year</option>
      </select>

      <label className="block mb-2 text-sm font-medium text-gray-900">Grace Period (Time to confirm alive after timer ends)</label>
      <select
        value={gracePeriod}
        onChange={(e) => setGracePeriod(Number(e.target.value))}
        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 mb-4"
      >
        <option value={60}>60 Seconds (Testing)</option>
        <option value={300}>5 Minutes</option>
        <option value={3600}>1 Hour</option>
        <option value={86400}>1 Day</option>
      </select>

      <button onClick={createWillOnChain} className="bg-green-600 text-white py-2 px-4 rounded w-full">
        Create Will
      </button>

      <p className="mt-3 text-gray-700">{status}</p>
    </div>
  );
}
