# Decentralized Will Management System

A blockchain-based decentralized application (dApp) that enables secure will management with automated inheritance distribution. The system features a "Dead Man's Switch" mechanism with death certificate verification, ensuring wills are only released to designated beneficiaries after proper validation.

## 🌟 Features

### Core Functionality
- **Encrypted Will Storage**: Upload and encrypt PDF wills stored on IPFS via Pinata
- **Dead Man's Switch**: Automated timer-based will release mechanism
- **Death Certificate Verification**: OCR-based verification of death certificates before will release
- **Smart Contract Security**: Ethereum blockchain-based access control and automation
- **Beneficiary Management**: Designate and manage will beneficiaries
- **Check-In System**: Regular owner check-ins to prevent premature will release

### Technical Features
- **OCR Processing**: Tesseract.js-based death certificate text extraction
- **Certificate Validation**: Keyword-based validation for death certificate authenticity
- **Hash Verification**: SHA-256 hashing for certificate integrity
- **Chainlink Automation Ready**: Compatible with Chainlink Keepers for automated upkeep
- **MetaMask Integration**: Seamless wallet connectivity

## 🏗️ Architecture

### Smart Contracts
- **WillRegistry.sol**: Factory contract for creating and managing will lockers
- **WillLocker.sol**: Individual will locker with death certificate verification
  - Owner check-in mechanism
  - Grace period management
  - Certificate submission and verification
  - Automated claim process

### Backend (Node.js/Express)
- **IPFS Integration**: File upload to Pinata
- **OCR Processing**: Death certificate text extraction using Tesseract.js
- **Certificate Validation**: Keyword-based death certificate verification
- **Hash Generation**: SHA-256 certificate hashing

### Frontend (React + Vite)
- **React Components**: Modern component-based UI
- **Ethers.js**: Blockchain interaction
- **CryptoJS**: Client-side encryption/decryption
- **Responsive Design**: Mobile-friendly interface

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **MetaMask** browser extension
- **Git** (optional, for cloning)

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd decentralized-will
```

### 2. Install Dependencies

**Root Dependencies** (Hardhat & Smart Contracts)
```bash
npm install
```

**Backend Dependencies**
```bash
cd backend
npm install
cd ..
```

**Frontend Dependencies**
```bash
cd frontend
npm install
cd ..
```

### 3. Environment Configuration

**Backend `.env`** (backend/.env)
```env
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_key
PORT=5000
```

**Root `.env`** (for deployment)
```env
PRIVATE_KEY=your_private_key
INFURA_API_KEY=your_infura_key (for testnet deployment)
```

## 🎮 Running the Project

You need **three separate terminals** running simultaneously:

### Terminal 1: Local Blockchain Node
```bash
npx hardhat node
```
*Starts local Ethereum network on localhost:8545. Keep this running and note the test accounts.*

### Terminal 2: Backend Server
```bash
cd backend
npm start
```
*Starts Express server on http://localhost:5000 for IPFS uploads and OCR processing.*

### Terminal 3: Deploy Contracts & Start Frontend

**Deploy Smart Contracts**
```bash
npx hardhat run scripts/deployLocal.js --network localhost
```
*Deploys WillRegistry contract and saves address to frontend configuration.*

**Start Frontend**
```bash
cd frontend
npm run dev
```
*Launches React app at http://localhost:5173*

## 📖 Usage Guide

### Initial Setup

1. **Configure MetaMask**
   - Switch network to **Localhost 8545**
   - Import test accounts from Terminal 1 (copy private keys)
   - Import at least 2 accounts: one for Owner, one for Beneficiary

### Creating a Will

1. Navigate to **"Create Will"**
2. Upload a PDF document (your will)
3. Enter an encryption password (remember this!)
4. Enter beneficiary's wallet address
5. Set check-in interval (e.g., 60 seconds for testing, days/months for production)
6. Confirm transaction in MetaMask
7. Wait for blockchain confirmation

### Owner Actions

1. Go to **"View Will"**
2. Click **"Get My Locker"**
3. View countdown timer
4. Click **"I'm Alive (Reset Timer)"** to reset the countdown
5. Repeat check-ins before timer expires

### Beneficiary Claiming Process

#### Step 1: Wait for Expiration
- Timer must expire (owner fails to check in)
- On local blockchain, time advances with transactions
- Use debug script if needed:
  ```bash
  npx hardhat run scripts/debugLocal.js --network localhost
  ```

#### Step 2: Submit Death Certificate
1. Switch to **Beneficiary account** in MetaMask
2. Navigate to **"View Will"**
3. Click **"Get My Locker"**
4. Upload death certificate image (JPG/PNG)
5. System performs OCR and validation
6. Certificate hash is submitted to blockchain

#### Step 3: Claim Will
1. After certificate verification, click **"Claim Will"**
2. Confirm transaction in MetaMask
3. Click **"Load CID"** to retrieve encrypted will
4. Click **"Decrypt & View Will"**
5. Enter owner's password to decrypt and download PDF

## 🧪 Testing

### Automated Testing Scripts

**Test Certificate Verification Flow**
```bash
npx hardhat run scripts/testCertificateVerification.js --network localhost
```
*Tests the complete death certificate verification and claim process.*

**Backend Certificate Processing Test**
```bash
node test-backend-certificate.js
```
*Tests OCR processing and certificate validation.*

**Quick Backend Test** (Windows)
```bash
test-backend.bat
```

### Manual Testing Workflow

1. **Create Test Will**
   - Use 60-second check-in interval
   - Note the locker address

2. **Let Timer Expire**
   - Wait 60+ seconds
   - Run debug script to advance blockchain time if needed

3. **Test Certificate Upload**
   - Create/use test death certificate image
   - Upload as beneficiary
   - Verify OCR extraction

4. **Complete Claim**
   - Claim will after verification
   - Decrypt with owner's password
   - Verify PDF download

## 🛠️ Technology Stack

### Blockchain
- **Solidity** ^0.8.20 - Smart contract development
- **Hardhat** ^2.26.0 - Development environment
- **Ethers.js** ^6.15.0 - Blockchain interaction
- **Chainlink Contracts** ^1.5.0 - Automation compatibility

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web server framework
- **Tesseract.js** - OCR processing
- **Pinata SDK** - IPFS file storage
- **Crypto** - SHA-256 hashing

### Frontend
- **React** ^18.x - UI framework
- **Vite** - Build tool and dev server
- **CryptoJS** - Encryption/decryption
- **Ethers.js** - Web3 integration

### Development Tools
- **Mocha** - Testing framework
- **Chai** - Assertion library
- **TypeScript** - Type safety
- **Prettier** - Code formatting

## 📁 Project Structure

```
decentralized-will/
├── contracts/              # Solidity smart contracts
│   ├── WillRegistry.sol   # Factory contract
│   └── WillLocker.sol     # Individual will locker
├── scripts/               # Deployment and test scripts
│   ├── deployLocal.js     # Local deployment
│   ├── debugLocal.js      # Time manipulation
│   └── testCertificateVerification.js
├── backend/               # Express server
│   ├── server.js          # Main server file
│   ├── certificateProcessor.js  # OCR processing
│   └── uploads/           # Temporary file storage
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── utils/         # Helper functions
│   │   └── contracts/     # Contract ABIs
│   └── public/
├── test/                  # Contract tests
└── hardhat.config.js      # Hardhat configuration
```

## 🔐 Security Considerations

- **Encryption**: Client-side AES encryption for will documents
- **Access Control**: Smart contract-enforced beneficiary restrictions
- **Certificate Verification**: Multi-keyword validation for death certificates
- **Hash Integrity**: SHA-256 hashing prevents certificate tampering
- **Grace Period**: Configurable grace period prevents accidental releases
- **Private Keys**: Never commit private keys or API keys to version control

## 🐛 Troubleshooting

### Timer Not Advancing
**Issue**: Countdown timer stuck on local blockchain  
**Solution**: Run the debug script to advance blockchain time:
```bash
npx hardhat run scripts/debugLocal.js --network localhost
```

### MetaMask Transaction Fails
**Issue**: Transaction rejected or fails  
**Solutions**:
- Ensure correct network (Localhost 8545)
- Check account has sufficient ETH
- Reset MetaMask account nonce (Settings → Advanced → Reset Account)

### OCR Not Working
**Issue**: Death certificate not recognized  
**Solutions**:
- Use clear, high-quality images
- Ensure certificate contains keywords: "death", "certificate", "deceased"
- Check backend logs for OCR errors

### IPFS Upload Fails
**Issue**: File upload to Pinata fails  
**Solutions**:
- Verify Pinata API keys in backend/.env
- Check internet connection
- Ensure file size is within limits

## 📝 Development Notes

### Local Blockchain Time
- Time only advances with transactions
- Use `debugLocal.js` to fast-forward time
- Check-in intervals should be short for testing (60-300 seconds)

### Testing with Real Networks
- Update `hardhat.config.js` with network details
- Use testnet faucets for test ETH
- Update frontend contract addresses after deployment

### Certificate Verification
- OCR requires clear, readable text
- Validation checks for specific keywords
- Auto-verify function available for testing (bypasses manual verification)

## 🙏 Acknowledgments

- **Hardhat** - Ethereum development environment
- **OpenZeppelin** - Smart contract libraries
- **Chainlink** - Automation infrastructure
- **Pinata** - IPFS pinning service
- **Tesseract.js** - OCR processing
