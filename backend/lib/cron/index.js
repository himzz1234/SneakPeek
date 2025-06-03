import cron from "node-cron";
import scrapedQueriesModel from "../../models/scrapedQueries.model.js";
import {
  scrapeLimitedEdition,
  scrapeSuperkicks,
  scrapeVegNonVeg,
} from "../../utils/actions/index.js";
import { saveProducts } from "../../services/product.service.js";

cron.schedule("0 0,12 * * *", async () => {
  try {
    const queries = await scrapedQueriesModel.find({});

    for (const query of queries) {
      try {
        const results = await Promise.all([
          scrapeVegNonVeg(query.searchTerm),
          scrapeSuperkicks(query.searchTerm),
          scrapeLimitedEdition(query.searchTerm),
        ]);

        await saveProducts(results, query.searchTerm);
      } catch (error) {
        console.error(`Error processing query for ${query.searchTerm}:`, error);
      }
    }
  } catch (error) {
    console.error("Error fetching queries from the database:", error);
  }
});
