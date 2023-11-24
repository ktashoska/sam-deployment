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
/**
 * 
 * Function that is triggered by an EventBridge bus event and makes a call to Pixometry API, 
 * sending information for image processing.
 * As a result, processed image is placed in OUT S3 bucket.
 */

export const handler = async (event, context) => {

  console.log("Prepare pixometry call: ", event);

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

  const buffer = await response.arrayBuffer();
  const key = `${UPLOAD_PATH}pix-${objectId}.jpg`;

  const command = new PutObjectCommand({
    Body: buffer,
    Bucket: envVars.OUT_Bucket,
    Key: key,
  });
  try {
    const responseS3 = await client.send(command);
    console.log("S3 event: ", responseS3);

  } catch (error) {
    console.log("Error in pixometry call: ", error);
    await publishToSNS(error, envVars.SNSTopic);
    throw error;
  }

};




