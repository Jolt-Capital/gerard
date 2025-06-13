import { Command } from 'commander';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const listCommand = new Command()
  .name('list')
  .description('List all OpenAI vector stores')
  .action(async () => {
    try {
      console.log('Fetching vector stores...');
      
      const vectorStores = await openai.vectorStores.list();

      if (vectorStores.data.length === 0) {
        console.log('No vector stores found.');
        return;
      }

      console.log(`\n📚 Found ${vectorStores.data.length} vector store(s):\n`);
      
      vectorStores.data.forEach((store, index) => {
        console.log(`${index + 1}. ${store.name || 'Unnamed'}`);
        console.log(`   ID: ${store.id}`);
        console.log(`   Status: ${store.status}`);
        console.log(`   Files: ${store.file_counts.total || 0}`);
        console.log(`   Created: ${new Date(store.created_at * 1000).toLocaleString()}`);
        console.log('');
      });
    } catch (error) {
      console.error('❌ Error listing vector stores:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });