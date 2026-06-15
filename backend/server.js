// backend/server.js
require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const PinataSDK = require("@pinata/sdk");

const app = express();
app.use(cors());
app.use(express.json());

// multer memory storage so we get raw Buffer (important!)
const upload = multer({ storage: multer.memoryStorage() });

// Pinata SDK v2
const pinata = new PinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_API_SECRET
);

app.post("/upload-encrypted", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file received" });

    console.log("Backend: received encrypted file:", req.file.originalname);
    console.log("Bytes:", req.file.buffer.length);

    const stream = require("stream");
    const readable = new stream.Readable();
    readable._read = () => { };
    readable.push(req.file.buffer);
    readable.push(null);

    const options = {
      pinataMetadata: {
        name: req.file.originalname,
      },
      pinataOptions: {
        cidVersion: 1,
      },
    };

    console.log("Uploading to Pinata...");
    const result = await pinata.pinFileToIPFS(readable, options);

    console.log("Pinata CID =", result.IpfsHash);
    return res.json({
      cid: result.IpfsHash,
      url: "https://gateway.pinata.cloud/ipfs/" + result.IpfsHash,
    });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ error: "Pinata upload failed", details: err.message });
  }
});

// Death certificate upload and processing endpoint
app.post("/upload-death-certificate", upload.single("certificate"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No certificate file received" });

    console.log("Backend: received death certificate:", req.file.originalname);
    console.log("File size:", req.file.buffer.length, "bytes");

    // Import certificate processor
    const certificateProcessor = require("./certificateProcessor");

    // Process the certificate with OCR
    const result = await certificateProcessor.processCertificate(req.file.buffer);

    if (!result.success) {
      return res.status(500).json({
        error: "Certificate processing failed",
        details: result.error
      });
    }

    // Convert hash to bytes32 format for blockchain
    const bytes32Hash = certificateProcessor.toBytes32(result.certificateHash);

    console.log("Certificate processed successfully");
    console.log("Hash:", bytes32Hash);
    console.log("Validation:", result.validation);

    return res.json({
      success: true,
      certificateHash: bytes32Hash,
      hexHash: result.certificateHash,
      extractedText: result.extractedText,
      validation: result.validation,
      confidence: result.confidence
    });
  } catch (err) {
    console.error("CERTIFICATE UPLOAD ERROR:", err);
    res.status(500).json({
      error: "Certificate processing failed",
      details: err.message
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running at http://localhost:${PORT}`));
