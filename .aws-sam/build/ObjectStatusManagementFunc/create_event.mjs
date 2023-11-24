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

    console.log("Create event:", event);
  

    const status = event["success"];
    const source = event["source"];
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
    try {
    const response = await client.send(
      new PutEventsCommand({
        Entries: [
          {
            Detail: JSON.stringify(detail),
            DetailType: "update-object-status",
            Resources: [],
            Source: source,
            EventBusName: envVars.EventBridgeBus
          },
        ],
      }),
    );
    console.log("Event created : ", response.Entries[0].EventId + " for source " + source);
  }

  catch (error) {
    console.error("Error in create event:", error);
    publishToSNS(error,envVars.SNSTopic);
    throw error;
  }
};