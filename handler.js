const { extractListingsFromHTML } = require("./helpers");
const { sendSnsMsg } = require("./sns_publishtopic");
const { differenceWith, isEqual } = require("lodash");
const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient();
const axios = require("axios");
const DIFF_TABLE = process.env.DIFF_TABLE;
const LATEST_REVISION_INDEX = process.env.LATEST_REVISION_INDEX;

const getMostRecentDiff = async (url) => {
  return await dynamo
    .query({
      TableName: DIFF_TABLE,
      IndexName: LATEST_REVISION_INDEX,
      Limit: 1,
      KeyConditionExpression: "urlId = :urlId and latest = :latest",
      ExpressionAttributeValues: {
        ":urlId": url.id,
        ":latest": "true"
      }
    })
    .promise()
    .then((data) => data.Items[0]);
};

const updateUrlDiff = async (url, mostRecentDiff, content, diff) => {
  await dynamo
    .update({
      TableName: DIFF_TABLE,
      Key: {
        urlId: mostRecentDiff.urlId,
        version: mostRecentDiff.version
      },
      UpdateExpression: "set latest = :latest",
      ExpressionAttributeValues: {
        ":latest": "false"
      }
    })
    .promise();

  await putLatestDiff(url.id, content, mostRecentDiff.version + 1, diff);
};

const putLatestDiff = async (urlId, content, version = 1, diff = null) => {
  await dynamo
    .put({
      TableName: DIFF_TABLE,
      Item: {
        date: new Date().toISOString(),
        urlId,
        version,
        content,
        diff,
        latest: "true"
      }
    })
    .promise();
};

const getUrl = async () => {
  const urls = await axios
    .get("https://2t30hb5e29.execute-api.us-east-1.amazonaws.com/dev/urls")
    .then((res) => res.data);

  // for now just return one url for testing
  return urls[0];
};

const scanUrl = async (url) => {
  const urlContent = await axios(url.href).then(({ data }) =>
    extractListingsFromHTML(data)
  );
  const latestForUrl = await getMostRecentDiff(url);

  if (latestForUrl) {
    const diff = differenceWith([urlContent], [latestForUrl.content], isEqual);
    if (diff.length) {
      await updateUrlDiff(url, latestForUrl, urlContent, diff[0]);
      // If retrieved data contains new html, publish to SNS => write a msg to SQS => Loop => Whisper
      await sendSnsMsg(url);
    }
  } else {
    await putLatestDiff(url.id, urlContent);
  }
};

module.exports.hello = async (event, context, callback) => {
  const url = await getUrl();
  await scanUrl(url);
};
