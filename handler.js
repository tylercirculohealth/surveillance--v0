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
  console.log("Putting diff " + urlId);
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

const scanUrl = async (url) => {
  console.log("Scanning " + url.href);
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

module.exports.diffCheck = async (event, context, callback) => {
  try {
    const urls = await axios
      .get(process.env.GET_URLS_ENDPOINT)
      .then((res) => res.data.splice(0, 2));
    await Promise.all(
      urls.map(async (url) => {
        await scanUrl(url);
      })
    );
  } catch (err) {
    console.error(err);
  }
};
