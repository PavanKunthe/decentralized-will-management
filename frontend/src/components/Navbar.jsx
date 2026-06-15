// src/components/Navbar.jsx
import { Link } from "react-router-dom";
import ConnectWallet from "./ConnectWallet";
import { SunMoon, FileText, Eye } from "lucide-react";
import { motion } from "framer-motion";

export default function Navbar({ onWalletConnect }) {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="bg-gradient-to-r from-sky-700 to-indigo-700 text-white px-6 py-3 shadow-lg sticky top-0 z-40"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-md">
            <FileText className="text-white" />
          </div>
          <div>
            <div className="text-xl font-bold">Decentralized Will</div>
            <div className="text-xs text-white/80">Secure wills on IPFS + Ethereum</div>
          </div>
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/create" className="text-sm hover:underline flex items-center gap-2">
            <FileText size={16} /> Create
          </Link>
          <Link to="/view" className="text-sm hover:underline flex items-center gap-2">
            <Eye size={16} /> View
          </Link>

          <ConnectWallet onConnect={onWalletConnect} />
        </div>
      </div>
    </motion.nav>
  );
}
