import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, username, email, password } = req.body;
  console.log("Request files", req.files);

  if (
    [fullName, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already Exists");
  }

  const avatarLocalFilePath = req.files?.avatar[0]?.path;
  // const coverImageLocalFilePath = req.files?.coverImage[0]?.path;

  //Check in req.file is the avatarLocalFilePath is present or not
  if (!avatarLocalFilePath) {
    throw new ApiError(400, "Avatar field is required");
  }

  let coverImageLocalFilePath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalFilePath = req.files.coverImage[0].path;
  }

  const avatarCloudinary = await uploadToCloudinary(avatarLocalFilePath);
  const coverImageCloudinary = await uploadToCloudinary(
    coverImageLocalFilePath
  );

  if (!avatarCloudinary) {
    throw new ApiError(500, "Something went wrong while uploading Avatar");
  }

  // If everything goes well
  const user = await User.create({
    fullName,
    username: username.toLowerCase(),
    email,
    password,
    avatar: avatarCloudinary.url,
    coverImage: coverImageCloudinary.url || "", // if there is no coverImageCloudinary pass ""
  });

  // Validate if the user has been created successfully or not, remove password and refreshToken from the response coming from DB and send it to user
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering User");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

export { registerUser };
