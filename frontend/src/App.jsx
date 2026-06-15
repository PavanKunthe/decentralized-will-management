import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import CreateWill from "./components/CreateWill";
import ViewWill from "./components/ViewWill";

import { useState } from "react";

export default function App() {
  const [currentAccount, setCurrentAccount] = useState(null);

  return (
    <Router>
      <Navbar onWalletConnect={setCurrentAccount} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateWill currentAccount={currentAccount} />} />
        <Route path="/view" element={<ViewWill currentAccount={currentAccount} />} />
      </Routes>
    </Router>
  );
}
