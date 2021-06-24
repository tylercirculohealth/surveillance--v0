var AWS = require("aws-sdk");
var sqs = new AWS.SQS({ apiVersion: "2012-11-05" });
AWS.config.update({region: 'us-east-1'});


// Create an SQS service object
function sqsAlert() {
//   const SQS_QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/190089000663/surveillanceAlertMsg";
  var params = {
    DelaySeconds: 0,
    MessageAttributes: {
      Title: {
        DataType: "String",
        StringValue: "New Notification",
      },
    },
    MessageBody: "Surveilence has detected a change on http://18.222.127.110/",

    QueueUrl: "SQS_QUEUE_URL",
  };

  sqs.sendMessage(params, function (err, data) {
    if (err) {
      console.log("Error", err);
    } else {
      console.log("Success", data.MessageId);
    }
  });
}

module.exports = {
  sqsAlert,
};
