var AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

function sendSnsMsg(){
var params = {
  Message: 'Alert: New changes to URL', /* required */
  TopicArn: 'arn:aws:sns:us-east-1:100758510109:fridayDemo'
};

// Create promise and SNS service object
var publishTextPromise = new AWS.SNS({apiVersion: '2010-03-31'}).publish(params).promise();

// Handle promise's fulfilled/rejected states
publishTextPromise.then(
  function(data) {
    console.log(`Message ${params.Message} sent to the topic ${params.TopicArn}`);
    console.log("MessageID is " + data.MessageId);
  }).catch(
    function(err) {
    console.error(err, err.stack);
  });
}

module.exports = {
    sendSnsMsg,
};