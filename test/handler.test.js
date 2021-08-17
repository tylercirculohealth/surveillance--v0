var chai = require("chai");
var assert = chai.assert;
const Mock = require("aws-sdk-mock");
var LambdaTester = require("lambda-tester");
const { diffCheck } = require("../handler");
const AWS = require("aws-sdk");

describe("Get URL Test Suite", function () {
  afterEach(() => {
    Mock.restore();
  });
  it("Should return 200 with Appropriate Params", async function () {
    Mock.setSDKInstance(AWS);
    let params = { body: JSON.stringify({ href: "test.com", SecretId: "id" }) };

    Mock.mock("DynamoDB.DocumentClient", "query", (params, callback) => {
      assert.strictEqual(result.statusCode, 200);
      assert.strictEqual(JSON.parse(result.body).href, "test.com");
      console.log("DynamoDB", "query item", "mock called");
      return Promise.reject({ Items: [] });
    });
    Mock.mock("DynamoDB.DocumentClient", "put", (params, callback) => {
      console.log("DynamoDB", "put Item", "mock called");
      return Promise.resolve();
    });
    Mock.mock("SNS", "createTopic", (params, callback) => {
      return Promise.resolve({ TopicArn: "arn" });
    });

    const diff = diffCheck;

    await LambdaTester(diff)
      .event(params)
      .expectResolve((result) => {
        assert.strictEqual(result.statusCode, 200);
        assert.strictEqual(JSON.parse(result.body).href, "test.com");
      });
  });
});
