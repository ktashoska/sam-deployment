import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { publishToSNS } from './publish_to_sns_topic.mjs';

import fetch from "node-fetch";

const dynamoDBClient = new DynamoDBClient();
const docClient = new DynamoDBDocumentClient(dynamoDBClient);
const s3client = new S3Client({});

const envVars = {
  ObjectOverviewTable: process.env.OBJECT_OVERVIEW_TABLE_NAME,
  EventBridgeBus: process.env.EVENTBRIDGE_BUS,
  S3_Bucket: process.env.OUT_BUCKET,
  SNSTopic: process.env.TOPIC_ARN
}

/**
 * 
 * When Pixometry place object in OUT bucket, an event on Object create is generated in Default EventBridge bus.
 * On that event, an Step function (state machine) is initiated. First step of the StepFunction is uploading the object
 * to Woodwing.
 * 
 * Based on object id, the object record is read from DynamoDB table and upload URL and token are known.
 * Output of this function is payload for the event.
 */

export const handler = async (event, context) => {
  console.log("Upload object to woodwing: ", event);
  try {
    const object_key = event.detail.object.key;
    const temp1 = object_key.split('-');
    const temp2 = temp1[2].split('.');
    const object_id = temp2[0];
    //Get object record from status table by object-id
    const commandGet = new GetCommand({
      TableName: envVars.ObjectOverviewTable,
      Key: {
        'object-id': object_id,
      },
    });
    const object_val = await docClient.send(commandGet);

    let upload_url = object_val['Item']['upload-endpoint']
    let token = object_val['Item']['token']
    let configuration_id = object_val['Item']['configuration-id']

    //Read data from S3
    const input = {
      Bucket: envVars.S3_Bucket,
      Key: object_key
    };

    const command = new GetObjectCommand(input);
    const S3Response = await s3client.send(command);

    console.log(S3Response.Body);

    //UPLOAD to Woodwing studio
    const response = await fetch(upload_url + "/", {
      method: 'post',
      body: S3Response.Body,
      headers: { Authorization: token, 'content-type': 'image/jpeg' }
    })
      .catch(() => ({ ok: false }));

    if (!response.ok) {
      console.log(response);
      return {
        success: false,
        status: "error_uploading_to_woodwing",
        objectId: object_id,
        token: token,
        uploadEndpoint: upload_url,
        configurationId: configuration_id,
        source: "woodwing.image.upload",
        eventOrg: event
      }
    } else {
      return {
        success: true,
        status: "success",
        objectId: object_id,
        token: token,
        uploadEndpoint: upload_url,
        configurationId: configuration_id,
        source: "woodwing.image.upload",
        eventOrg: event
      }
    }
  } catch (error) {
    console.log("Error in upload object to woodwing:", error);
    await publishToSNS(error, envVars.SNSTopic);
    throw error;
  }
};