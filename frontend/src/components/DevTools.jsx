export default function DevTools() {
  async function resetChain() {
    alert("Resetting Hardhat chain...");

    // Kill old node
    fetch("http://localhost:5001/reset", { method: "POST" });

    alert("Please restart: npx hardhat node");
  }

  return (
    <div className="fixed bottom-4 right-4">
      <button
        onClick={resetChain}
        className="bg-red-600 text-white px-4 py-2 rounded shadow-lg"
      >
        Reset Blockchain (Dev)
      </button>
    </div>
  );
}
