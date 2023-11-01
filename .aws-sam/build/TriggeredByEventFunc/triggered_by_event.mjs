
  export const handler = async (event, context) => {
    console.log("EVENT: \n" + JSON.stringify(event, null, 2));
    return {
        'statusCode': 200,
        'body': JSON.stringify("Hello there")
    };
  };