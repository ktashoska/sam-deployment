import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
export const snsClient = new SNSClient({});

/**
 * 
 * This is helper function that publish to SNS topic in case of error in processing.
 */
export const publishToSNS = async (
    message,
    topicArn,
  ) => {

    console.log("SNS", topicArn);
    const response = await snsClient.send(
      new PublishCommand({
        Message: message,
        TopicArn: topicArn,
      }),
    );
    console.log("SNS", response);
  };