import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
const client = new S3Client({});
// packages from layer
import fetch from "node-fetch";
import imageType from "image-type";

// folder in bucket where files are saved
const UPLOAD_PATH = 'pixometry/';
// max allowed image size
const MAX_FILE_SIZE = 1024 * 1024 * 12; // 12MB
// allowed image file types
const ALLOWED_TYPES = ['jpg', 'png', 'bmp'];

const envVars = {
  IN_Bucket: process.env.IN_BUCKET
}

export const handler = async (event, context) => {

  const url = event.detail["download-endpoint"];
  const objectId = event.detail["object-id"];
  const ticket = event.detail["ticket"];
  const token = 'Bearer ' + ticket;


  const response = await fetch(url + "/" + objectId, {
    // method: 'get',
    // body: JSON.stringify(body),
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

  // if (buffer.byteLength > MAX_FILE_SIZE) {
  //   return {
  //     success: false,
  //     errorCode: "object_too_big",
  //     objectId: objectId
  //   }
  // }

  // const type = imageType(buffer);

  // if (!type) {
  //   return {
  //     success: false,
  //     errorCode: "object_is_not_image",
  //     objectId: objectId
  //   }
  // }

  // if (!ALLOWED_TYPES.includes(type.ext)) {
  //   return {
  //     success: false,
  //     errorCode: "object_type_is_not_supported",
  //     objectId: objectId
  //   }
  // }

  //const key = `${UPLOAD_PATH}${objectId}.${type.ext}`;
  const key = `${UPLOAD_PATH}${objectId}.jpg`;


  const command = new PutObjectCommand({
    Body: buffer,
    Bucket: envVars.IN_Bucket,
    Key: key,
  });

  try {
    const response = await client.send(command);
    if (!response.ETag) {
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
  } catch (err) {
    return {
      success: false,
      errorCode: "Error" + err,
      objectId: objectId
    }
  }

};




