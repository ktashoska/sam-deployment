import {
  EventBridgeClient,
  PutEventsCommand,
} from "@aws-sdk/client-eventbridge";
import { publishToSNS } from './publish_to_sns_topic.mjs';

const client = new EventBridgeClient({});

const envVars = {
  EventBridgeBus: process.env.EVENTBRIDGE_BUS,
  SNSTopic: process.env.TOPIC_ARN
}
export const handler = async (event, context) => {

  try {

    const status = event["success"];
    let detail = "";

    if (status == true) {

      detail = {
        "configuration-id": event['configurationId'],
        "object-id": event['objectId'],
        "upload-endpoint": event['uploadEndpoint'],
        "token": event['token'],
        "status": "uploaded_to_s3"
      };
    }
    else {
      detail = {
        "object-id": event['objectId'],
        "status": "failed",
        "details": event['errorCode'],
        "configuration-id": event['configurationId'],
        "upload-endpoint": event['uploadEndpoint'],
        "token": event['token']
      };
    }

    const response = await client.send(
      new PutEventsCommand({
        Entries: [
          {
            Detail: JSON.stringify(detail),
            DetailType: "update-object-status",
            Resources: [],
            Source: "pixometry.image.processing",
            EventBusName: envVars.EventBridgeBus
          },
        ],
      }),
    );
  }

  catch (error) {
    console.error("Error in event preparation:", error);
    publishToSNS(error,envVars.SNSTopic);
    throw error;
  }
};