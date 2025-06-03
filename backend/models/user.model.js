import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: function () {
      return this.provider === "local";
    },
  },
  picture: {
    type: String,
  },
  provider: {
    type: String,
    enum: ["google", "local"],
    default: "local",
  },
});

userSchema.statics.hashPassword = async (password) => {
  const salt = 10;
  return await bcrypt.hash(password, salt);
};

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateToken = function () {
  const accessToken = jwt.sign({ _id: this._id }, "JWT_SNEAKPEEK_SECRET", {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ _id: this._id }, "JWT_SNEAKPEEK_SECRET", {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};

const userModel = mongoose.model("User", userSchema);

export default userModel;
