import {
  EventBridgeClient,
  PutEventsCommand,
} from "@aws-sdk/client-eventbridge";

import { DynamoDBDocumentClient, GetCommand} from "@aws-sdk/lib-dynamodb";

const dynamoDBClient = new DynamoDBClient();
const docClient = new DynamoDBDocumentClient(dynamoDBClient);

const envVars = {
  ConfigurationTable: process.env.CONFIGURATION_TABLE_NAME

}

export const putEvents = async (
 event

) => {
  const client = new EventBridgeClient({});

  const commandGet = new GetCommand({
    TableName: envVars.ConfigurationTable,
    Key: {
        'configuration-id': body['configuration-id'],
    },
});

const configuration_val = await docClient.send(commandGet);

  let source = "woodwing.image.processing";
  let detailType = "channel-processing";
  
  for(let i=0;i<body['object-ids'].length;i++)
  {
    let detail = { 
    "configuration-id": body['configuration-id'],
    "object-id": body['object-ids'][i],
    "original-path": "s3://qonqord-source-bucket/images/",
    "channel-id": configuration_val['channel-id'],
    "schema-id": configuration_val['schema-id']
    };

    const response = await client.send(
      new PutEventsCommand({
        Entries: [
          {
            Detail: JSON.stringify(detail),
            DetailType: detailType,
            Resources: [],
            Source: source,
            EventBusName: process.env.EVENTBRIDGE_BUS
          },
        ],
      }),
    );

    console.log("PutEvents response:");
    console.log(response);
    };

    return {
        'statusCode': 200,
        'body': JSON.stringify("Events sucesfully created!")
  };
};


export const handler = async (event, context) => {
  const result = await putEvents(event);
  return {
      'statusCode': 200,
      'body': JSON.stringify(result)
  };
};

