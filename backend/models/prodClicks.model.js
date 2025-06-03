import mongoose from "mongoose";

const prodClicksSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "products",
      required: true,
    },
    searchTerm: {
      type: String,
    },
    ip: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

const ProdClicks = mongoose.model("ProdClicks", prodClicksSchema);

export default ProdClicks;
