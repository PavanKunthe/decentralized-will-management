// src/components/Home.jsx
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Home() {
    return (
        <div className="max-w-6xl mx-auto py-16 px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.4 }}>
                    <h1 className="text-5xl font-extrabold leading-tight mb-4">Secure your final wishes — simply.</h1>
                    <p className="text-lg text-gray-600 mb-6">
                        Encrypt your will, pin it to IPFS, and store the CID on-chain. Only your beneficiary gets access after the unlock time.
                    </p>

                    <div className="flex gap-4">
                        <Link to="/create" className="bg-indigo-600 text-white px-6 py-3 rounded-lg shadow hover:bg-indigo-700 transition-colors">Create a Will</Link>
                        <Link to="/view" className="border border-indigo-600 text-indigo-600 px-6 py-3 rounded-lg hover:bg-indigo-50 transition-colors">View a Will</Link>
                    </div>
                </motion.div>

                <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }}>
                    <div className="bg-white rounded-2xl shadow-xl p-6">
                        <h3 className="font-semibold text-lg mb-2">How it works</h3>
                        <ol className="list-decimal ml-6 space-y-2 text-gray-700">
                            <li>Upload & encrypt your will in browser</li>
                            <li>Set a <strong>Check-In Interval</strong> (Dead Man's Switch)</li>
                            <li>Owner checks in periodically to keep the will locked</li>
                            <li>If owner fails to check in, the will unlocks for the beneficiary</li>
                        </ol>
                        <p className="text-sm text-gray-500 mt-4">Built with Hardhat, React, Tailwind and IPFS.</p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
