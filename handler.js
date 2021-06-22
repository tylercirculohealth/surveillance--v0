// const { default: axios } = require('axios');
const { extractListingsFromHTML } = require("./helpers");
const { slackHelper } = require("./slack");

const { differenceWith, isEqual } = require("lodash");
const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient();
const request = require("axios");

// Todo: change to async
// Todo: add AWS SNS
// Todo: add env file to hide x,y,z variable
module.exports.hello = (event, context, callback) => {
  let todaysData, previousData;

  request("http://18.222.127.110/")
    .then(({ data }) => {
      previousData = extractListingsFromHTML(data);

      return dynamo
        .scan({
          TableName: "scannedData",
        })
        .promise();
    })
    .then((response) => {
      let yesterdaysData = response.Items[0] ? response.Items[0].test : [];

      // Use lodash method to deeply compare the old response to the new in Dynamo

      todaysData = differenceWith(previousData, yesterdaysData, isEqual);

      const dataToDelete = response.Items[0]
        ? response.Items[0].listingId
        : null;

      // If the data is the same, delete old and input new

      if (dataToDelete) {
        return dynamo
          .delete({
            TableName: "scannedData",
            Key: {
              listingId: dataToDelete,
            },
          })
          .promise();
      } else return;
    })
    .then(() => {
      return dynamo
        .put({
          TableName: "scannedData",
          Item: {
            listingId: new Date().toString(),
            test: previousData,
          },
        })
        .promise();
    })

    // If retrieved data contains new html, send a msg to the slack channel
    .then(() => {
      if (todaysData.length) {
        slackHelper();
      }
      callback(null, { test: todaysData });
    })
    .catch(callback);
};
