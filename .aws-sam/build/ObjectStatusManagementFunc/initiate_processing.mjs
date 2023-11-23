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

const putEvents = async (event) => {

  try {

    const body = JSON.parse(event["body"]);
    const commandGet = new GetCommand({
      TableName: envVars.ConfigurationTable,
      Key: {
        'configuration-id': body['configuration-id'],
      },
    });
    const configuration_val = await docClient.send(commandGet);
    let source = configuration_val['Item']['source']//"woodwing.image.processing";
    let detailType = configuration_val['Item']['action']//"channel-processing";

    let event_ids = [];

    for (let i = 0; i < body['object-ids'].length; i++) {
      let detail = {
        "configuration-id": body['configuration-id'],
        "object-id": body['object-ids'][i],
        "download-endpoint": body['download-endpoint'],
        "upload-endpoint": body['upload-endpoint'],
        "ticket": body['ticket'],
        "channel-id": configuration_val['Item']['channel-id'],
        "schema-id": configuration_val['Item']['schema-id']
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
    };

    return {
      'statusCode': 200,
      'body': event_ids
    };
  } catch (error) {
    console.error("Error in event preparation:", error);
    publishToSNS(error,envVars.SNSTopic);
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

