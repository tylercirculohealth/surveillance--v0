var AWS = require("aws-sdk");
const sns = new AWS.SNS();

const sendSnsMsg = async (url) => {
  await sns
    .publish({
      Message: JSON.stringify(url),
      TopicArn: url.snsArn
    })
    .promise()
    .then((data) => {
      console.log(`MessageId ${data.MessageId} sent`);
    })
    .catch((err) => {
      console.error(err, err.stack);
    });
};

module.exports = {
  sendSnsMsg
};
