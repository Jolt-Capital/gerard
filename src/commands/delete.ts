import { Command } from 'commander';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const deleteCommand = new Command()
  .name('delete')
  .description('Delete an OpenAI vector store')
  .argument('<id>', 'ID of the vector store to delete')
  .action(async (id: string) => {
    try {
      console.log(`Deleting vector store: ${id}...`);
      
      // First, get the vector store details to show what we're deleting
      const vectorStore = await openai.vectorStores.retrieve(id);
      console.log(`Found vector store: ${vectorStore.name || 'Unnamed'}`);
      
      // Delete the vector store
      const deletedStore = await openai.vectorStores.delete(id);
      
      if (deletedStore.deleted) {
        console.log(`✅ Vector store deleted successfully!`);
        console.log(`ID: ${deletedStore.id}`);
      } else {
        console.log('⚠️  Vector store deletion status unclear');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('No such vector store')) {
        console.error(`❌ Vector store with ID '${id}' not found`);
      } else {
        console.error('❌ Error deleting vector store:', error instanceof Error ? error.message : error);
      }
      process.exit(1);
    }
  });