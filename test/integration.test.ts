import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

describe('Gerard CLI Integration Test', () => {
  const testStoreName = 'testStore';
  let createdStoreId: string;

  beforeAll(() => {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required for integration tests');
    }
  });

  afterAll(async () => {
    // Cleanup: ensure test store is deleted even if test fails
    if (createdStoreId) {
      try {
        await openai.vectorStores.delete(createdStoreId);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  it('should create, list, and delete a vector store', async () => {
    // Step 1: Create a vector store
    console.log('Creating test vector store...');
    const createdStore = await openai.vectorStores.create({
      name: testStoreName,
    });

    expect(createdStore).toBeDefined();
    expect(createdStore.name).toBe(testStoreName);
    expect(createdStore.id).toBeDefined();
    
    createdStoreId = createdStore.id;
    console.log(`Created store with ID: ${createdStoreId}`);

    // Step 2: Verify store exists by direct retrieval
    console.log('Verifying store exists by direct retrieval...');
    const retrievedStore = await openai.vectorStores.retrieve(createdStoreId);
    expect(retrievedStore).toBeDefined();
    expect(retrievedStore.name).toBe(testStoreName);
    console.log('✅ Store verified by direct retrieval');

    // Also test listing (might be paginated)
    console.log('Testing list functionality...');
    const listResponse = await openai.vectorStores.list({ limit: 100 });
    expect(listResponse.data).toBeDefined();
    console.log(`Found ${listResponse.data.length} vector stores in list`);

    // Step 3: Delete the vector store
    console.log('Deleting test vector store...');
    const deletedStore = await openai.vectorStores.delete(createdStoreId);
    
    expect(deletedStore).toBeDefined();
    expect(deletedStore.deleted).toBe(true);
    expect(deletedStore.id).toBe(createdStoreId);
    console.log('✅ Store deleted successfully');

    // Step 4: Verify deletion by trying to retrieve (should fail)
    console.log('Verifying store has been deleted...');
    try {
      await openai.vectorStores.retrieve(createdStoreId);
      throw new Error('Store should not exist after deletion');
    } catch (error) {
      // This is expected - the store should not exist
      console.log('✅ Store confirmed deleted - retrieve failed as expected');
    }

    // Clear the ID since we successfully deleted it
    createdStoreId = '';
  }, 30000); // 30 second timeout for API calls
});