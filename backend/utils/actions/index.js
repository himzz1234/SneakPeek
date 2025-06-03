import axios from "axios";
import * as cheerio from "cheerio";
import puppeteer from "puppeteer";

async function autoScroll(page) {
  const scrollHeight = await page.evaluate(() => document.body.scrollHeight);

  await page.evaluate(() => window.scrollBy(0, 600));
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const currentScroll = await page.evaluate(() => window.scrollY);
  const windowHeight = await page.evaluate(() => window.innerHeight);

  if (Math.ceil(currentScroll + windowHeight) >= scrollHeight) {
    try {
      await page.waitForFunction(
        `document.body.scrollHeight > ${scrollHeight}`,
        { timeout: 2000, polling: 500 }
      );
    } catch (error) {
      console.log(
        "No new content loaded after 30 seconds. Exiting scroll loop."
      );
      return true;
    }
  }
}

export const scrapeNike = async (searchQuery) => {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: false,
  });
  const page = await browser.newPage();

  const url = `https://www.nike.com/in/w?q=${searchQuery}`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 0 });

  let products = new Set();
  while (true) {
    try {
      await page.waitForSelector(".product-card__hero-image", {
        timeout: 2000,
      });
    } catch (error) {
      break;
    }

    const newProducts = await page.evaluate(() => {
      return Array.from(document.querySelectorAll(".product-card")).map(
        (card) => ({
          title:
            card.querySelector(".product-card__title").innerText.trim() || null,
          subtitle:
            card.querySelector(".product-card__subtitle").innerText.trim() ||
            null,
          currentPrice:
            card
              .querySelector(".product-price.is--current-price")
              ?.innerText.trim() || null,
          originalPrice:
            card
              ?.querySelector(".product-price.is--striked-out")
              ?.innerText.trim() ||
            card
              .querySelector(".product-price.is--current-price")
              ?.innerText.trim() ||
            null,
          image: card.querySelector(".product-card__hero-image")?.src || null,
          link:
            card.querySelector(".product-card__img-link-overlay")?.href || null,
        })
      );
    });

    newProducts.forEach((p) => products.add(JSON.stringify(p)));
    if (await autoScroll(page)) break;
  }

  await browser.close();
  return {
    source: "Nike",
    products: Array.from(products).map((p) => JSON.parse(p)),
  };
};

export const scrapeAdidas = async (searchQuery) => {
  const products = [];
  let currentStart = 0;

  const filters = "trainers|cribs|sandals";
  const encodedfilters = encodeURI(filters);

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36",
  };

  while (true) {
    const url = `https://www.adidas.co.in/search?q=${searchQuery}&start=${currentStart}&producttype_en_in=${encodedfilters}`;

    try {
      const response = await axios.get(url, { headers });
      const $ = cheerio.load(response.data);

      const pageProducts = [];

      $("[data-testid='plp-product-card']").each((_, card) => {
        const title =
          $(card).find("[data-testid='product-card-title']").text().trim() ||
          null;
        const subtitle =
          $(card).find("[data-testid='product-card-subtitle']").text().trim() ||
          null;
        const currentPrice =
          $(card).find("[data-testid='primary-price']").text().trim() || null;
        const originalPrice =
          $(card).find(".gl-price-item.gl-price-item--crossed").text().trim() ||
          currentPrice ||
          null;
        const image =
          $(card)
            .find("[data-testid='product-card-primary-image']")
            .attr("src") || null;
        const link =
          $(card)
            .find("[data-testid='product-card-image-link']")
            .attr("href") || null;

        pageProducts.push({
          title,
          subtitle,
          currentPrice,
          originalPrice,
          image,
          link,
        });
      });

      if (pageProducts.length === 0) {
        break;
      }

      products.push(...pageProducts);
      currentStart += pageProducts.length;
    } catch (error) {
      break;
    }
  }

  return { source: "Adidas", products };
};

export const scrapePuma = async (searchQuery) => {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: false,
  });
  const page = await browser.newPage();

  const url = `https://in.puma.com/in/en/search?pref_productDivision=Footwear&q=${searchQuery}`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 0 });

  let products = new Set();
  while (true) {
    const newProducts = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll("[data-test-id='product-list-item']")
      ).map((card) => ({
        title: card.querySelector("h3").innerText.trim() || null,
        subtitle: null,
        currentPrice:
          card.querySelector("[data-test-id='sale-price']")?.innerText.trim() ||
          null,
        originalPrice:
          card.querySelector("[data-test-id='price']")?.innerText.trim() ||
          card
            .querySelector(".product-price.is--current-price")
            ?.innerText.trim() ||
          card.querySelector("[data-test-id='sale-price']")?.innerText.trim() ||
          null,
        image: card.querySelector("div img")?.src || null,
        link:
          card.querySelector("[data-test-id='product-list-item-link']")?.href ||
          null,
      }));
    });

    newProducts.forEach((p) => products.add(JSON.stringify(p)));
    if (await autoScroll(page)) break;
  }

  await browser.close();
  return {
    source: "Puma",
    products: Array.from(products).map((p) => JSON.parse(p)),
  };
};

export const scrapeVegNonVeg = async (searchQuery) => {
  const products = [];
  let currentPage = 1;

  while (true) {
    const pageProducts = [];
    const response = await axios.get(
      `https://www.vegnonveg.com/search?q=${searchQuery}&category[]=Footwear&page=${currentPage}`
    );

    const $ = cheerio.load(response.data);
    $(".product").each((_, card) => {
      const brand =
        $(card)
          .find(".info div p:first-of-type")
          .text()
          .replace(/\s+/g, " ")
          .trim() || null;
      const title =
        $(card).find(".p-name").text().replace(/\s+/g, " ").trim() || null;

      const subtitle = null;
      const currentPrice = $(card)
        .find(".info div p:last-of-type span:last-of-type")
        .text()
        .replace(/[^\d.]/g, "")
        .trim();

      const originalPrice = $(card)
        .find(".info div p:last-of-type span:first-of-type")
        .text()
        .replace(/[^\d.]/g, "")
        .trim();

      const image =
        $(card).find(".img-switch .img-normal").attr("data-src") || null;
      const link = $(card).find(".gt-product-click").attr("href") || null;

      let colorway = "";
      if (link) {
        const slugPart = link.split("/products/")[1] || "";

        const clean = (str) =>
          str
            .trim()
            .toLowerCase()
            .replace(/['"]/g, "")
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");

        const brandSlug = clean(brand);
        const fullTitleSlug = clean(title);
        const titleWithoutBrand = title
          .replace(new RegExp(brand, "i"), "")
          .trim();

        const partialTitleSlug = clean(titleWithoutBrand);

        let cleanedSlug = slugPart;
        if (cleanedSlug.includes(fullTitleSlug)) {
          cleanedSlug = cleanedSlug.replace(fullTitleSlug, "");
        } else if (cleanedSlug.includes(partialTitleSlug)) {
          cleanedSlug = cleanedSlug.replace(partialTitleSlug, "");
        }

        cleanedSlug = cleanedSlug.replace(brandSlug, "");
        cleanedSlug = cleanedSlug.replace(/^-+|-+$/g, "");
        colorway = cleanedSlug.replace(/-/g, " ").trim();
      }

      pageProducts.push({
        brand,
        title,
        subtitle,
        currentPrice: parseFloat(currentPrice),
        originalPrice: parseFloat(originalPrice),
        image,
        colorway,
        link,
      });
    });

    if (pageProducts.length === 0) {
      break;
    }

    products.push(...pageProducts);
    currentPage += 1;
  }

  return { source: "VegNonVeg", products };
};

export const scrapeVegNonVegDetails = async (url) => {
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);

  const description =
    $(".product-info .description p").text().replace(/\s+/g, " ").trim() ||
    null;

  const specs = [];
  $(".product-info .description ul li").each((_, element) => {
    const text = $(element).text().replace(/\s+/g, " ").trim();
    if (text) specs.push(text);
  });

  const images = [];
  $(".slider .product-image-container").each((index, element) => {
    const image =
      $(element).find("img").attr("data-lazy") ||
      $(element).find("img").attr("src");

    if (image) images.push(image.trim());
  });

  return {
    description: description || null,
    specs: specs.length ? specs : null,
    images: images.length ? images : null,
  };
};

export const scrapeSuperkicks = async (searchQuery) => {
  const products = [];
  let currentPage = 1;

  while (true) {
    try {
      const response = await axios.post(
        "https://patwlgvpr7emf4lg3h347z8i-fast.searchtap.net/v2",
        {
          query: searchQuery,
          fields: [
            "vendor",
            "price",
            "discounted_price",
            "image",
            "title",
            "new_title",
            "secondary_title",
            "handle",
          ],
          skip: (currentPage - 1) * 24,
          count: 24,
          textFacets: [
            "collections",
            "product_type",
            "shoe_size_(uk)",
            "vendor",
            "apparel_size",
            "st_gender",
            "st_franchise_filter",
            "st_color",
          ],
          filter: "isSearchable = 1 AND discounted_price > 0 AND isActive = 1",
          sort: ["-created_at"],
          collection: "QFYKYABG5WAII1GYYV6IUW7Q",
          textFacetFilters: {
            product_type: [
              "basketball sneakers",
              "iconic classics sneakers",
              "lifestyle sneakers",
              "slides",
            ],
          },
        },
        {
          headers: {
            accept: "application/json, text/plain, */*",
            authorization: "Bearer 4PURAPVJK51Q3Z758LRZBUGX",
            "content-type": "application/json",
            Referer: "https://www.superkicks.in/",
          },
        }
      );

      const apiProducts = response.data.results || [];
      if (apiProducts.length === 0) {
        break;
      }

      const pageProducts = apiProducts.map((item) => {
        let title = item.new_title || "";
        let extractedColorway = "";

        const match = title.match(/['"]([^'"]+)['"]/);
        if (match) {
          extractedColorway = match[1];
          title = title.replace(match[0], "").trim();
        }

        const colorway = (item.secondary_title || extractedColorway || "")
          .toLowerCase()
          .replace(/\//g, " ")
          .replace(/-/g, " ");

        return {
          brand: item.vendor,
          title: title || null,
          subtitle: null,
          currentPrice: item.discounted_price || null,
          originalPrice: item.price || null,
          image: item.image?.src || null,
          colorway,
          link: `https://www.superkicks.in/products/${item.handle}`,
        };
      });

      products.push(...pageProducts);
      currentPage += 1;
    } catch (error) {
      break;
    }
  }

  return { source: "SuperKicks", products };
};

export const scrapeSuperkicksDetails = async (url) => {
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);

  const description = $(".product__description p span")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean)
    .join(" ");

  const specs = [];
  $(".product__description ul li").map((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text) specs.push(text);
  });

  const images = [];
  $(".product__media-list .product__media-item").each((index, element) => {
    const image = $(element).find("img").attr("src");
    if (image) images.push(`https:${image.trim()}`);
  });

  return {
    description: description || null,
    specs: specs.length ? specs : null,
    images: images.length ? images : null,
  };
};

export const scrapeLimitedEdition = async (searchQuery) => {
  const products = [];
  let currentPage = 1;

  while (true) {
    const response = await axios.get(
      `https://services.mybcapps.com/bc-sf-filter/search?shop=limitededt-india.myshopify.com&q=${searchQuery}&page=${currentPage}&limit=48&sort=relevance&product_type=Footwear`
    );

    const apiProducts = response.data.products || [];
    if (apiProducts.length === 0) {
      break;
    }

    const pageProducts = apiProducts.map((product) => {
      const titleStr = product.title.trim() || "";
      const colorwayMatch = titleStr.match(/'([^']+)'$/);
      const colorway = colorwayMatch ? colorwayMatch[1] : "";

      return {
        brand: product.vendor.trim() || null,
        title:
          product.title.replace(/\s*['"][^'"]+['"]\s*$/, "").trim() || null,
        subtitle: null,
        currentPrice: product.price_min || null,
        originalPrice:
          product.compare_at_price_max || product.price_min || null,
        image: Object.values(product.images)[0] || null,
        link: `https://limitededt.in/products/${product.handle}`,
        colorway: colorway,
      };
    });

    products.push(...pageProducts);
    currentPage += 1;
  }

  return { source: "Limited Edition", products };
};

export const scrapeLimitedEditionDetails = async (url) => {
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);

  let lines = [];

  const htmlContent = $(
    'div[data-block-type="description"] .accordion__content'
  ).html();
  if (htmlContent) {
    lines = htmlContent
      .split(/<br\s*\/?>/i)
      .map((line) => $("<div>").html(line).text().trim())
      .filter(Boolean);
  } else {
    lines = $('div[data-block-type="description"] p')
      .map((_, p) => $(p).text().trim())
      .get();
  }

  const description = (
    lines[0].replace(
      /^(Description|Details|Product Details|Product Story)\s*/i,
      ""
    ) +
    " " +
    (lines[1] || "")
  ).trim();
  const specs = lines.slice(2);

  const images = [];
  $(".product-gallery__carousel .product-gallery__media").each(
    (index, element) => {
      const image = $(element).find("img").attr("src");
      if (image) images.push(`https:${image.trim()}`);
    }
  );

  return {
    description: description || null,
    specs: specs.length ? specs : null,
    images: images.length ? images : null,
  };
};
