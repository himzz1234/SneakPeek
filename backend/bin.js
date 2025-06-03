const itemToSearch = "ball";
const latitude = 28.5105288;
const longitude = 77.2297379;

const scrapeZepto = async () => {
  const domain = "www.zeptonow.com";
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: false,
    userDataDir: "./tmp",
  });

  await browser.setCookie(
    {
      name: "latitude",
      value: latitude.toString(),
      domain,
    },
    {
      name: "longitude",
      value: longitude.toString(),
      domain,
    },
    {
      name: "user_position",
      value: JSON.stringify({ latitude, longitude }),
      domain,
    }
  );

  const page = await browser.newPage();

  await page.goto(`https://www.zeptonow.com/search?query=${itemToSearch}`, {
    waitUntil: "networkidle0",
  });

  await page.waitForSelector('a[data-testid="product-card"]');

  while (true) {
    const previousHeight = await page.evaluate(
      () => document.body.scrollHeight
    );

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    try {
      await page.waitForFunction(
        `document.body.scrollHeight > ${previousHeight}`,
        { timeout: 5000, polling: 500 }
      );
    } catch (error) {
      console.log(
        "No new content loaded after 5 seconds. Exiting scroll loop."
      );
      break;
    }

    const newHeight = await page.evaluate(() => document.body.scrollHeight);
    if (newHeight === previousHeight) {
      break;
    }
  }

  const products = await page.$$eval(
    'a[data-testid="product-card"]',
    (cards) => {
      return cards.map((card) => {
        const name =
          card
            .querySelector('[data-testid="product-card-name"]')
            ?.innerText.trim() || null;
        const quantity =
          card
            .querySelector('[data-testid="product-card-quantity"] h4')
            ?.innerText.trim() || null;

        const image =
          card.querySelector('[data-testid="product-card-image"]')?.src || null;
        const discountedPrice =
          card
            .querySelector('[data-testid="product-card-price"]')
            ?.innerText.trim() || null;
        const price =
          card
            .querySelector('[data-testid="product-card-price"]')
            ?.nextElementSibling?.innerText.trim() || null;
        const availability = card.querySelector('[aria-label="Notify"]')
          ? false
          : true;
        const href = card.getAttribute("href") || null;
        return {
          name,
          quantity,
          image,
          price,
          discountedPrice,
          availability,
          href,
        };
      });
    }
  );

  console.log(products);
  await browser.close();
};

const scrapeBigBasket = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: false,
    userDataDir: "./tmp2",
  });

  const rawString = `${latitude}|${longitude}`;
  const encoded = Buffer.from(rawString).toString("base64");
  await browser.setCookie({
    name: "_bb_lat_long",
    value: encoded,
    domain: ".bigbasket.com",
  });

  const page = await browser.newPage();
  await page.goto(`https://www.bigbasket.com/ps/?q=${itemToSearch}&page=1`, {
    waitUntil: "networkidle0",
  });

  await page.evaluate(() => {
    const footer = document.querySelector("footer");
    if (footer) {
      footer.remove();
    }
  });

  await page.waitForSelector("div.eA-dmzP");

  while (true) {
    const scrollHeight = await page.evaluate(() => document.body.scrollHeight);

    await page.evaluate(() => window.scrollBy(0, 600));
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const currentScroll = await page.evaluate(() => window.scrollY);
    const windowHeight = await page.evaluate(() => window.innerHeight);

    if (Math.ceil(currentScroll + windowHeight) >= scrollHeight) {
      try {
        await page.waitForFunction(
          `document.body.scrollHeight > ${scrollHeight}`,
          { timeout: 10000, polling: 500 }
        );
      } catch (error) {
        console.log(
          "No new content loaded after 30 seconds. Exiting scroll loop."
        );
        break;
      }
    }
  }

  const products = await page.$$eval("div.eA-dmzP", (cards) => {
    return cards.map((card) => {
      const brand =
        card.querySelector("h3:nth-child(3) > a > span")?.innerText.trim() ||
        null;
      const title =
        card
          .querySelector("h3:nth-of-type(1) > a > div > h3")
          ?.innerText.trim() || null;

      const name = brand + " " + title;
      const image =
        card.querySelector(":nth-child(1) div:nth-of-type(1) a img")?.src ||
        null;

      const discountedPrice =
        card
          .querySelector(":nth-child(4) span:nth-of-type(1)")
          ?.innerText.trim() || null;

      const price =
        card
          .querySelector(":nth-child(4) span:nth-of-type(2)")
          ?.innerText.trim() || null;

      const quantity =
        card
          .querySelector("h3:nth-child(3) div:last-of-type span:last-of-type")
          ?.innerText.trim() || null;

      const href =
        card.querySelector("a:nth-of-type(1)").getAttribute("href") || null;
      const availability = discountedPrice || price ? true : false;

      return {
        name,
        quantity,
        image,
        price,
        discountedPrice,
        availability,
        href,
      };
    });
  });

  console.log(products);
  await browser.close();
};

const scrapeSwiggyInstamart = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: false,
    userDataDir: "./tmp2",
  });

  await browser.setCookie({
    name: "userLocation",
    value: JSON.stringify({
      lat: latitude,
      lng: longitude,
      address: "",
      annotation: "",
      name: "",
    }),
    domain: "www.swiggy.com",
  });

  const page = await browser.newPage();
  await page.goto(
    `https://www.swiggy.com/instamart/search?custom_back=true&query=${itemToSearch}`,
    {
      waitUntil: "networkidle0",
    }
  );

  await page.waitForSelector('[data-testid="children-wrapper"]');

  await page.evaluate(() => {
    const wrapper = document.querySelector('[data-testid="children-wrapper"]');
    if (wrapper) {
      wrapper.classList.remove("_2_95H");
      wrapper.style.overflow = "auto";
    }
  });

  await page.waitForSelector("div[data-testid='default_container_ux4']");

  while (true) {
    const { scrollTop, scrollHeight, clientHeight } = await page.evaluate(
      () => {
        const wrapper = document.querySelector(
          "[data-testid='children-wrapper']"
        );
        if (!wrapper) return { scrollTop: 0, scrollHeight: 0, clientHeight: 0 };
        return {
          scrollTop: wrapper.scrollTop,
          scrollHeight: wrapper.scrollHeight,
          clientHeight: wrapper.clientHeight,
        };
      }
    );

    if (Math.ceil(scrollTop + clientHeight) < scrollHeight) {
      await page.evaluate(() => {
        const wrapper = document.querySelector(
          "[data-testid='children-wrapper']"
        );
        if (wrapper) {
          wrapper.scrollBy(0, 600);
        }
      });

      await new Promise((resolve) => setTimeout(resolve, 1500));
    } else {
      try {
        await page.waitForFunction(
          `document.querySelector("[data-testid='children-wrapper']").scrollHeight > ${scrollHeight}`,
          { timeout: 10000, polling: 500 }
        );
      } catch {
        console.log("No new content loaded, stopping scroll.");
        break;
      }
    }
  }

  const products = await page.$$eval(
    "div[data-testid='default_container_ux4']",
    (cards) => {
      return cards.map((card) => {
        const image = card.querySelector("div[role='button'] img")?.src || null;
        const name = card.querySelector(".kyEzVU")?.innerText.trim() || null;
        const discountedPrice =
          card
            .querySelector("div[data-testid='itemMRPPrice'] div:nth-child(1)")
            ?.innerText.trim() || null;
        const price =
          card
            .querySelector(
              "div[data-testid='itemMRPPrice'] div[data-testid='itemOfferPrice']"
            )
            ?.innerText.trim() || null;
        const quantity =
          card
            .querySelector("div[data-testid='itemMRPPrice']")
            ?.previousElementSibling?.querySelector("div")
            ?.innerText?.trim() || null;
        const availability = card.querySelector("div[data-testid='sold-out']")
          ? false
          : true;

        return {
          name,
          image,
          discountedPrice,
          price,
          quantity,
          availability,
        };
      });
    }
  );

  console.log(products);
  await browser.close();
};
