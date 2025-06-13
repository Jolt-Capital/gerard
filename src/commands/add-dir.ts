import { Command } from 'commander';
import { openaiConnector } from '../connectors';
import * as fs from 'fs';
import * as path from 'path';

export const addDirCommand = new Command()
  .name('add-dir')
  .description('Add all files from a directory to an OpenAI vector store')
  .argument('<vectorStoreId>', 'ID of the vector store')
  .argument('<directoryPath>', 'Path to the directory containing files to upload')
  .option('--include-subdirs', 'Include files from subdirectories (recursive)', false)
  .action(async (vectorStoreId: string, directoryPath: string, options: { includeSubdirs: boolean }) => {
    try {
      // Validate directory exists
      if (!fs.existsSync(directoryPath)) {
        console.error(`❌ Directory not found: ${directoryPath}`);
        process.exit(1);
      }

      const stat = fs.statSync(directoryPath);
      if (!stat.isDirectory()) {
        console.error(`❌ Path is not a directory: ${directoryPath}`);
        process.exit(1);
      }

      console.log(`📂 Adding files from: ${path.resolve(directoryPath)}`);
      console.log(`📍 Target vector store: ${vectorStoreId}`);
      
      // Verify vector store exists
      try {
        const vectorStore = await openaiConnector.retrieveVectorStore(vectorStoreId);
        console.log(`✅ Vector store found: ${vectorStore.name || 'Unnamed'}`);
      } catch (error) {
        console.error(`❌ Vector store not found: ${vectorStoreId}`);
        process.exit(1);
      }

      console.log('⏳ Starting bulk upload...\n');
      
      if (options.includeSubdirs) {
        console.log('🔄 Recursive mode enabled - processing subdirectories...');
      }

      // Add all files from directory
      const uploadResult = await openaiConnector.uploadDirectoryToVectorStore(vectorStoreId, directoryPath, options.includeSubdirs);

      console.log('\n📊 Upload Summary:');
      console.log(`✅ Successfully uploaded: ${uploadResult.results.length} files`);
      
      if (uploadResult.errors.length > 0) {
        console.log(`❌ Failed uploads: ${uploadResult.errors.length} files`);
        console.log('\n❌ Failed files:');
        uploadResult.errors.forEach(error => {
          console.log(`   • ${error.fileName}: ${error.error}`);
        });
      }

      const totalProcessed = uploadResult.results.length + uploadResult.errors.length;
      const skipped = uploadResult.totalFiles - totalProcessed;
      
      if (skipped > 0) {
        console.log(`ℹ️  Skipped: ${skipped} files (directories/hidden files)`);
      }

      console.log(`\n📈 Total files processed: ${totalProcessed}/${uploadResult.totalFiles}`);
      
      if (uploadResult.results.length > 0) {
        console.log('\n📄 Uploaded files:');
        uploadResult.results.forEach((result, index) => {
          console.log(`${index + 1}. ${result.fileName}`);
          console.log(`   File ID: ${result.file.id}`);
          console.log(`   Size: ${result.file.bytes} bytes`);
          console.log(`   Vector store file status: ${result.vectorStoreFile.status}`);
        });
      }

    } catch (error) {
      console.error('❌ Error uploading directory:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });