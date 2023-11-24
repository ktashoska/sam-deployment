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
/**
 * 
 * This function creates event for tracking image processing status.
 * Event is created in EventBridge bus.
 */
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
        "status": event['status'],
        "details": event['status'],
        "event": event['eventOrg']
      };
    }
    else {
      detail = {
        "object-id": event['objectId'],
        "status": "failed",
        "details": event['status'],
        "configuration-id": event['configurationId'],
        "upload-endpoint": event['uploadEndpoint'],
        "token": event['token'],
        "event": event['eventOrg']
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
    await publishToSNS(error,envVars.SNSTopic);
    throw error;
  }
};