const { PinataSDK } = require("pinata");
const AWS = require('aws-sdk');
const { Blob } = require('buffer');

// Initialize services
const s3 = new AWS.S3();
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.GATEWAY_URL
});

exports.handler = async (event, context) => {
  // Extract S3 bucket and file details
  const bucket = event.Records[0].s3.bucket.name;
  const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
  
  try {
    const s3Params = {
      Bucket: bucket,
      Key: key
    };
    const s3Object = await s3.getObject(s3Params).promise();

    // Convert to File object for Pinata
    const blob = new Blob([s3Object.Body]);
    const file = new File([blob], key, { type: "application/octet-stream" });

    // Upload to Pinata
    const pinataResult = await pinata.upload.file(file);

    // Log and return results
    console.log(`File uploaded to IPFS. CID: ${pinataResult.cid}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Successfully uploaded to IPFS',
        originalFileName: key,
        ipfsCID: pinataResult.cid
      })
    };
  } catch (error) {
    console.error('Upload Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'File upload failed',
        error: error.toString()
      })
    };
  }
};