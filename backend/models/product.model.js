import mongoose from "mongoose";

const priceHistorySchema = new mongoose.Schema(
  {
    price: Number,
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

const sourceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    currentPrice: { type: Number, required: true },
    originalPrice: { type: Number, required: true },
    priceHistory: [priceHistorySchema],
    image: { type: String },
    link: { type: String, required: true },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    brand: { type: String, required: true },
    title: { type: String, required: true },
    colorway: { type: String },
    description: { type: String },
    specs: [{ type: String }],
    users: [
      {
        email: {
          type: String,
          required: true,
        },
        threshold: {
          type: Number,
        },
      },
    ],
    tags: [{ type: String, select: false }, { _id: false }],
    sources: { type: [sourceSchema] },
    images: { type: [String], default: [] },
    lowestPrice: { type: Number, select: false },
    highestPrice: { type: Number, select: false },
    averagePrice: { type: Number, select: false },
  },
  { timestamps: true }
);

productSchema.index({ brand: 1, title: 1, colorway: 1 }, { unique: true });

const productModel = mongoose.model("Product", productSchema);
export default productModel;
