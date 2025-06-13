import { Command } from 'commander';
import { openaiConnector } from '../connectors';

export const createCommand = new Command()
  .name('create')
  .description('Create a new OpenAI vector store')
  .argument('<name>', 'Name of the vector store to create')
  .action(async (name: string) => {
    try {
      console.log(`Creating vector store: ${name}...`);
      
      const vectorStore = await openaiConnector.createVectorStore(name);

      console.log(`✅ Vector store created successfully!`);
      console.log(`ID: ${vectorStore.id}`);
      console.log(`Name: ${vectorStore.name}`);
      console.log(`Status: ${vectorStore.status}`);
      console.log(`Created: ${new Date(vectorStore.created_at * 1000).toISOString()}`);
    } catch (error) {
      console.error('❌ Error creating vector store:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });