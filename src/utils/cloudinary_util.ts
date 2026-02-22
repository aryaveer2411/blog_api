import cloudinary from "./cloudinary_config";

export const uploadToCloudinary = (buffer: Buffer) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "blog_app",
          resource_type: "image",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      )
      .end(buffer);
  });
};
