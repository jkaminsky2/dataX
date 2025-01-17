# Data Marketplace Blockchain
--------
**Decentralized Data Marketplace:** [data-x-delta.vercel.app](https://data-x-delta.vercel.app)

**Project Status Website:** https://suaye07.github.io/DSC180_proj_web/

<a target="_blank" href="https://cookiecutter-data-science.drivendata.org/">
    <img src="https://img.shields.io/badge/CCDS-Project%20template-328F97?logo=cookiecutter" />
</a>

This repo contains the back-end code for a decentralized application (dapp), specifically a data marketplace, on the Ethereum Blockchain. To access, go to [data-x-delta.vercel.app](https://data-x-delta.vercel.app). Users can buy and sell data securely and in accordance with privacy laws; there are also on-chain data analytics capabilities. To begin, launch the website attached to this repository. Users, after registering for an account, can upload data to an offshore, decentralized storage location (IPFS) via `Ddm.sol` and post it to the market--along with an overview of the data–general tags like industry, description of what data is about, dataset size, and a column-by-column description; before the data is stored, the data is encrypted, has a script `malware_and_pii.py` run on it to anonymize the data and ensure no malware or SQL injections are present; then the dataset is tagged with a certification so that other users cannot upload the same data. Buyers can see this information and filter data based on their needs. Buyers then purchase desirable data with our token via smart contracts, along with paying a little extra gas to nodes to verify the transaction and upload it to the blockchain via Polygon. Buyers and sellers can also exchange services to run analytics on the data–or any data they have in-house. We will also offer our own service that offers a wide variety of ML applications, like data summarization and image description generation, and allow users to upload scripts. These analytics can be run on-chain for secure, transparent data analysis without compromising privacy. Our focus is on ensuring a safe and secure platform, where the ML applications are secondary.


#### Getting Started

Download the following google chrome extension: https://chromewebstore.google.com/detail/allow-cors-access-control/lhobafahddgcelffkeicbaginigeejlf

Currently download dataset function doesn't work due to being blocked by Cors policy. We can work around this by downloading and turning on this extension. We plan to find a better fix for this issue next quarter to this issue.

go to [data-x-delta.vercel.app](https://data-x-delta.vercel.app)


##### Getting started locally
``` 
git clone https://github.com/gchongg/dataX.git
cd DataX 
npm install pinata-web3 --legacy-peer-deps
npm install 
npm run dev 
```

Also include a `.env.local` file in the project root with the following contents:
```
NEXT_PUBLIC_PINATA_JWT= {your pinata jwt}
NEXT_PUBLIC_GATEWAY_URL= {your pinata public gateway url }
NEXT_PUBLIC_INFURA_API_URL=https://sepolia.infura.io/v3/{your infura api key }
```

### Appendix

#### Smart Contracts

transfer.sol - included in the public/smart_contracts folder; transfers ETH to Joey's address in the instance of abuse to the Lambda functions. This exchange helps to ensure that the costs related to the Lambda functions and IPFS storage are paid for (and nothing more).

#### Lambda Functions

For pinata, after you open the account:
1. Create a api key and safe the PINATA_JWT somewhere secretly as it only appear once(for simpicity, just click admin as the permission for test purpose)
2. Navigate to gateway to maintain the GATEWAY_URL
3. Safe it in a file so you could use it below
   

To run the AWS Lambda functions that are related to the smart contracts, download their folders in public/lambda_functions. Then, unzip `node_modules` in pinata_upload and `venv` in pii_scrub. From there, you can directly upload the pinata_upload function to AWS Lambda function as a zip file. Make sure to change `PINATA_JWT` and `GATEWAY_URL` to your specific keys. You will need to include your credentials for Pinata. As for the pii_scrub, you will need to construct an image. Follow these steps:

1. Navigate to the foldrer pii_scrub
2. Go to ECR in AWS and create a new repository
3. Follow the steps outlined there on how to upload the image
4. Navigate to Lambda and create a new function via an image
5. Link the Lambda function to the image you created


For the pinata gateway, all the library we use are already include in the zip file, follow these steps:
1. Create an IAM role in aws with the permission
2. Use that IAM role to create a lambda function with runtime as node.js 22x
3. Navigate to the function and click upload from, choose the .zip file to upload the functions
4. Set up the trigger so that the lambda function will run as file uploads.
