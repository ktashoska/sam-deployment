import {
  EventBridgeClient,
  PutEventsCommand,
} from "@aws-sdk/client-eventbridge";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { publishToSNS } from './publish_to_sns_topic.mjs';

const dynamoDBClient = new DynamoDBClient();
const docClient = new DynamoDBDocumentClient(dynamoDBClient);
const client = new EventBridgeClient({});

const envVars = {
  ConfigurationTable: process.env.CONFIGURATION_TABLE_NAME,
  EventBridgeBus: process.env.EVENTBRIDGE_BUS,
  SNSTopic: process.env.TOPIC_ARN
}

/**
 * 
 * When Woodwing iniitate the image processing, is starts with API call
 * where payload is processed to this Lambda function.
 * 
 * The Lambda function, reads configuration from Configuration table based on configuration_id
 * and creates event in EventBridge bus, to strat the image processing.
 */

const putEvents = async (event) => {

  console.log("Woodwing payload: ", event);

  try {

    const body = JSON.parse(event["body"]);
    const commandGet = new GetCommand({
      TableName: envVars.ConfigurationTable,
      Key: {
        'configuration-id': body['configuration-id'],
      },
    });
    const configuration_val = await docClient.send(commandGet);
    const source = configuration_val['Item']['source'];//"woodwing.image.processing";
    const detailType = configuration_val['Item']['action'];//"channel-processing";
    const download_endpoint = configuration_val['Item']['download-endpoint'];
    const upload_endpoint = configuration_val['Item']['upload-endpoint'];
    const channel_id = configuration_val['Item']['channel-id'];
    const schema_id = configuration_val['Item']['schema-id'];

    let event_ids = [];

    for (let i = 0; i < body['object-ids'].length; i++) {
      let detail = {
        "configuration-id": body['configuration-id'],
        "object-id": body['object-ids'][i],
        "download-endpoint": download_endpoint,
        "upload-endpoint": upload_endpoint,
        "ticket": body['ticket'],
        "channel-id": channel_id,
        "schema-id": schema_id
      };

      const response = await client.send(
        new PutEventsCommand({
          Entries: [
            {
              Detail: JSON.stringify(detail),
              DetailType: detailType,
              Resources: [],
              Source: source,
              EventBusName: envVars.EventBridgeBus
            },
          ],
        }),
      );
      event_ids.push({ "EventID": response.Entries[0].EventId });
      console.log("Event", response);
    };
    console.log("Event(s) IDs: ", event_ids);
    return {
      'statusCode': 200,
      'body': event_ids
    };
  } catch (error) {
    console.error("Error in event preparation:", error);
    await publishToSNS(error, envVars.SNSTopic);
    throw error;
  }
};


export const handler = async (event, context) => {
  const result = await putEvents(event);
  return {
    'statusCode': 200,
    'body': JSON.stringify(result)
  };
};

