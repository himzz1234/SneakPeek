import express from "express";

const router = express.Router();
import {
  scrapeProducts,
  getAProduct,
  subscribeToProduct,
  getBestDeals,
  getTrendingDeals,
  logProductClick,
  scrapeProductDetails,
} from "../controllers/product.controller.js";
import { verifyAccessToken } from "../middlewares/authMiddleware.js";

router.get("/scrape", scrapeProducts);

router.get("/scrapedetails/:id", scrapeProductDetails);

router.post("/click", logProductClick);

router.get("/deals/best", getBestDeals);

router.get("/deals/trending", getTrendingDeals);

router.put("/:id/subscribe", verifyAccessToken, subscribeToProduct);

router.get("/:id", getAProduct);

export default router;
