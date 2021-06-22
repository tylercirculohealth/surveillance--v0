const cheerio = require('cheerio');

function extractListingsFromHTML (html) {  

    const $ = cheerio.load(html)
      
    const allData = $('main').html()
    const newData = []
    newData.push({allData})
    console.log(newData)
    return newData
}

module.exports = {
  extractListingsFromHTML
};