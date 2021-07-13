const cheerio = require("cheerio");

function extractListingsFromHTML(html) {
  const $ = cheerio.load(html);

  const allData = $("body").html().trim();
  return allData;
}

module.exports = {
  extractListingsFromHTML
};

// Cheerio is the most lightweight way to get our testable data.
// It acts as a jquery selector for whatever HTML we point it to.

// Alternative we could use pupateer,
// which now has a headless package for chromium that can be used on lambda
