const axios = require("axios");

module.exports.getUrl = async () => {
  const urls = await axios
    .get("https://2t30hb5e29.execute-api.us-east-1.amazonaws.com/dev/urls")
    .then((res) => res.data);

  // for now just return one url for testing
  return urls[0];
};
