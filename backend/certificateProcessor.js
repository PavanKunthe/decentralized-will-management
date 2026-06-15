// backend/certificateProcessor.js
const Tesseract = require('tesseract.js');
const crypto = require('crypto');

/**
 * Process death certificate image using OCR
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<Object>} - Extracted text and validation result
 */
async function processCertificate(imageBuffer) {
  try {
    console.log('Starting OCR processing...');
    
    // Perform OCR on the image
    const result = await Tesseract.recognize(
      imageBuffer,
      'eng',
      {
        logger: m => console.log(m)
      }
    );
    
    const extractedText = result.data.text.toLowerCase();
    console.log('Extracted text:', extractedText);
    
    // Validate if it's a death certificate
    const validation = validateDeathCertificate(extractedText);
    
    // Generate hash of the certificate
    const certificateHash = generateHash(imageBuffer);
    
    return {
      success: true,
      extractedText: result.data.text,
      validation,
      certificateHash,
      confidence: result.data.confidence
    };
  } catch (error) {
    console.error('OCR processing error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Validate if the extracted text contains death certificate keywords
 * @param {string} text - Extracted text (lowercase)
 * @returns {Object} - Validation result
 */
function validateDeathCertificate(text) {
  const requiredKeywords = ['death', 'certificate', 'deceased'];
  const optionalKeywords = ['died', 'demise', 'passed away', 'mortality', 'registrar'];
  
  const foundRequired = requiredKeywords.filter(keyword => text.includes(keyword));
  const foundOptional = optionalKeywords.filter(keyword => text.includes(keyword));
  
  const isValid = foundRequired.length >= 2; // At least 2 required keywords
  
  return {
    isValid,
    foundRequired,
    foundOptional,
    confidence: isValid ? 'high' : 'low',
    message: isValid 
      ? 'Document appears to be a death certificate' 
      : 'Document may not be a valid death certificate'
  };
}

/**
 * Generate SHA-256 hash of the certificate
 * @param {Buffer} buffer - Certificate buffer
 * @returns {string} - Hex hash
 */
function generateHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Convert hex hash to bytes32 format for Solidity
 * @param {string} hexHash - Hex hash string
 * @returns {string} - 0x prefixed hash
 */
function toBytes32(hexHash) {
  return '0x' + hexHash;
}

module.exports = {
  processCertificate,
  validateDeathCertificate,
  generateHash,
  toBytes32
};
