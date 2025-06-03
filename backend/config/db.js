import mongoose from "mongoose";

const connectToDB = () => {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("DB connection success!"))
    .catch((error) => console.log(error.message));
};

export default connectToDB;
