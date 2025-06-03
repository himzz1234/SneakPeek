import express from "express";
const router = express.Router();
import {
  getProfileDetails,
  googleLogin,
  logout,
  refreshAccessToken,
  signIn,
  signUp,
} from "../controllers/auth.controller.js";
import { verifyAccessToken } from "../middlewares/authMiddleware.js";

router.post("/signup", signUp);

router.post("/signin", signIn);

router.post("/google-login", googleLogin);

router.get("/profile-details", verifyAccessToken, getProfileDetails);

router.get("/refresh-token", refreshAccessToken);

router.post("/logout", logout);

export default router;
