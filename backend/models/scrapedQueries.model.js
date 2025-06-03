import mongoose from "mongoose";
const scrapedQueriesSchema = new mongoose.Schema(
  {
    searchTerm: {
      type: String,
      required: true,
    },
    filters: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

scrapedQueriesSchema.index({ searchTerm: 1, filters: 1 }, { unique: true });

const scrapedQueriesModel = mongoose.model(
  "scrapedQueries",
  scrapedQueriesSchema
);

export default scrapedQueriesModel;
