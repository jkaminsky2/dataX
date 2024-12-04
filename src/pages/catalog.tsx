import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  VStack,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  SimpleGrid,
  Select,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Text,
  Badge,
  Icon,
  Stack,
  Divider,
} from '@chakra-ui/react';
import { FaDatabase, FaSearch, FaSort } from 'react-icons/fa';
import { ethers } from 'ethers';
import { PinataSDK } from 'pinata';
import abi from '../abis/ddm.json';

const CONTRACT_ADDRESS = ethers.utils.getAddress('0xDE62cFAbBF894a664cBdA497b469B7779E56Aa15');
const INFURA_API_URL = process.env.NEXT_PUBLIC_INFURA_API_URL;
const pinata = new PinataSDK({
  pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT,
  pinataGateway: process.env.NEXT_PUBLIC_GATEWAY_URL,
});

const ListView = () => {
  const [datasets, setDatasets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('Most Popular');
  const [filters, setFilters] = useState({
    availability: '',
    category: '',
    businessNeed: '',
    geo: '',
    price: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        setLoading(true);
        setError(null);

        const provider = new ethers.providers.JsonRpcProvider(INFURA_API_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

        const datasetCount = await contract.datasetCount();
        const datasetPromises = Array.from({ length: datasetCount }, (_, id) => contract.getDataset(id + 1));
        const datasetDetails = await Promise.all(datasetPromises);

        const formattedDatasets = datasetDetails.map((dataset, index) => ({
          id: index + 1,
          title: dataset[0],
          provider: dataset[3],
          description: dataset[1],
          cid: dataset[2],
          price: ethers.utils.formatEther(dataset[4]),
          popularity: Math.floor(Math.random() * 10 + 1),
          date: new Date(),
          availability: Math.random() > 0.5 ? 'Available Now' : 'Coming Soon',
          category: 'Technology',
          businessNeed: 'Analytics',
          geo: 'North America',
        }));

        setDatasets(formattedDatasets);
      } catch (err) {
        console.error('Error fetching datasets:', err);
        setError('Failed to fetch datasets. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDatasets();
  }, []);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const handleFilterChange = (filterKey, value) => {
    setFilters((prevFilters) => ({ ...prevFilters, [filterKey]: value }));
  };

  const filterAndSortData = useMemo(() => {
    let filtered = datasets.filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm);
      const matchesFilters = Object.keys(filters).every(
        (key) => !filters[key] || item[key] === filters[key]
      );
      return matchesSearch && matchesFilters;
    });

    if (sortOption === 'Most Popular') {
      filtered.sort((a, b) => b.popularity - a.popularity);
    } else if (sortOption === 'Most Recent') {
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortOption === 'Title') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    return filtered;
  }, [datasets, searchTerm, filters, sortOption]);

  const downloadDataset = async (cid) => {
    try {
      if (!cid) {
        throw new Error('CID cannot be empty');
      }
      const { data, contentType } = await pinata.gateways.get(cid);
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      const blob = new window.Blob([dataString], { type: contentType || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'downloaded-file';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading the dataset:', error);
    }
  };

  return (
    <Box w="100%" minH="100vh" bg="gray.50" p={8} overflowX="hidden">
      <Flex mb={6} justify="space-between" align="center" w="100%">
        <InputGroup flex="1" mr={4}>
          <InputLeftElement pointerEvents="none">
            <FaSearch color="gray.500" />
          </InputLeftElement>
          <Input
            placeholder="Search providers and data products"
            value={searchTerm}
            onChange={handleSearch}
            bg="white"
            transition="all 0.3s"
            _hover={{ boxShadow: 'md' }}
            _focus={{ boxShadow: 'lg', borderColor: 'blue.500' }}
          />
        </InputGroup>
        <Menu>
          <MenuButton as={Button} leftIcon={<FaSort />} variant="outline">
            {sortOption}
          </MenuButton>
          <MenuList>
            {['Most Popular', 'Most Recent', 'Title'].map((option) => (
              <MenuItem key={option} onClick={() => setSortOption(option)}>
                {option}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
      </Flex>

      <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} spacing={4} mb={8} w="100%">
        {Object.keys(filters).map((filterKey) => (
          <Select
            key={filterKey}
            placeholder={filterKey.charAt(0).toUpperCase() + filterKey.slice(1)}
            bg="white"
            onChange={(e) => handleFilterChange(filterKey, e.target.value)}
          >
            {/* Options should be dynamically generated based on data */}
            {['Available Now', 'Coming Soon', 'Finance', 'Healthcare', 'Technology', 'North America', 'Europe', 'Asia', 'Free', 'Paid'].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        ))}
      </SimpleGrid>

      <VStack spacing={0} align="stretch" w="100%">
        {loading ? (
          <Text textAlign="center">Loading datasets...</Text>
        ) : error ? (
          <Text color="red.500" textAlign="center">{error}</Text>
        ) : (
          filterAndSortData.map((item, index) => (
            <React.Fragment key={item.id}>
              <Box
                p={8}
                borderRadius="xl"
                bg="white"
                boxShadow="base"
                transition="all 0.3s"
                _hover={{ bg: 'gray.100' }}
              >
                <Flex align="start">
                  <Icon as={FaDatabase} boxSize={10} color="blue.600" mr={4} />
                  <Stack spacing={3} flex="1">
                    <Flex justify="space-between" align="center">
                      <Text fontSize="xl" fontWeight="bold">{item.title}</Text>
                      <Badge colorScheme="green" fontSize="0.9em">{item.price} wei</Badge>
                    </Flex>
                    <Text color="blue.500" fontWeight="medium">{item.provider}</Text>
                    <Text noOfLines={2} color="gray.700">{item.description}</Text>
                    <Button mt={2} colorScheme="teal" size="sm" onClick={() => downloadDataset(item.cid)}>
                      Buy Dataset
                    </Button>
                  </Stack>
                </Flex>
              </Box>
              {index < filterAndSortData.length - 1 && <Divider borderColor="black" borderWidth="1px" />}
            </React.Fragment>
          ))
        )}
      </VStack>
    </Box>
  );
};

export default ListView;
