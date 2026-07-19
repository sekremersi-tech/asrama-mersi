// src/utils/uploadCloudinary.js

export const uploadToCloudinary = async (file) => {
  const url = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`;
  
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    return data.secure_url; // Mengembalikan link permanen dari Cloudinary
  } catch (error) {
    console.error("Gagal mengunggah ke Cloudinary:", error);
    throw error;
  }
};