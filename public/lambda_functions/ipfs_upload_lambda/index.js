
const { PinataSDK } = require("pinata");
const { Blob } = require("buffer");
require("dotenv").config();
const PINATA_JWT = //your pinata jwt
const GATEWAY_URL =//your gateway url

/// Initialize Pinata SDK
/*
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.GATEWAY_URL,
});
*/
const pinata = new PinataSDK({
  pinataJwt: PINATA_JWT,
  pinataGateway: GATEWAY_URL,
});

exports.handler = async (event) => {
  try {
    // Parse JSON data from the request body
    const fileContent = event.fileContent;
    const fileName = event.fileName;

    //if (!requestBody || !requestBody.fileName || !requestBody.fileContent) {
    //  throw new Error("Invalid input: 'fileName' and 'fileContent' are required in the JSON body.");
    //}
    if (!fileContent || !fileName) {
      throw new Error("Invalid input: 'fileName' and 'fileContent' are required in the JSON body.");
    }

    // Convert JSON data to Blob for Pinata
    const blob = new Blob([fileContent]);
    const file = new File([blob], fileName, { type: "application/octet-stream" });

    // Upload the file to Pinata
    const pinataResult = await pinata.upload.file(file);

    // Log and return results
    console.log(`File uploaded to IPFS. CID: ${pinataResult.cid}`);
    return {
      statusCode: 200,
      body: JSON.stringify({
        //message: "Successfully uploaded to IPFS",
        //originalFileName: fileName,
        ipfsCID: pinataResult.cid,
      }),
    };
  } catch (error) {
    console.error("Upload Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "File upload failed",
        error: error.toString(),
      }),
    };
  }
};
/*

const { PinataSDK } = require("pinata");
const fs = require("fs");
const { Blob } = require("buffer");
require("dotenv").config();
const crypto = require('crypto');
const path = require('path');

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.GATEWAY_URL
});

// Parameters for encryption
const key = '398a76392cbd2991be6b7fdc64560575bbf5ca75c6080b3ca2fb13d805773ae3';
const iv = '53f22cc12fbb32a568cd7c77';
const algorithm = 'aes-256-gcm';

function encrypt(data) {
  if (typeof data !== "string") {
    // Convert non-string data to a string
    data = JSON.stringify(data);
  }

  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return {
    encryptedData: encrypted,
    authTag: authTag.toString('hex'),
  };
}


exports.handler = async (event) => {
  try {
    // Parse JSON data from the request body
    const fileContent = event.fileContent;
    const filename = event.fileName;
    //const fileExtension = path.extname(dir).toLowerCase();
    const fileExtension = filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
    //console.log(fileContent)
    //console.log(JSON.parse(fileContent))
    //console.log(JSON.stringify(JSON.parse(fileContent)))
    let data;
    switch(fileExtension) {
      case(fileExtension=='json'):
        data = JSON.stringify(fileContent);

      default:
        data = fileContent;
      }

    // Encrypt the data
    const encrypted = encrypt(data);
    // console.log("Original Data:", data);
    console.log("Encrypted Data:", encrypted.encryptedData);
    const blob = new Blob([encrypted.encryptedData]);
    const file = new File([blob], filename, { 
      type: fileExtension === '.json' ? "application/json" : 
             fileExtension === '.csv' ? "text/csv" : 
             "text/plain"
    });
    const result = await pinata.upload.file(file);
    console.log(result);
    console.log("Upload Result CID:", result.cid);
    console.log("run below command for decryption");
    console.log("node download.js " + 
      result.cid + " " + key + " " + iv + " " + encrypted.authTag);

    return {
      ...result,
      originalFilename: filename,
      encryptionDetails: {
        key: key,
        iv: iv,
        authTag: encrypted.authTag
      }
    };

  } catch (error) {
    console.error("Error uploading and encrypting file:", error);
    throw error;
  }
}
*/
