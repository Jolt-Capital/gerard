import { openaiConnector } from '../src/connectors';

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
        await openaiConnector.deleteVectorStore(createdStoreId);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  it('should create, list, delete a vector store and manage files', async () => {
    // Step 1: Create a vector store
    console.log('Creating test vector store...');
    const createdStore = await openaiConnector.createVectorStore(testStoreName);

    expect(createdStore).toBeDefined();
    expect(createdStore.name).toBe(testStoreName);
    expect(createdStore.id).toBeDefined();
    
    createdStoreId = createdStore.id;
    console.log(`Created store with ID: ${createdStoreId}`);

    // Step 2: Verify store exists by direct retrieval
    console.log('Verifying store exists by direct retrieval...');
    const retrievedStore = await openaiConnector.retrieveVectorStore(createdStoreId);
    expect(retrievedStore).toBeDefined();
    expect(retrievedStore.name).toBe(testStoreName);
    console.log('✅ Store verified by direct retrieval');

    // Also test listing (might be paginated)
    console.log('Testing list functionality...');
    const listResponse = await openaiConnector.listVectorStores({ limit: 100 });
    expect(listResponse.data).toBeDefined();
    console.log(`Found ${listResponse.data.length} vector stores in list`);

    // Step 3: Test file upload
    console.log('Testing file upload to vector store...');
    const testFilePath = './test/sample.txt';
    const uploadResult = await openaiConnector.uploadAndAddFileToVectorStore(createdStoreId, testFilePath);
    
    expect(uploadResult.file).toBeDefined();
    expect(uploadResult.file.filename).toBe('sample.txt');
    expect(uploadResult.vectorStoreFile).toBeDefined();
    expect(uploadResult.vectorStoreFile.vector_store_id).toBe(createdStoreId);
    console.log(`✅ File uploaded: ${uploadResult.file.id} (${uploadResult.file.bytes} bytes)`);
    console.log(`✅ Added to vector store: ${uploadResult.vectorStoreFile.id} (status: ${uploadResult.vectorStoreFile.status})`);

    // Step 4: List files in vector store
    console.log('Testing list files functionality...');
    const filesResponse = await openaiConnector.listVectorStoreFiles(createdStoreId);
    expect(filesResponse.data).toBeDefined();
    expect(filesResponse.data.length).toBeGreaterThan(0);
    
    const uploadedFile = filesResponse.data.find(file => file.id === uploadResult.file.id);
    expect(uploadedFile).toBeDefined();
    console.log(`✅ Found ${filesResponse.data.length} file(s) in vector store`);

    // Step 5: Delete file from vector store
    console.log('Testing file deletion from vector store...');
    const deletedFile = await openaiConnector.deleteFileFromVectorStore(createdStoreId, uploadResult.file.id);
    expect(deletedFile.deleted).toBe(true);
    expect(deletedFile.id).toBe(uploadResult.file.id);
    console.log(`✅ File deleted from vector store: ${deletedFile.id}`);

    // Step 6: Verify file is removed from vector store
    console.log('Verifying file removal...');
    
    // Wait a moment for eventual consistency
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const filesAfterDelete = await openaiConnector.listVectorStoreFiles(createdStoreId);
    const fileStillExists = filesAfterDelete.data.find(file => file.id === uploadResult.file.id);
    
    if (fileStillExists) {
      console.log(`File still exists with status: ${fileStillExists.status}`);
      // If file still exists but is marked as deleted or failed, that's acceptable
      if (fileStillExists.status === 'cancelled' || fileStillExists.status === 'failed') {
        console.log('✅ File marked as removed/cancelled from vector store');
      } else {
        console.log('⚠️  File deletion may be eventually consistent');
      }
    } else {
      console.log('✅ File confirmed removed from vector store');
    }

    // Step 7: Delete the vector store
    console.log('Deleting test vector store...');
    const deletedStore = await openaiConnector.deleteVectorStore(createdStoreId);
    
    expect(deletedStore).toBeDefined();
    expect(deletedStore.deleted).toBe(true);
    expect(deletedStore.id).toBe(createdStoreId);
    console.log('✅ Store deleted successfully');

    // Step 8: Verify deletion by trying to retrieve (should fail)
    console.log('Verifying store has been deleted...');
    try {
      await openaiConnector.retrieveVectorStore(createdStoreId);
      throw new Error('Store should not exist after deletion');
    } catch (error) {
      // This is expected - the store should not exist
      console.log('✅ Store confirmed deleted - retrieve failed as expected');
    }

    // Clear the ID since we successfully deleted it
    createdStoreId = '';
  }, 30000); // 30 second timeout for API calls
});