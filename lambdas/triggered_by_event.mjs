import { S3Client, CopyObjectCommand } from "@aws-sdk/client-s3";
const client = new S3Client({});

export const handler = async (event, context) => {
    const originalPath = event.detail["original-path"];
    const imageId = event.detail["image-id"];

    // Extracting the source bucket from the original path
    const sourceBucket = originalPath.split("/")[2]; 
    const destinationBucket = 'qonqord-destination-bucket';

    const command = new CopyObjectCommand({
        CopySource: `${sourceBucket}/images/${imageId}`,
        Bucket: destinationBucket,
        Key: `images/${imageId}`,
      });
    
      try {
        const response = await client.send(command);
        console.log(response);
      } catch (err) {
        console.error(err);
      }

};