import { Command } from 'commander';
import { openaiConnector } from '../connectors';

export const listFilesCommand = new Command()
  .name('list-files')
  .description('List all files in an OpenAI vector store')
  .argument('<vectorStoreId>', 'ID of the vector store')
  .option('-l, --limit <number>', 'Maximum number of files to list', '100')
  .action(async (vectorStoreId: string, options: { limit: string }) => {
    try {
      // Verify vector store exists
      try {
        const vectorStore = await openaiConnector.retrieveVectorStore(vectorStoreId);
        console.log(`📚 Listing files in vector store: ${vectorStore.name || 'Unnamed'}`);
        console.log(`📍 Vector store ID: ${vectorStoreId}`);
      } catch (error) {
        console.error(`❌ Vector store not found: ${vectorStoreId}`);
        process.exit(1);
      }

      console.log('⏳ Fetching files...');
      
      const filesResponse = await openaiConnector.listVectorStoreFiles(vectorStoreId, {
        limit: parseInt(options.limit)
      });

      if (filesResponse.data.length === 0) {
        console.log('📭 No files found in this vector store.');
        return;
      }

      console.log(`\n📄 Found ${filesResponse.data.length} file(s):\n`);
      
      filesResponse.data.forEach((file, index) => {
        console.log(`${index + 1}. File ID: ${file.id}`);
        console.log(`   Status: ${file.status}`);
        console.log(`   Usage bytes: ${file.usage_bytes || 'N/A'}`);
        console.log(`   Created: ${new Date(file.created_at * 1000).toLocaleString()}`);
        if (file.last_error) {
          console.log(`   ⚠️  Error: ${file.last_error.message}`);
        }
        console.log('');
      });

      if (filesResponse.has_more) {
        console.log('💡 There are more files available. Use --limit to increase the number shown.');
      }
    } catch (error) {
      console.error('❌ Error listing files:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });