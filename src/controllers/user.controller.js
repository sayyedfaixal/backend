/**
 * User Controller
 * 
 * This file contains all the controller functions for user-related operations including:
 * - User registration and authentication (login, logout, token refresh)
 * - User profile management (update details, avatar, cover image)
 * - User channel profile and watch history
 */

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

/**
 * Register a new user
 * 
 * Handles user registration with the following steps:
 * 1. Validates all required fields (fullName, username, email, password)
 * 2. Checks if user already exists (by username or email)
 * 3. Validates and uploads avatar image (required)
 * 4. Optionally uploads cover image if provided
 * 5. Creates user account with uploaded image URLs
 * 6. Returns user data without sensitive information (password, refreshToken)
 * 
 * @route POST /api/v1/users/register
 * @access Public
 */
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, username, email, password } = req.body;
  console.log("Request Body", req.body);
  console.log("Request Headers", req.headers);
  console.log("Request files", req.files);
  console.log("Request file (singular)", req.file);
  console.log("Is multipart form data?", req.is("multipart/form-data"));

  // Validate that all required fields are provided and not empty
  if (
    [fullName, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if a user with the same username or email already exists
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already Exists");
  }

  // Extract avatar file path from multer-uploaded files
  // req.files.avatar is an array (from multer middleware), so we access the first element
  const avatarLocalFilePath = req.files?.avatar?.[0]?.path;

  // Validate that avatar file is present (avatar is required for registration)
  if (!avatarLocalFilePath) {
    throw new ApiError(400, "Avatar field is required");
  }

  // Extract cover image file path if provided (cover image is optional)
  let coverImageLocalFilePath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalFilePath = req.files.coverImage[0].path;
  }

  // Upload avatar to Cloudinary and get the URL
  const avatarCloudinary = await uploadToCloudinary(avatarLocalFilePath);

  // Initialize cover image with empty URL (will be updated if cover image is provided)
  let coverImageCloudinary = { url: "" };

  // Upload cover image to Cloudinary if provided
  if (coverImageLocalFilePath) {
    coverImageCloudinary = await uploadToCloudinary(coverImageLocalFilePath);
  }

  // Validate that avatar upload was successful
  if (!avatarCloudinary) {
    throw new ApiError(500, "Something went wrong while uploading Avatar");
  }

  // Create new user in database with all provided information
  // Username is stored in lowercase for consistency
  // Cover image defaults to empty string if not provided
  const user = await User.create({
    fullName,
    username: username.toLowerCase(),
    email,
    password,
    avatar: avatarCloudinary.url,
    coverImage: coverImageCloudinary.url || "", // if there is no coverImageCloudinary pass ""
  });

  console.log("Avatar and CoverImage uploaded successfully...");
  
  // Fetch the created user again to ensure it was saved correctly
  // Exclude sensitive fields (password and refreshToken) from the response
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

/**
 * Generate Access and Refresh Tokens for a user
 * 
 * This helper function:
 * 1. Finds the user by ID
 * 2. Generates a new access token (short-lived, for API authentication)
 * 3. Generates a new refresh token (long-lived, for getting new access tokens)
 * 4. Saves the refresh token to the user document in the database
 * 
 * Note: validateBeforeSave is set to false because we're only updating the refreshToken
 * field and don't need to validate other required fields like password at this point.
 * 
 * @param {string} userId - MongoDB ObjectId of the user
 * @returns {Object} Object containing accessToken and refreshToken
 * @throws {ApiError} If user not found or token generation fails
 */
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    console.log("==== user.generateAccessToken  ==== ");
    // Generate access token (typically expires in 15 minutes to 1 hour)
    const accessToken = user.generateAccessToken();

    console.log("==== user.generateRefreshToken ==== ");
    // Generate refresh token (typically expires in 7-30 days)
    const refreshToken = user.generateRefreshToken();
    console.log("==== DONE ==== ");

    // Store refresh token in database for validation during token refresh
    user.refreshToken = refreshToken;
    /**
     * While saving the user as we have defined the schema that we need password and other fields
     * to stop that validation from kicking in while saving the user we use validateBeforeSave: false
     * This is safe here because we're only updating the refreshToken field
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
/**
 * Login user
 * 
 * Authenticates a user and provides access tokens. The process:
 * 1. Accepts username OR email along with password
 * 2. Finds user in database by username or email
 * 3. Validates the provided password
 * 4. Generates new access and refresh tokens
 * 5. Sets tokens as HTTP-only cookies (secure, server-only accessible)
 * 6. Also returns tokens in response body (for mobile apps that can't use cookies)
 * 
 * @route POST /api/v1/users/login
 * @access Public
 */
const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;
  
  // User can login with either username or email
  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  // Find user either by username or email
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist!");
  }

  // Verify password using bcrypt comparison (handled in user model)
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials!");
  }
  
  // Generate new access and refresh tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  // Fetch user data without sensitive information
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // Cookie options for security:
  // httpOnly: true - Prevents JavaScript access (XSS protection)
  // secure: true - Only sent over HTTPS (production security)
  // Once we set httpOnly, secure option as true while setting the cookie then it can only be modified by the SERVER
  const options = {
    httpOnly: true,
    secure: true,
  };

  // We would need to send the accessToken and RefreshToken if the user is trying to save them at their end
  // Cookies cannot be saved in mobile apps, so in that case it is a best practice to send these values in the response body
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

/**
 * Logout user
 * 
 * Logs out the authenticated user by:
 * 1. Removing the refresh token from the database (prevents token reuse)
 * 2. Clearing the access and refresh token cookies from the client
 * 
 * Note: The user must be authenticated (req.user is set by auth middleware)
 * 
 * @route POST /api/v1/users/logout
 * @access Private (requires authentication)
 */
const logoutUser = asyncHandler(async (req, res) => {
  // Remove refresh token from database using $unset operator
  // This invalidates the refresh token, preventing its reuse
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

  // Cookie options must match the ones used when setting cookies
  const options = {
    httpOnly: true,
    secure: true,
  };

  // Clear both access and refresh token cookies
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully!"));
});

/**
 * Refresh Access Token
 * 
 * Generates a new access token using a valid refresh token. This allows users to
 * continue accessing protected routes without re-logging in.
 * 
 * Process:
 * 1. Extracts refresh token from cookies or request body
 * 2. Verifies the refresh token signature and expiration
 * 3. Validates that the token matches the one stored in database (prevents reuse of old tokens)
 * 4. Generates new access and refresh tokens (token rotation for security)
 * 5. Updates cookies and returns new tokens
 * 
 * @route POST /api/v1/users/refresh-token
 * @access Public (but requires valid refresh token)
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
  // Get refresh token from cookies (web) or request body (mobile)
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized access");
  }

  const options = {
    httpOnly: true,
    secure: true,
  };

  try {
    // Verify the refresh token signature and expiration using JWT
    const decodedToken = await jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // Find the user associated with the token
    const user = await User.findById(decodedToken?._id);

    // If the user is not found, throw an error
    if (!user) {
      throw new ApiError(401, "User not found");
    }

    // Security check: Verify that the refresh token matches the one stored in database
    // If they don't match, it could mean:
    // - User has logged out (token was cleared)
    // - Token was already used (token rotation)
    // - Token was compromised and replaced
    if (user?.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Refresh token is expired or invalid");
    }
    
    // Generate new access token and refresh token (token rotation)
    // This invalidates the old refresh token and issues a new one
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

/**
 * Change user password
 * 
 * Allows authenticated users to change their password by:
 * 1. Validating old password is correct
 * 2. Updating to new password (automatically hashed by mongoose pre-save hook)
 * 
 * Note: validateBeforeSave is set to false because we're only updating password
 * and the password hashing middleware will handle validation.
 * 
 * @route POST /api/v1/users/change-password
 * @access Private (requires authentication)
 */
const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  
  // Validate that both old and new passwords are provided
  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old password and new password are required");
  }
  
  // Get current user from request (set by auth middleware)
  const user = await User.findById(req.user?._id);
  
  // Verify that the old password is correct
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid old password!");
  }
  
  // Update password (mongoose pre-save hook will hash it automatically)
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully!"));
});

/**
 * Get current authenticated user
 * 
 * Returns the profile information of the currently authenticated user.
 * The user object is attached to req.user by the authentication middleware.
 * 
 * @route GET /api/v1/users/current-user
 * @access Private (requires authentication)
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully!"));
});

/**
 * Update account details
 * 
 * Allows authenticated users to update their basic account information:
 * - Full name
 * - Email address
 * 
 * Note: This does NOT update password (use changePassword for that) or
 * profile images (use updateUserAvatar/updateUserCoverImage for those).
 * 
 * @route PATCH /api/v1/users/update-account
 * @access Private (requires authentication)
 */
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  // Validate required fields and basic email format
  if (!fullName || !email || !email.includes("@")) {
    throw new ApiError(400, "Full name and email are required");
  }
  
  // Update user details
  // new: true returns the updated document
  // runValidators: true ensures mongoose validators run (e.g., email format)
  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email: email.toLowerCase(), // Store email in lowercase for consistency
      },
    },
    { new: true, runValidators: true }
  ).select("-password"); // Exclude password from response

  if (!updatedUser) {
    throw new ApiError(404, "User not found");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedUser, "Account details updated successfully!")
    );
});

/**
 * Update user avatar
 * 
 * Updates the user's profile picture (avatar) by:
 * 1. Receiving the new avatar file via multipart/form-data
 * 2. Uploading it to Cloudinary
 * 3. Updating the user's avatar URL in the database
 * 
 * TODO: Delete old avatar image from Cloudinary to save storage space
 * 
 * @route PATCH /api/v1/users/avatar
 * @access Private (requires authentication)
 */
const updateUserAvatar = asyncHandler(async (req, res) => {
  // Get file path from multer middleware (single file upload)
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  // TODO: delete old image from Cloudinary before uploading new one - assignment

  // Upload new avatar to Cloudinary
  const avatar = await uploadToCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading avatar");
  }

  // Update user's avatar URL in database
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true } // Return updated document
  ).select("-password"); // Exclude password from response

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar image updated successfully"));
});

/**
 * Update user cover image
 * 
 * Updates the user's cover/banner image by:
 * 1. Receiving the new cover image file via multipart/form-data
 * 2. Uploading it to Cloudinary
 * 3. Updating the user's cover image URL in the database
 * 
 * TODO: Delete old cover image from Cloudinary to save storage space
 * 
 * @route PATCH /api/v1/users/cover-image
 * @access Private (requires authentication)
 */
const updateUserCoverImage = asyncHandler(async (req, res) => {
  // Get file path from multer middleware (single file upload)
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is missing");
  }

  // TODO: delete old image from Cloudinary before uploading new one - assignment

  // Upload new cover image to Cloudinary
  const coverImage = await uploadToCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading cover image");
  }

  // Update user's cover image URL in database
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true } // Return updated document
  ).select("-password"); // Exclude password from response

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

/**
 * Get user channel profile
 * 
 * Fetches detailed channel/profile information for a specific user by username.
 * Uses MongoDB aggregation pipeline to:
 * 1. Find the user by username
 * 2. Count subscribers (users who subscribed to this channel)
 * 3. Count channels this user is subscribed to
 * 4. Check if the current authenticated user is subscribed to this channel
 * 5. Return channel statistics and profile information
 * 
 * This is useful for displaying channel pages with subscriber counts and
 * subscription status.
 * 
 * @route GET /api/v1/users/c/:username
 * @access Public (but subscription status requires authentication)
 */
const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }

  // MongoDB aggregation pipeline to get channel statistics
  const channel = await User.aggregate([
    // Stage 1: Find user by username (case-insensitive)
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    // Stage 2: Lookup all subscriptions where this user is the channel
    // This gives us all users who subscribed to this channel
    {
      $lookup: {
        from: "subscriptions", // Collection name in MongoDB (usually pluralized)
        localField: "_id", // User's _id
        foreignField: "channel", // Subscription's channel field
        as: "subscribers", // Array of subscription documents
      },
    },
    // Stage 3: Lookup all subscriptions where this user is the subscriber
    // This gives us all channels this user has subscribed to
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id", // User's _id
        foreignField: "subscriber", // Subscription's subscriber field
        as: "subscribedTo", // Array of subscription documents
      },
    },
    // Stage 4: Add computed fields
    {
      $addFields: {
        // Count total subscribers
        subscribersCount: {
          $size: "$subscribers",
        },
        // Count channels this user is subscribed to
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        // Check if current authenticated user is subscribed to this channel
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    // Stage 5: Project only the fields we want to return
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "channel does not exists");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully")
    );
});
/**
 * Get watch history
 * 
 * Retrieves the authenticated user's video watch history with full video details
 * and owner information. Uses nested MongoDB aggregation pipelines to:
 * 1. Find the current user
 * 2. Populate watch history with full video documents
 * 3. For each video, populate the owner (channel) information
 * 4. Return only necessary owner fields (fullName, username, avatar)
 * 
 * This provides a complete watch history with video details and channel info
 * for displaying in a user's watch history page.
 * 
 * @route GET /api/v1/users/watch-history
 * @access Private (requires authentication)
 */
const getWatchHistory = asyncHandler(async (req, res) => {
  // MongoDB aggregation pipeline with nested lookups
  const user = await User.aggregate([
    // Stage 1: Match the current authenticated user
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    // Stage 2: Lookup videos from watchHistory array
    {
      $lookup: {
        from: "videos", // Videos collection
        localField: "watchHistory", // Array of video IDs in user document
        foreignField: "_id", // Video's _id field
        as: "watchHistory", // Replace the array of IDs with full video documents
        // Nested pipeline to process each video
        pipeline: [
          // Stage 2a: Lookup video owner (channel) information
          {
            $lookup: {
              from: "users", // Users collection (channel owners)
              localField: "owner", // Video's owner field (user ID)
              foreignField: "_id", // User's _id
              as: "owner", // Array containing owner document
              // Nested pipeline to project only needed owner fields
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          // Stage 2b: Convert owner array to single object
          // $lookup returns an array, but we want a single owner object
          {
            $addFields: {
              owner: {
                $first: "$owner", // Get first (and only) element from array
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch history fetched successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
