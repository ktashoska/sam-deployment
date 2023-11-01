import {
    EventBridgeClient,
    PutEventsCommand,
  } from "@aws-sdk/client-eventbridge";
  
  export const putEvents = async (
    source = "woodwing.image.processing",
    detailType = "channel-processing",
    resources = [],
    detail = {app: "article-a23", 
		"image-id": "img-1234-df45-445", 
		'pr-type': "A-23-X", 
		format: "png", 
		'original-path': "file://123/img/img1", 
		'size': "346"}

  ) => {
    const client = new EventBridgeClient({});
  
    const response = await client.send(
      new PutEventsCommand({
        Entries: [
          {
            Detail: JSON.stringify(detail),
            DetailType: detailType,
            Resources: resources,
            Source: source,
            EventBusName: process.env.EVENTBRIDGE_BUS
          },
        ],
      }),
    );
  
    console.log("PutEvents response:");
    console.log(response);
  
    return response;
  };

  
  export const handler = async (event, context) => {
    const result = await putEvents();
    return {
        'statusCode': 200,
        'body': JSON.stringify(result)
    };
  };
  
  