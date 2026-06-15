// src/components/ConnectWallet.jsx
import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { ethers } from "ethers";

export default function ConnectWallet({ onConnect }) {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", () => window.location.reload());
      // Check if already connected
      window.ethereum.request({ method: "eth_accounts" }).then(handleAccountsChanged);
      return () => {
        window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      };
    }
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      updateBalance(selectedAccount);
      onConnect && onConnect(selectedAccount);
    } else {
      setBalance(null);
      onConnect && onConnect(null);
    }
  }, [selectedAccount]);

  async function handleAccountsChanged(accs) {
    if (accs && accs.length > 0) {
      const formattedAccounts = accs.map(a => ethers.getAddress(a));
      setAccounts(formattedAccounts);

      // If currently selected account is still in the list, keep it. Otherwise default to first.
      setSelectedAccount(prev => {
        if (prev && formattedAccounts.includes(prev)) return prev;
        return formattedAccounts[0];
      });
    } else {
      setAccounts([]);
      setSelectedAccount(null);
    }
  }

  async function updateBalance(accountAddr) {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const bal = await provider.getBalance(accountAddr);
      setBalance(ethers.formatEther(bal));
    } catch (err) {
      console.error(err);
    }
  }

  async function connect() {
    if (!window.ethereum) return alert("Please install MetaMask");
    try {
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });

      const accs = await window.ethereum.request({ method: "eth_requestAccounts" });
      await handleAccountsChanged(accs);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {!selectedAccount ? (
        <button
          onClick={connect}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 text-white px-4 py-2 rounded-lg shadow"
        >
          <Wallet size={18} /> Connect Wallet
        </button>
      ) : (
        <div className="flex items-center gap-3 bg-slate-100 px-3 py-2 rounded-lg shadow-sm">
          <div className="text-sm">
            {accounts.length > 1 ? (
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="bg-transparent font-medium text-gray-800 border-none focus:ring-0 p-0 cursor-pointer"
              >
                {accounts.map(acc => (
                  <option key={acc} value={acc}>
                    {acc.slice(0, 6)}…{acc.slice(-4)}
                  </option>
                ))}
              </select>
            ) : (
              <div className="font-medium text-gray-800">{selectedAccount.slice(0, 6)}…{selectedAccount.slice(-4)}</div>
            )}
            <div className="text-xs text-gray-500">{balance ? Number(balance).toFixed(4) : "0.00"} ETH</div>
          </div>
          <button
            onClick={connect}
            className="text-xs bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-2 py-1 rounded shadow-sm"
          >
            {accounts.length > 1 ? "Manage" : "Switch"}
          </button>
        </div>
      )}
    </div>
  );
}
