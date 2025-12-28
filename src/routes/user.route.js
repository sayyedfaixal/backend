import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getWatchHistory,
  getUserChannelProfile,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

// ============================================
// Protected Routes (require authentication)
// ============================================
// All routes below require the verifyJWT middleware to ensure the user is authenticated

/**
 * Logout user
 * POST /logout
 * - Removes refresh token from database
 * - Clears access and refresh token cookies
 * Uses POST because logout is an action that modifies server state (clears tokens)
 */
router.route("/logout").post(verifyJWT, logoutUser);

/**
 * Refresh access token
 * GET /refresh-token
 * - Generates new access and refresh tokens using existing refresh token
 * Uses GET because it's a read operation (fetching new tokens), though POST is also common
 */
router.route("/refresh-token").get(refreshAccessToken);

/**
 * Change user password
 * POST /change-password
 * - Validates old password and updates to new password
 * Uses POST because changing password is a state-changing action (modifies user data)
 */
router.route("/change-password").post(verifyJWT, changePassword);

/**
 * Get current authenticated user profile
 * GET /current-user
 * - Returns the profile of the currently logged-in user
 * Uses GET because it's a read operation (fetching user data)
 */
router.route("/current-user").get(verifyJWT, getCurrentUser);

/**
 * Update account details (fullName, email)
 * PATCH /update-account
 * - Updates user's full name and/or email
 *
 * Why PATCH instead of PUT?
 * - PATCH is used for partial updates (only updating specific fields)
 * - PUT would imply replacing the entire resource, which we're not doing
 * - PATCH is semantically correct for updating a subset of user properties
 * - Follows RESTful conventions for partial resource updates
 */
router.route("/update-account").patch(verifyJWT, updateAccountDetails);

/**
 * Update user avatar (profile picture)
 * PATCH /avatar
 * - Uploads new avatar image to Cloudinary and updates user's avatar URL
 *
 * Why PATCH instead of PUT?
 * - PATCH is used for partial updates (only updating the avatar field)
 * - PUT would imply replacing the entire user resource, which is not the case
 * - PATCH correctly represents updating a single property of the user resource
 * - Semantic HTTP method for partial resource modifications
 */
router
  .route("/avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

/**
 * Update user cover image (banner image)
 * PATCH /cover-image
 * - Uploads new cover image to Cloudinary and updates user's cover image URL
 *
 * Why PATCH instead of PUT?
 * - PATCH is used for partial updates (only updating the coverImage field)
 * - PUT would imply replacing the entire user resource, which is not the case
 * - PATCH correctly represents updating a single property of the user resource
 * - Semantic HTTP method for partial resource modifications
 */
router
  .route("/cover-image")
  .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

/**
 * Get user's watch history
 * GET /watch-history
 * - Returns the authenticated user's video watch history with full video and owner details
 * Uses GET because it's a read operation (fetching watch history data)
 */
router.route("/watch-history").get(verifyJWT, getWatchHistory);

/**
 * Get user channel profile by username
 * GET /c/:username
 * - Fetches detailed channel/profile information for a specific user by username
 * - Returns channel statistics including:
 *   - Subscriber count (how many users subscribed to this channel)
 *   - Channels subscribed to count (how many channels this user subscribed to)
 *   - Subscription status (whether current user is subscribed to this channel)
 *   - User profile information (fullName, username, avatar, coverImage, email)
 * 
 * Uses GET because it's a read operation (fetching channel/profile data)
 * The route uses "/c/:username" as a short, clean URL pattern for channel profiles
 * (similar to YouTube's /c/username pattern)
 * 
 * Note: Requires authentication to determine subscription status, but the channel
 * data itself is public information
 */
router.route("/c/:username").get(verifyJWT, getUserChannelProfile);

export default router;
