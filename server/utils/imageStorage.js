const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const useCloudinary = Boolean(process.env.CLOUDINARY_CLOUD_NAME);

let cloudinary;
if (useCloudinary) {
  cloudinary = require("cloudinary").v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

const uploadsDir = path.join(__dirname, "..", "..", "public", "uploads");

function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "almohandes-projects" },
      (err, result) => {
        if (err) return reject(err);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

function uploadToLocalDisk(buffer, originalName) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  const ext = path.extname(originalName || "").toLowerCase() || ".jpg";
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
  fs.writeFileSync(path.join(uploadsDir, filename), buffer);
  return { url: `/uploads/${filename}`, publicId: filename };
}

async function uploadImage(buffer, originalName) {
  if (useCloudinary) return uploadToCloudinary(buffer);
  return uploadToLocalDisk(buffer, originalName);
}

async function deleteImage(publicId) {
  if (!publicId) return;
  if (useCloudinary) {
    await cloudinary.uploader.destroy(publicId).catch(() => {});
    return;
  }
  const filePath = path.join(uploadsDir, publicId);
  await fs.promises.unlink(filePath).catch(() => {});
}

module.exports = { uploadImage, deleteImage, useCloudinary };
