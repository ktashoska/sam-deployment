import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { publishToSNS } from './publish_to_sns_topic.mjs';

import {
    EventBridgeClient,
    PutEventsCommand,
  } from "@aws-sdk/client-eventbridge";
  
  const eventClient = new EventBridgeClient({});
  

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

export const handler = async (event, context) => {

    const body = JSON.parse(event.Records[0].body);


    try {
        const object_key = body.Records[0].s3.object.key;
        const temp1 = object_key.split('-');
        const temp2 = temp1[2].split('.');
        const object_id = temp2[0];
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
        const input = { // GetObjectRequest
            Bucket: envVars.S3_Bucket, // required
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
            // return {
            //   success: false,
            //   errorCode: "object_cannot_be_fetched",
            //   objectId: object_id
            // }
          }
        //put an EventBus event
        
        let detail = "";

        if (response.ok) {
    
          detail = {
            "object-id": object_id,
            "status": "uploaded_to_woodwing",
            "upload-endpoint": object_val['Item']['upload-endpoint'],
            "configuration-id": object_val['Item']['configuration-id'],
            "token": object_val['Item']['token']
          };
        }
        else {
          detail = {
            "object-id": object_id,
            "upload-endpoint": object_val['Item']['upload-endpoint'],
            "configuration-id": object_val['Item']['configuration-id'],
            "token": object_val['Item']['token'],
            "details": "object_cannot_be_uploaded_to_woodwing",
            "status": "failed"
          };
        }

    
        await eventClient.send(
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
      

    } catch (error) {
      publishToSNS(error,envVars.SNSTopic);
      throw error;
    }
};