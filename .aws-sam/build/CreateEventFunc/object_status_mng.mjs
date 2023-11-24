import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { publishToSNS } from './publish_to_sns_topic.mjs';

const dynamoDBClient = new DynamoDBClient();
const docClient = new DynamoDBDocumentClient(dynamoDBClient);
  
  const envVars = {
    DynamoDBTable: process.env.OBJECT_TABLE_NAME,
    SNSTopic: process.env.TOPIC_ARN
  }
  export const handler = async (event, context) => {

    console.log("Object status tracking: ", event);
    try {
      const body = event["detail"];
      const status = body["status"];
      let detail = "";
  
      if (status != "failed") {
  
        detail = {
          "configuration-id": body['configuration-id'],
          "object-id": body['object-id'],
          "upload-endpoint": body['upload-endpoint'],
          "token": body['token'],
          "status": "uploaded_to_s3"
        };
      }
      else {
        detail = {
          "object-id": body['object-id'],
          "configuration-id": body['configuration-id'],
          "upload-endpoint": body['upload-endpoint'],
          "token": body['token'],
          "status": "failed",
          "details": body['details']
        };
      }
  
      const response = await docClient.send(
        new PutCommand({
          TableName: envVars.DynamoDBTable,
          Item: detail,
        })
      );
    }
  
    catch (error) {
      console.error("Error in DynamoDB object insert:", error);
      publishToSNS(error, envVars.SNSTopic);
      throw error;
    }
  };