import { Command } from 'commander';
import { openaiConnector } from '../connectors';

export const deleteFileCommand = new Command()
  .name('delete-file')
  .description('Delete a file from an OpenAI vector store')
  .argument('<vectorStoreId>', 'ID of the vector store')
  .argument('<fileId>', 'ID of the file to delete')
  .action(async (vectorStoreId: string, fileId: string) => {
    try {
      // Verify vector store exists
      try {
        const vectorStore = await openaiConnector.retrieveVectorStore(vectorStoreId);
        console.log(`📚 Vector store: ${vectorStore.name || 'Unnamed'}`);
        console.log(`📍 Vector store ID: ${vectorStoreId}`);
      } catch (error) {
        console.error(`❌ Vector store not found: ${vectorStoreId}`);
        process.exit(1);
      }

      // Verify file exists in the vector store
      try {
        const filesResponse = await openaiConnector.listVectorStoreFiles(vectorStoreId);
        const fileExists = filesResponse.data.find(file => file.id === fileId);
        
        if (!fileExists) {
          console.error(`❌ File not found in vector store: ${fileId}`);
          process.exit(1);
        }
        
        console.log(`📄 Found file: ${fileId} (status: ${fileExists.status})`);
      } catch (error) {
        console.error(`❌ Error checking file existence: ${error instanceof Error ? error.message : error}`);
        process.exit(1);
      }

      console.log(`⏳ Deleting file ${fileId} from vector store...`);
      
      const deletedFile = await openaiConnector.deleteFileFromVectorStore(vectorStoreId, fileId);
      
      if (deletedFile.deleted) {
        console.log('✅ File successfully deleted from vector store!');
        console.log(`📄 File ID: ${deletedFile.id}`);
      } else {
        console.log('⚠️  File deletion status unclear');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('No such file')) {
        console.error(`❌ File with ID '${fileId}' not found in vector store '${vectorStoreId}'`);
      } else {
        console.error('❌ Error deleting file from vector store:', error instanceof Error ? error.message : error);
      }
      process.exit(1);
    }
  });