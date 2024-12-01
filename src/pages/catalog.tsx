import { useEffect, useState } from "react";
import { ethers } from "ethers";
import {
  Box,
  Heading,
  Text,
  Flex,
  VStack,
  Badge,
  Button,
  Spinner,
} from "@chakra-ui/react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import abi from "../abis/ddm.json";

const CONTRACT_ADDRESS = ethers.utils.getAddress("0x17D705BaAa47cBAFB87B5409Cd463632f96D6f75");
const INFURA_API_URL = process.env.NEXT_PUBLIC_INFURA_API_URL;

type Dataset = {
  id: number;
  name: string;
  description: string;
  ipfsHash: string;
  owner: string;
  price: string;
};

const DataCatalogPage = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use Infura as a provider
        const provider = new ethers.providers.JsonRpcProvider(INFURA_API_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

        // Fetch datasets
        const datasetCount = await contract.datasetCount();
        const datasetPromises = [];
        for (let id = 1; id <= datasetCount; id++) {
          datasetPromises.push(contract.getDataset(id));
        }

        const datasetDetails = await Promise.all(datasetPromises);

        const formattedDatasets = datasetDetails.map((dataset: any, index: number) => ({
          id: index + 1,
          name: dataset[0],
          description: dataset[1],
          ipfsHash: dataset[2],
          owner: dataset[3],
          price: ethers.utils.formatEther(dataset[4]),
        }));

        setDatasets(formattedDatasets);
      } catch (err) {
        console.error("Error fetching datasets:", err);
        setError("Failed to fetch datasets. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDatasets();
  }, []);

  return (
    <Box p={8}>
      <Heading size="lg" textAlign="center" mb={8}>
        Data Catalog
      </Heading>

      {error ? (
        <Text color="red.500" textAlign="center">
          {error}
        </Text>
      ) : loading ? (
        <Flex justifyContent="center" alignItems="center" height="50vh">
          <Spinner size="xl" color="blue.500" />
        </Flex>
      ) : datasets.length > 0 ? (
        <VStack spacing={6} align="stretch">
          {datasets.map((dataset) => (
            <Flex
              key={dataset.id}
              p={4}
              borderWidth="1px"
              borderRadius="lg"
              flexDirection="row"
              justifyContent="space-between"
              alignItems="flex-start"
            >
              <Box flex="1">
                <Heading size="md">{dataset.name}</Heading>
                <Text fontSize="sm" color="gray.500" mb={2}>
                  Owned by: {dataset.owner.slice(0, 6)}...{dataset.owner.slice(-4)}
                </Text>
                <Text noOfLines={3} fontSize="sm" mb={4}>
                  {dataset.description}
                </Text>
                <Button
                  as="a"
                  href={`https://ipfs.io/ipfs/${dataset.ipfsHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="sm"
                  colorScheme="blue"
                  rightIcon={<ExternalLinkIcon />}
                >
                  View Dataset
                </Button>
              </Box>
              <Box textAlign="right" ml={4}>
                <Badge
                  colorScheme={dataset.price === "0.0" ? "green" : "blue"}
                  mb={2}
                  px={3}
                  py={1}
                  fontSize="sm"
                >
                  {dataset.price === "0.0" ? "Free" : `${dataset.price} ETH`}
                </Badge>
                <Text fontSize="xs" color="gray.500">
                  Dataset ID: {dataset.id}
                </Text>
              </Box>
            </Flex>
          ))}
        </VStack>
      ) : (
        <Text textAlign="center" fontSize="lg">
          No datasets available.
        </Text>
      )}
    </Box>
  );
};

export default DataCatalogPage;
