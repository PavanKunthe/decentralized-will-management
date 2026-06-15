import pinataSDK from "@pinata/sdk";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const pinata = new pinataSDK({ pinataJWTKey: process.env.PINATA_JWT });

async function upload() {
  try {
    const readableStream = fs.createReadStream("./will.pdf");

    const options = {
      pinataMetadata: {
        name: "will-document",   // <-- REQUIRED
      },
      pinataOptions: {
        cidVersion: 1,
      },
    };

    const result = await pinata.pinFileToIPFS(readableStream, options);

    console.log("Uploaded to Pinata:", result);
  } catch (err) {
    console.error("Error uploading:", err);
  }
}

upload();
