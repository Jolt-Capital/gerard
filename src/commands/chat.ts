import { Command } from 'commander';
import { openaiConnector } from '../connectors';
import * as readline from 'readline';

export const chatCommand = new Command()
  .name('chat')
  .description('Start an interactive chat session with a vector store')
  .argument('<vectorStoreId>', 'ID of the vector store to chat with')
  .option('-m, --model <model>', 'AI model to use for chat', 'gpt-4o-mini')
  .option('-s, --single <message>', 'Send a single message instead of interactive chat')
  .action(async (vectorStoreId: string, options: { model: string; single?: string }) => {
    try {
      // Verify vector store exists
      try {
        const vectorStore = await openaiConnector.retrieveVectorStore(vectorStoreId);
        console.log(`💬 Starting chat with vector store: ${vectorStore.name || 'Unnamed'}`);
        console.log(`🤖 Using model: ${options.model}`);
        console.log(`📍 Vector store ID: ${vectorStoreId}\n`);
      } catch (error) {
        console.error(`❌ Vector store not found: ${vectorStoreId}`);
        process.exit(1);
      }

      // Single message mode
      if (options.single) {
        console.log(`👤 You: ${options.single}`);
        console.log('🔍 Searching vector store and generating response...\n');
        
        try {
          const response = await openaiConnector.chatWithVectorStore(
            options.single,
            [vectorStoreId],
            options.model
          );

          // Parse the response output
          let outputText = '';
          if (Array.isArray(response.output)) {
            outputText = response.output.map((item: any) => {
              if (item.type === 'text') {
                return item.text;
              } else if (item.type === 'file_search_call') {
                return item.result?.content || 'File search completed';
              } else {
                return item.content || item.text || '';
              }
            }).filter(text => text).join('\n');
          } else {
            outputText = String(response.output);
          }
          
          console.log(`🤖 Assistant: ${outputText || 'No response content'}`);
          
          // Show sources if available
          if ((response as any).sources && (response as any).sources.length > 0) {
            console.log('\n📚 Sources:');
            (response as any).sources.forEach((source: any, index: number) => {
              console.log(`${index + 1}. ${source.name || 'Unknown file'}`);
              if (source.content_snippet) {
                console.log(`   "${source.content_snippet.substring(0, 100)}..."`);
              }
            });
          }
        } catch (error) {
          console.error('❌ Error during chat:', error instanceof Error ? error.message : error);
          process.exit(1);
        }
        return;
      }

      // Interactive chat mode
      console.log('🚀 Interactive chat started! Type "exit" or "quit" to end the session.\n');
      
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const askQuestion = (): Promise<void> => {
        return new Promise((resolve) => {
          rl.question('👤 You: ', async (input) => {
            const message = input.trim();
            
            if (message.toLowerCase() === 'exit' || message.toLowerCase() === 'quit') {
              console.log('\n👋 Chat session ended. Goodbye!');
              rl.close();
              resolve();
              return;
            }

            if (!message) {
              console.log('Please enter a message or type "exit" to quit.\n');
              resolve();
              return;
            }

            console.log('🔍 Searching vector store and generating response...\n');
            
            try {
              const response = await openaiConnector.chatWithVectorStore(
                message,
                [vectorStoreId],
                options.model
              );

              // Parse the response output
          let outputText = '';
          if (Array.isArray(response.output)) {
            outputText = response.output.map((item: any) => {
              if (item.type === 'text') {
                return item.text;
              } else if (item.type === 'file_search_call') {
                return item.result?.content || 'File search completed';
              } else {
                return item.content || item.text || '';
              }
            }).filter(text => text).join('\n');
          } else {
            outputText = String(response.output);
          }
          
          console.log(`🤖 Assistant: ${outputText || 'No response content'}`);
              
              // Show sources if available
              if ((response as any).sources && (response as any).sources.length > 0) {
                console.log('\n📚 Sources:');
                (response as any).sources.forEach((source: any, index: number) => {
                  console.log(`${index + 1}. ${source.name || 'Unknown file'}`);
                  if (source.content_snippet) {
                    console.log(`   "${source.content_snippet.substring(0, 100)}..."`);
                  }
                });
              }
              
              console.log(''); // Empty line for readability
              resolve();
            } catch (error) {
              console.error('❌ Error during chat:', error instanceof Error ? error.message : error);
              console.log(''); // Empty line for readability
              resolve();
            }
          });
        });
      };

      // Start interactive loop
      while (true) {
        await askQuestion();
      }

    } catch (error) {
      console.error('❌ Error starting chat session:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });