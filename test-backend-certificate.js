// test-backend-certificate.js
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testBackend() {
    console.log("=== Testing Backend Certificate Processing ===\n");

    // Create a test certificate image path
    const certificatePath = "C:/Users/Hemanth B/.gemini/antigravity/brain/a5cd9986-6013-4962-b89b-e955ba2c8be9/sample_death_certificate_1765869095118.png";

    console.log("Certificate path:", certificatePath);

    if (!fs.existsSync(certificatePath)) {
        console.error("❌ Sample certificate not found at:", certificatePath);
        console.log("\nPlease ensure the sample certificate image exists.");
        return;
    }

    console.log("✅ Certificate file found");
    console.log("File size:", fs.statSync(certificatePath).size, "bytes\n");

    // Create form data
    const formData = new FormData();
    formData.append('certificate', fs.createReadStream(certificatePath));

    console.log("Uploading certificate to backend...\n");

    try {
        const response = await fetch('http://localhost:5000/upload-death-certificate', {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders()
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        console.log("=== Backend Response ===");
        console.log(JSON.stringify(result, null, 2));

        if (result.success) {
            console.log("\n✅ Certificate processed successfully!");
            console.log("\nValidation Results:");
            console.log("  - Valid:", result.validation.isValid);
            console.log("  - Confidence:", result.validation.confidence);
            console.log("  - Message:", result.validation.message);
            console.log("  - Keywords found:", result.validation.foundRequired.join(", "));
            console.log("\nCertificate Hash:", result.certificateHash);
            console.log("OCR Confidence:", result.confidence + "%");
        } else {
            console.log("\n❌ Certificate processing failed");
        }

    } catch (error) {
        console.error("\n❌ Error testing backend:", error.message);
    }
}

testBackend();
