import { Command } from 'commander';
import { openaiConnector } from '../connectors';
import * as fs from 'fs';
import * as path from 'path';

export const addFileCommand = new Command()
  .name('add-file')
  .description('Add a file to an OpenAI vector store')
  .argument('<vectorStoreId>', 'ID of the vector store')
  .argument('<filePath>', 'Path to the file to upload')
  .action(async (vectorStoreId: string, filePath: string) => {
    try {
      // Validate file exists
      if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        process.exit(1);
      }

      // Get file info
      const fileName = path.basename(filePath);
      const fileStats = fs.statSync(filePath);
      
      console.log(`📁 Uploading file: ${fileName} (${(fileStats.size / 1024).toFixed(1)} KB)`);
      console.log(`📍 Target vector store: ${vectorStoreId}`);
      
      // Verify vector store exists
      try {
        const vectorStore = await openaiConnector.retrieveVectorStore(vectorStoreId);
        console.log(`✅ Vector store found: ${vectorStore.name || 'Unnamed'}`);
      } catch (error) {
        console.error(`❌ Vector store not found: ${vectorStoreId}`);
        process.exit(1);
      }

      // Upload file and add to vector store
      console.log('⏳ Uploading file and adding to vector store...');
      const result = await openaiConnector.uploadAndAddFileToVectorStore(vectorStoreId, filePath);

      console.log('✅ File successfully added to vector store!');
      console.log(`📄 File ID: ${result.file.id}`);
      console.log(`📄 File name: ${result.file.filename}`);
      console.log(`📄 File size: ${result.file.bytes} bytes`);
      console.log(`🔗 Vector store file ID: ${result.vectorStoreFile.id}`);
      console.log(`📊 Vector store file status: ${result.vectorStoreFile.status}`);
    } catch (error) {
      console.error('❌ Error adding file to vector store:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });