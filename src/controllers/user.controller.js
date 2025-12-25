import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, username, email, password } = req.body;
  console.log("Request Body", req.body);
  console.log("Request Headers", req.headers);
  console.log("Request files", req.files);
  console.log("Request file (singular)", req.file);
  console.log("Is multipart form data?", req.is("multipart/form-data"));

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

  const avatarLocalFilePath = req.files?.avatar?.[0]?.path;
  // const coverImageLocalFilePath = req.files?.coverImage?.[0]?.path;

  //Check if avatar file is present
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

  let coverImageCloudinary = { url: "" };

  if (coverImageLocalFilePath) {
    coverImageCloudinary = await uploadToCloudinary(coverImageLocalFilePath);
  }

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

  console.log("Avatar and CoverImage uploaded successfully...");
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

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    console.log("==== user.generateAccessToken  ==== ");
    const accessToken = user.generateAccessToken();

    console.log("==== user.generateRefreshToken ==== ");
    const refreshToken = user.generateRefreshToken();
    console.log("==== DONE ==== ");

    user.refreshToken = refreshToken;
    /**
     * While saving the user as we have defined the schema that we need password and other fields
     * to stop that file to kickin while saving the user we use validateBeforeSave: false
     */
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error generating tokens:", error);
    throw new ApiError(
      500,
      error.message ||
        "Something went wrong while generating Access and Refresh Token :("
    );
  }
};
const loginUser = asyncHandler(async (req, res) => {
  /**
   * get username and emai
   * find the user
   * password check
   * access and refresh tokent
   * send cookie
   * */

  const { email, username, password } = req.body;
  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  //find user either by username or email
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist!");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalud user credentials!");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // Once we set httpOnly, secure option as true while setting the cookie then it can only be modified by the SERVER
  const options = {
    httpOnly: true,
    secure: true,
  };

  // We would need to send the accessToken and RefreshToken if the user is trying to save them at their end, cookies cannot be saved in mobile so in that case it is a best practise to send these values
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in Successfully!"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully!"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized access");
  }

  const options = {
    httpOnly: true,
    secure: true,
  };

  try {
    // Verify the refresh token
    const decodedToken = await jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // Find the user
    const user = await User.findById(decodedToken?._id);

    // If the user is not found, throw an error
    if (!user) {
      throw new ApiError(401, "User not found");
    }

    // If the refresh token is not the same as the one in the database then it means that the user has logged out and we need to generate a new refresh token
    if (user?.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Refresh token is expired or invalid");
    }
    // Generate a new access token and refresh token and update the refresh token in the database and save the user
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    // Send the new access token and refresh token to the user
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed successfully!"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong while refreshing access token :("
    );
  }
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };
