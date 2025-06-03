import {
  scrapeLimitedEdition,
  scrapeLimitedEditionDetails,
  scrapeSuperkicks,
  scrapeSuperkicksDetails,
  scrapeVegNonVeg,
  scrapeVegNonVegDetails,
} from "../utils/actions/index.js";
import productModel from "../models/product.model.js";
import scrapedQueriesModel from "../models/scrapedQueries.model.js";
import prodClickModel from "../models/prodClicks.model.js";
import { saveProducts } from "../services/product.service.js";
import User from "../models/user.model.js";
import { generateEmailBody, sendEmail } from "../lib/sendgrid/index.js";
import Bottleneck from "bottleneck";

const createLimiterWrapper = (fn, minTime = 500) => {
  const limiter = new Bottleneck({ minTime });
  return limiter.wrap(fn);
};

const detailScrapers = {
  VegNonVeg: scrapeVegNonVegDetails,
  SuperKicks: scrapeSuperkicksDetails,
  "Limited Edition": scrapeLimitedEditionDetails,
};

const limitedScrapeVegNonVeg = createLimiterWrapper(scrapeVegNonVeg);
const limitedScrapeSuperkicks = createLimiterWrapper(scrapeSuperkicks);
const limitedScrapeLimitedEdition = createLimiterWrapper(scrapeLimitedEdition);

export const scrapeProducts = async (req, res) => {
  const { query: searchQuery, page = 1, brands } = req.query;

  const brandArray = brands ? brands.split("|") : [];
  const brandFilter =
    brandArray.length > 0 ? { brand: { $in: brandArray } } : {};

  try {
    if (!searchQuery) {
      return res.status(400).json({ error: "Search term is required!" });
    }

    const existingQuery = await scrapedQueriesModel.findOne({
      searchTerm: searchQuery,
    });

    const searchKeywords = searchQuery
      .toLowerCase()
      .replace(/[^a-z0-9]/g, " ")
      .trim()
      .split(/\s+/);

    if (existingQuery) {
      const filteredProducts = await productModel
        .find({
          tags: { $all: searchKeywords },
          ...brandFilter,
        })
        .skip((page - 1) * 15)
        .limit(15);

      const availableBrands = await productModel.distinct("brand", {
        tags: { $all: searchKeywords },
      });

      return res.status(200).json({
        products: filteredProducts,
        availableFilters: {
          brands: availableBrands,
        },
      });
    } else {
      const results = await Promise.all([
        limitedScrapeVegNonVeg(searchQuery),
        limitedScrapeSuperkicks(searchQuery),
        limitedScrapeLimitedEdition(searchQuery),
      ]);

      const savedProducts = await saveProducts(results, searchQuery);
      await scrapedQueriesModel.create({ searchTerm: searchQuery });

      const availableBrands = await productModel.distinct("brand", {
        tags: { $all: searchKeywords },
      });

      return res.status(200).json({
        products: savedProducts,
        availableFilters: {
          brands: availableBrands,
        },
      });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const scrapeProductDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await productModel.findById(id);

    if (!product || !product.sources?.length) {
      return res.status(404).json({ message: "Product or sources not found" });
    }

    if (
      !product.description ||
      !product.specs.length ||
      !product.images.length
    ) {
      const scrapingPromises = product.sources
        .map((source) => {
          const scraper = detailScrapers[source.name];
          return scraper ? scraper(source.link) : null;
        })
        .filter(Boolean);

      const fastestSuccess = await Promise.any(scrapingPromises);
      product.description ||= fastestSuccess.description;
      if (
        (!product.specs || product.specs.length === 0) &&
        fastestSuccess.specs?.length
      ) {
        product.specs = fastestSuccess.specs;
      }

      if (
        (!product.images || product.images.length === 0) &&
        fastestSuccess.images?.length
      ) {
        product.images = fastestSuccess.images;
      }

      await product.save();
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error("Error scraping product details:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAProduct = async (req, res, next) => {
  const { id: productId } = req.params;

  try {
    if (!productId)
      return res.status(400).json({ error: "Product ID is required!" });

    const product = await productModel
      .findById(productId)
      .select("+lowestPrice +highestPrice +averagePrice")
      .lean();

    if (product && product.sources) {
      product.sources.sort((a, b) => a.currentPrice - b.currentPrice);
    }
    res.status(200).json({ product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const subscribeToProduct = async (req, res, next) => {
  const { id } = req.params;
  const { threshold } = req.body;

  try {
    const userDoc = await User.findById(req.user._id).select("name email");
    if (!userDoc) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const product = await productModel.findById(id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const userIndex = product.users.findIndex(
      (user) => user.email === userDoc.email
    );

    if (userIndex === -1) {
      product.users.push({ email: userDoc.email, threshold });
    } else {
      product.users[userIndex].threshold =
        threshold ?? product.users[userIndex].threshold;
    }

    await product.save();
    const emailContent = generateEmailBody(product, "WELCOME");
    await sendEmail(emailContent, userDoc);

    return res.status(200).json({
      success: true,
      message: "Subscribed to product successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const logProductClick = async (req, res) => {
  const { productId, searchTerm } = req.body;
  const ip = req.ip;

  if (!productId) {
    return res.status(400).json({ error: "productId required" });
  }

  try {
    await prodClickModel.create({
      productId,
      searchTerm,
      ip,
    });

    return res.status(201).json({ message: "Click logged" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getBestDeals = async (req, res) => {
  try {
    const bestDeals = await productModel
      .find({
        lowestPrice: { $gt: 0 },
        averagePrice: { $gt: 0 },
      })
      .select("title brand lowestPrice averagePrice sources")
      .lean();

    const sortedDeals = bestDeals
      .map((product) => {
        const priceDropPercent =
          ((product.averagePrice - product.lowestPrice) /
            product.averagePrice) *
          100;

        return { ...product, priceDropPercent: priceDropPercent.toFixed(1) };
      })
      .filter((p) => p.priceDropPercent > 5)
      .sort((a, b) => b.priceDropPercent - a.priceDropPercent)
      .slice(0, 15);

    if (sortedDeals && !sortedDeals.length) {
      return res
        .status(404)
        .json({ success: false, message: "No best deals found!" });
    }

    res.status(200).json({ success: true, products: sortedDeals });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getTrendingDeals = async (req, res) => {
  try {
    const recentClicksThreshold = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const trendingDeals = await productModel.aggregate([
      {
        $lookup: {
          from: "prodclicks",
          localField: "_id",
          foreignField: "productId",
          as: "clicks",
        },
      },
      {
        $addFields: {
          recentClicks: {
            $filter: {
              input: "$clicks",
              as: "click",
              cond: { $gte: ["$$click.createdAt", recentClicksThreshold] },
            },
          },
        },
      },
      {
        $match: {
          $expr: {
            $or: [
              { $gte: [{ $size: "$users" }, 1] },
              { $gte: [{ $size: "$recentClicks" }, 1] },
            ],
          },
        },
      },
      {
        $project: {
          title: 1,
          brand: 1,
          lowestPrice: 1,
          averagePrice: 1,
          sources: 1,
          clickCount: { $size: "$recentClicks" },
          userCount: { $size: "$users" },
        },
      },
      {
        $sort: {
          clickCount: -1,
          userCount: -1,
        },
      },
      {
        $limit: 15,
      },
    ]);

    if (!trendingDeals.length) {
      return res
        .status(404)
        .json({ success: false, message: "No trending deals found!" });
    }

    return res.status(200).json({ success: true, products: trendingDeals });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
