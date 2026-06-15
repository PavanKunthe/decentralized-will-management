import { ethers } from "ethers";
import detectEthereumProvider from "@metamask/detect-provider";

export async function getProvider() {
  const provider = await detectEthereumProvider();
  if (!provider) throw new Error("MetaMask not found!");

  const ethersProvider = new ethers.BrowserProvider(window.ethereum);
  return ethersProvider;
}

export async function getSigner() {
  const provider = await getProvider();
  return provider.getSigner();
}
