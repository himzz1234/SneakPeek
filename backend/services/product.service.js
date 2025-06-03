import stringSimilarity from "string-similarity";
import productModel from "../models/product.model.js";
import { generateEmailBody, sendEmail } from "../lib/sendgrid/index.js";

const normalizeProducts = async (results) => {
  const normalizeBrand = (text) => {
    return text
      .toLowerCase()
      .replace(/\bjordan brand\b/g, "jordan")
      .replace(/\badidas originals\b/g, "adidas")
      .trim();
  };

  const normalizeTitle = (text) => {
    return text
      .toLowerCase()
      .replace(/\b(w|wmn|wmn's|wmns)\b/g, "women")
      .replace(/\bshoes\b/g, "")
      .trim();
  };

  const normalizeColorway = (colorway) => {
    if (!colorway) return "";
    return colorway
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const tokenizeColorway = (colorway) => {
    return normalizeColorway(colorway).split(" ");
  };

  const isColorwayMatch = (colorway1, colorway2) => {
    const tokens1 = tokenizeColorway(colorway1);
    const tokens2 = tokenizeColorway(colorway2);

    const [smaller, larger] =
      tokens1.length < tokens2.length ? [tokens1, tokens2] : [tokens2, tokens1];

    const isSubset = smaller.every((token) => larger.includes(token));
    if (isSubset) {
      return true;
    }

    const similarity = stringSimilarity.compareTwoStrings(colorway1, colorway2);
    return similarity >= 0.7;
  };

  const groups = [];

  for (const sourceData of results) {
    const name = sourceData.source;
    const products = sourceData.products || [];

    for (const product of products) {
      const { colorway, title, brand } = product;

      const normalizedTitle = normalizeTitle(title);
      const normalizedBrand = normalizeBrand(brand);

      const existingGroup = groups.find(
        (group) =>
          isColorwayMatch(group.colorway, colorway) &&
          normalizeTitle(group.title) === normalizedTitle &&
          normalizeBrand(group.brand) === normalizedBrand
      );

      if (existingGroup) {
        const sourceExists = existingGroup.sources.some((s) => s.name === name);

        if (!sourceExists) {
          existingGroup.sources.push({
            name,
            currentPrice: product.currentPrice,
            originalPrice: product.originalPrice,
            image: product.image,
            link: product.link,
          });
        }
      } else {
        groups.push({
          title,
          brand: normalizedBrand,
          colorway,
          sources: [
            {
              name,
              currentPrice: product.currentPrice,
              originalPrice: product.originalPrice,
              image: product.image,
              link: product.link,
            },
          ],
        });
      }
    }
  }

  return groups;
};

export const saveProducts = async (products, query) => {
  if (!products || products.length <= 0) return;

  const normalizedProducts = await normalizeProducts(products);
  const formattedProducts = normalizedProducts.map((product) => {
    const prices = product.sources.map((source) => source.currentPrice);

    const getWords = (text) =>
      text
        .toLowerCase()
        .replace(/[^a-z0-9]/g, " ")
        .trim()
        .split(/\s+/);

    const searchTermWords = getWords(query);
    const titleWords = getWords(product.title);
    const brandName = product.brand;
    const defaultTags = ["shoes", "sneakers", "footwear", "kicks"];

    return {
      brand: brandName,
      title: product.title,
      colorway: product.colorway.toLowerCase().replace(/[^a-z0-9]/g, ""),
      tags: [
        ...new Set([
          brandName,
          ...titleWords,
          ...searchTermWords,
          ...defaultTags,
        ]),
      ],
      sources: product.sources.map((source) => ({
        ...source,
        priceHistory: [{ price: source.currentPrice, date: Date.now() }],
      })),
      lowestPrice: Math.min(...prices),
      highestPrice: Math.max(...prices),
      averagePrice:
        prices.length > 0
          ? Number(
              (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2)
            )
          : 0,
    };
  });

  try {
    const results = [];

    for (const product of formattedProducts) {
      let doc = await productModel.findOne({
        brand: product.brand,
        title: product.title,
        colorway: product.colorway,
      });

      if (doc) {
        if (product.lowestPrice < doc.lowestPrice) {
          const emailTasks = [];

          for (const user of doc.users) {
            const priceDropEmail = generateEmailBody(product, "LOWEST_PRICE");
            emailTasks.push(sendEmail(priceDropEmail, user));

            if (user.threshold > 0 && product.lowestPrice <= user.threshold) {
              const thresholdEmail = generateEmailBody(
                product,
                "THRESHOLD_MET"
              );

              emailTasks.push(sendEmail(thresholdEmail, user));
            }
          }

          await Promise.all(emailTasks);
        }

        doc.tags = product.tags;
        doc.lowestPrice = product.lowestPrice;
        doc.highestPrice = product.highestPrice;
        doc.averagePrice = product.averagePrice;

        product.sources.forEach((newSource) => {
          const existingSource = doc.sources.find(
            (source) => source.name === newSource.name
          );

          if (existingSource) {
            existingSource.currentPrice = newSource.currentPrice;
            existingSource.priceHistory.unshift({
              date: new Date(),
              price: newSource.currentPrice,
            });
          } else {
            doc.sources.push(newSource);
          }
        });

        const updatedDoc = await doc.save();
        results.push(updatedDoc);
      } else {
        const newDoc = await productModel.create({
          brand: product.brand,
          title: product.title,
          colorway: product.colorway,
          tags: product.tags,
          lowestPrice: product.lowestPrice,
          highestPrice: product.highestPrice,
          averagePrice: product.averagePrice,
          sources: product.sources,
        });
        results.push(newDoc);
      }
    }

    return results;
  } catch (error) {
    console.error("Error processing products:", error);
    throw error;
  }
};
