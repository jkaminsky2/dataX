import { useState } from "react";
import { Button, Box, Input, Text } from "@chakra-ui/react";
import { PinataSDK } from "pinata";
import { Blob } from "buffer";

const pinata = new PinataSDK({
  pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT!,
  pinataGateway: process.env.NEXT_PUBLIC_GATEWAY_URL!,
});

const DisplayFile: React.FC = () => {
  const [cid, setCid] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [output, setOutput] = useState<string | null>(null);

  const fetchFile = async () => {
    try {
      if (!cid) {
        throw new Error("CID cannot be empty");
      }

      setLoading(true);

      // Fetching the file using Pinata SDK for private files
      const { data, contentType } = await pinata.gateways.get(cid);

      // Displaying the file content
      if (contentType && contentType.startsWith("text")) {
        setOutput(data);
      } else {
        setOutput("Non-text content retrieved");
      }
    } catch (error) {
      console.error("Error fetching the file:", error);
      setOutput("Error fetching the file: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box textAlign="center" mt={4}>
      <Input
        placeholder="Enter CID"
        value={cid}
        onChange={(e) => setCid(e.target.value)}
        mb={4}
      />
      <Button onClick={fetchFile} isLoading={loading} loadingText="Fetching..." colorScheme="teal" disabled={!cid}>
        Fetch File
      </Button>
      {output && (
        <Box mt={4} p={4} borderWidth="1px" borderRadius="md">
          <Text>{output}</Text>
        </Box>
      )}
    </Box>
  );
};

export default DisplayFile;
