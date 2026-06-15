export async function uploadToIPFS(fileOrBlob) {
  try {
    console.log("Frontend: Sending encrypted file to backend...");

    const formData = new FormData();
    formData.append("file", fileOrBlob, "encrypted-will.bin");

    const res = await fetch("http://localhost:5000/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error("Backend upload failed");
    }

    const data = await res.json();

    console.log("CID returned:", data.cid);

    return data.cid;

  } catch (err) {
    console.error("Frontend uploadToIPFS error:", err);
    throw err;
  }
}
