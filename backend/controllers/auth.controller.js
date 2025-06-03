import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const signUp = async (req, res) => {
  const { name, email, password } = req.body;

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  if (!isValidEmail(email)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid email format" });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be atleast 6 characters long",
    });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await User.hashPassword(password);
    await User.create({
      name,
      email,
      password: hashedPassword,
    });

    return res.status(201).json({ success: true, message: "User created" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const signIn = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User doesn't exist",
      });
    }

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const { accessToken, refreshToken } = user.generateToken();

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ success: true, user, accessToken });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const googleLogin = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res
      .status(400)
      .json({ success: false, message: "Missing ID token" });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        password: "",
        picture,
        provider: "google",
      });
    }

    const { accessToken, refreshToken } = user.generateToken();

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      user,
      accessToken,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const refreshAccessToken = async (req, res) => {
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken)
    return res
      .status(401)
      .json({ success: false, message: "Refresh token missing" });

  try {
    const decoded = jwt.verify(refreshToken, "JWT_SNEAKPEEK_SECRET");

    const accessToken = jwt.sign({ _id: decoded._id }, "JWT_SNEAKPEEK_SECRET", {
      expiresIn: "15m",
    });

    return res.status(200).json({ success: true, accessToken });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getProfileDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const logout = async (req, res) => {
  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  });

  return res
    .status(200)
    .json({ success: true, message: "Logged out successfully" });
};
