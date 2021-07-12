const { extractListingsFromHTML } = require("./helpers");
const { sendSnsMsg } = require("./sns_publishtopic");
const { differenceWith, isEqual } = require("lodash");
const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient();
const request = require("axios");
const { getUrl } = require("./url");

module.exports.hello = async (callback) => {
  let todaysData, previousData;

  const url = await getUrl();

  request(url.href)
    .then(({ data }) => {
      previousData = extractListingsFromHTML(data);

      return dynamo
        .scan({
          TableName: "scannedData"
        })
        .promise();
    })
    .then((response) => {
      let yesterdaysData = response.Items[0] ? response.Items[0].dataDump : [];

      // Use lodash method to deeply compare the old response to the new in Dynamo

      todaysData = differenceWith(previousData, yesterdaysData, isEqual);

      const dataToDelete = response.Items[0] ? response.Items[0].id : null;

      // If the data is the same, delete old and input new
      if (dataToDelete) {
        return dynamo
          .delete({
            TableName: "scannedData",
            Key: {
              id: dataToDelete
            }
          })
          .promise();
      } else return;
    })
    .then(() => {
      return dynamo
        .put({
          TableName: "scannedData",
          Item: {
            id: new Date().toString(),
            dataDump: previousData
            // urlId: //urlId
          }
        })
        .promise();
    })
    // If retrieved data contains new html, publish to SNS => write a msg to SQS => Loop => Whisper
    .then(() => {
      if (todaysData.length) {
        sendSnsMsg();
      }
      callback(null, { dataDump: todaysData });
    })
    .catch(callback);
};
