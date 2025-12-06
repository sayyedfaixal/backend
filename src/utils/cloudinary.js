import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secre: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const uploadToCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      console.error(
        `ERR: Please provide a correct filePath. You have provided - ${localFilePath}`
      );
      return null;
    }

    //upload file to cloudinary
    const cloudinaryResponse = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // file uploaded successfully
    console.log(
      `${cloudinaryResponse.original_filename} - File uploaded successfully`
    );
    console.log(`${cloudinaryResponse.url} - is your Cloudinary url`);
    return cloudinaryResponse;
  } catch (error) {
    /*
        if there is an error, unlink (delete)
        Remove the file from the server as the upload operation got failed
    */
    fs.unlinkSync(localFilePath);
    console.error(`Error while uploading the file.`);
    return null;
  }
};

export { uploadToCloudinary };
