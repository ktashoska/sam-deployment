import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
const client = new S3Client({});
// packages from layer
import fetch from "node-fetch";
import { publishToSNS } from './publish_to_sns_topic.mjs';


// folder in bucket where files are saved
const UPLOAD_PATH = 'pixometry-finals/';

const envVars = {
  OUT_Bucket: process.env.OUT_BUCKET,
  SNSTopic: process.env.TOPIC_ARN
}

export const handler = async (event, context) => {
  try {
    const url = event.detail["upload-endpoint"];
    const objectId = event.detail["object-id"];
    const ticket = event.detail["ticket"];
    const token = 'Bearer ' + ticket;


    const response = await fetch(url + "/" + objectId, {
      headers: { Authorization: token }
    })
      .catch(() => ({ ok: false }));

    if (!response.ok) {
      return {
        success: false,
        errorCode: "object_cannot_be_fetched",
        objectId: objectId
      }
    }

    const buffer = await response.buffer();
    const key = `${UPLOAD_PATH}pix-${objectId}.jpg`;

    const command = new PutObjectCommand({
      Body: buffer,
      Bucket: envVars.OUT_Bucket,
      Key: key,
    });

    const responseS3 = await client.send(command);
    console.log(responseS3);
    if (!responseS3.ETag) {
      return {
        success: false,
        errorCode: "object_not_uploaded_to_S3",
        objectId: objectId
      }
    } else {
      return {
        success: true,
        errorCode: "",
        objectId: objectId,
        token: token,
        uploadEndpoint: event.detail["upload-endpoint"],
        configurationId: event.detail["configuration-id"]

      }
    }
  } catch (error) {
    publishToSNS(error, envVars.SNSTopic);
    throw error;
  }

};




