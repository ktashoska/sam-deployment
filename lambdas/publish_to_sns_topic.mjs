import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
export const snsClient = new SNSClient({});

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