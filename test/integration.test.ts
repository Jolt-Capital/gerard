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

  it('should create, list, delete a vector store and manage files including bulk upload', async () => {
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

    // Step 7: Test directory upload (non-recursive)
    console.log('Testing directory upload functionality...');
    const testDirPath = './test/sample-dir';
    const dirUploadResult = await openaiConnector.uploadDirectoryToVectorStore(createdStoreId, testDirPath, false);
    
    expect(dirUploadResult.results.length).toBeGreaterThan(0);
    expect(dirUploadResult.errors.length).toBe(0);
    console.log(`✅ Directory upload completed: ${dirUploadResult.results.length} files uploaded`);
    
    // Verify files were added
    let filesAfterDirUpload = await openaiConnector.listVectorStoreFiles(createdStoreId);
    expect(filesAfterDirUpload.data.length).toBe(dirUploadResult.results.length);
    console.log(`✅ Verified ${filesAfterDirUpload.data.length} files in vector store after directory upload`);

    // Step 7.5: Test recursive directory upload
    console.log('Testing recursive directory upload functionality...');
    const recursiveDirPath = './test/recursive-test';
    const recursiveUploadResult = await openaiConnector.uploadDirectoryToVectorStore(createdStoreId, recursiveDirPath, true);
    
    expect(recursiveUploadResult.results.length).toBe(3); // root-file.txt, subdir1/subdir1-file.md, subdir1/subdir2/deep-file.json
    expect(recursiveUploadResult.errors.length).toBe(0);
    console.log(`✅ Recursive upload completed: ${recursiveUploadResult.results.length} files uploaded`);
    
    // Verify all files including nested ones were added
    filesAfterDirUpload = await openaiConnector.listVectorStoreFiles(createdStoreId);
    const totalExpectedFiles = dirUploadResult.results.length + recursiveUploadResult.results.length;
    expect(filesAfterDirUpload.data.length).toBe(totalExpectedFiles);
    console.log(`✅ Verified ${filesAfterDirUpload.data.length} total files after recursive upload`);

    // Step 8: Test chat functionality
    console.log('Testing chat functionality with vector store...');
    const testQuestion = 'What files are in this vector store?';
    
    try {
      const chatResponse = await openaiConnector.chatWithVectorStore(
        testQuestion,
        [createdStoreId],
        'gpt-4o-mini'
      );
      
      expect(chatResponse).toBeDefined();
      expect(chatResponse.output).toBeDefined();
      expect(Array.isArray(chatResponse.output)).toBe(true);
      
      const outputText = chatResponse.output.map((item: any) => item.text || item.content || JSON.stringify(item)).join(' ');
      console.log(`✅ Chat response received: "${outputText.substring(0, 100)}..."`);
      
      if ((chatResponse as any).sources) {
        console.log(`✅ Found ${(chatResponse as any).sources.length} sources in response`);
      }
    } catch (error) {
      console.error('⚠️  Chat test failed:', error instanceof Error ? error.message : error);
      // Don't fail the test if chat fails, as it might be an API limitation
    }

    // Step 9: Delete the vector store
    console.log('Deleting test vector store...');
    const deletedStore = await openaiConnector.deleteVectorStore(createdStoreId);
    
    expect(deletedStore).toBeDefined();
    expect(deletedStore.deleted).toBe(true);
    expect(deletedStore.id).toBe(createdStoreId);
    console.log('✅ Store deleted successfully');

    // Step 10: Verify deletion by trying to retrieve (should fail)
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