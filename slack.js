require('dotenv').config();

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const slack = require("slack-notify")(SLACK_WEBHOOK_URL);

function slackHelper() {
  slack.alert(
    `There has been a change to your monitored website, please visit http://18.222.127.110/ to view these changes. `,
    function (err) {
      if (err) {
        console.log("Slack API error:", err);
      } else {
        console.log("Message received in slack!");
      }
    }
  );
}

module.exports = {
  slackHelper,
};

// This is ugly. Probably wont live here for long regardless. 