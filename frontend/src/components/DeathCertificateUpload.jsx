import { useState } from 'react';
import { ethers } from 'ethers';

export default function DeathCertificateUpload({ lockerAddress, lockerContract, onCertificateVerified }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setError(null);
            setResult(null);

            // Create preview for images
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreview(reader.result);
                };
                reader.readAsDataURL(file);
            } else {
                setPreview(null);
            }
        }
    };

    const uploadCertificate = async () => {
        if (!selectedFile) {
            setError('Please select a certificate file');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            // Upload to backend for OCR processing
            const formData = new FormData();
            formData.append('certificate', selectedFile);

            console.log('Uploading certificate to backend...');
            const response = await fetch('http://localhost:5000/upload-death-certificate', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to upload certificate');
            }

            const data = await response.json();
            console.log('Certificate processed:', data);

            if (!data.success) {
                throw new Error(data.error || 'Certificate processing failed');
            }

            setResult(data);
            setUploading(false);

            // If validation passed, proceed to blockchain submission
            if (data.validation.isValid) {
                await submitToBlockchain(data.certificateHash);
            } else {
                setError('Certificate validation failed. Please upload a valid death certificate.');
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.message);
            setUploading(false);
        }
    };

    const submitToBlockchain = async (certificateHash) => {
        setProcessing(true);
        setError(null);

        try {
            console.log('Submitting certificate hash to blockchain:', certificateHash);

            // Call autoVerifyCertificate function (auto-verifies for simplified flow)
            const tx = await lockerContract.autoVerifyCertificate(certificateHash);
            console.log('Transaction sent:', tx.hash);

            // Wait for confirmation
            const receipt = await tx.wait();
            console.log('Transaction confirmed:', receipt);

            setProcessing(false);

            // Notify parent component
            if (onCertificateVerified) {
                onCertificateVerified();
            }

            alert('Death certificate verified successfully! You can now claim the will.');
        } catch (err) {
            console.error('Blockchain submission error:', err);
            setError('Failed to submit certificate to blockchain: ' + err.message);
            setProcessing(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Upload Death Certificate</h3>

            <div className="mb-4">
                <p className="text-sm text-gray-600 mb-3">
                    To claim this will, you must upload a valid death certificate of the owner.
                    The certificate will be scanned and verified before you can proceed.
                </p>
            </div>

            {/* File Input */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Death Certificate (Image or PDF)
                </label>
                <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100
            cursor-pointer"
                />
            </div>

            {/* Preview */}
            {preview && (
                <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                    <img
                        src={preview}
                        alt="Certificate preview"
                        className="max-w-full h-auto max-h-64 rounded border border-gray-300"
                    />
                </div>
            )}

            {/* Upload Button */}
            <button
                onClick={uploadCertificate}
                disabled={!selectedFile || uploading || processing}
                className={`w-full py-2 px-4 rounded-md font-semibold text-white transition-colors
          ${!selectedFile || uploading || processing
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
            >
                {uploading ? 'Processing Certificate...' : processing ? 'Submitting to Blockchain...' : 'Upload & Verify Certificate'}
            </button>

            {/* Processing Status */}
            {uploading && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-800">
                        🔍 Scanning certificate with OCR... This may take a moment.
                    </p>
                </div>
            )}

            {processing && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800">
                        ⏳ Submitting to blockchain... Please confirm the transaction in your wallet.
                    </p>
                </div>
            )}

            {/* Results */}
            {result && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
                    <h4 className="font-semibold text-green-800 mb-2">✅ Certificate Processed</h4>

                    <div className="text-sm text-gray-700 space-y-2">
                        <div>
                            <span className="font-medium">Validation:</span>{' '}
                            <span className={result.validation.isValid ? 'text-green-600' : 'text-red-600'}>
                                {result.validation.message}
                            </span>
                        </div>

                        <div>
                            <span className="font-medium">Confidence:</span> {result.validation.confidence}
                        </div>

                        <div>
                            <span className="font-medium">Keywords Found:</span>{' '}
                            {result.validation.foundRequired.join(', ')}
                        </div>

                        <div className="mt-3 p-2 bg-gray-100 rounded">
                            <span className="font-medium">Certificate Hash:</span>
                            <p className="text-xs break-all mt-1">{result.certificateHash}</p>
                        </div>

                        {result.extractedText && (
                            <details className="mt-3">
                                <summary className="cursor-pointer font-medium text-blue-600 hover:text-blue-800">
                                    View Extracted Text
                                </summary>
                                <div className="mt-2 p-2 bg-white border rounded text-xs max-h-32 overflow-y-auto">
                                    {result.extractedText}
                                </div>
                            </details>
                        )}
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-800">❌ {error}</p>
                </div>
            )}
        </div>
    );
}
