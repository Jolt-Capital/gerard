import OpenAI from 'openai';

export class OpenAIConnector {
  private client: OpenAI;

  constructor(apiKey?: string) {
    this.client = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });
  }

  async createVectorStore(name: string): Promise<OpenAI.VectorStore> {
    return await this.client.vectorStores.create({ name });
  }

  async listVectorStores(options?: { limit?: number }): Promise<OpenAI.VectorStoresPage> {
    return await this.client.vectorStores.list(options);
  }

  async retrieveVectorStore(id: string): Promise<OpenAI.VectorStore> {
    return await this.client.vectorStores.retrieve(id);
  }

  async deleteVectorStore(id: string): Promise<OpenAI.VectorStoreDeleted> {
    return await this.client.vectorStores.delete(id);
  }

  async uploadFile(filePath: string): Promise<OpenAI.FileObject> {
    const fs = await import('fs');
    return await this.client.files.create({
      file: fs.createReadStream(filePath),
      purpose: 'assistants',
    });
  }

  async addFileToVectorStore(vectorStoreId: string, fileId: string) {
    return await this.client.vectorStores.files.create(vectorStoreId, {
      file_id: fileId,
    });
  }

  async uploadAndAddFileToVectorStore(vectorStoreId: string, filePath: string) {
    const file = await this.uploadFile(filePath);
    const vectorStoreFile = await this.addFileToVectorStore(vectorStoreId, file.id);
    return { file, vectorStoreFile };
  }

  async listVectorStoreFiles(vectorStoreId: string, options?: { limit?: number }) {
    return await this.client.vectorStores.files.list(vectorStoreId, options);
  }

  async deleteFileFromVectorStore(vectorStoreId: string, fileId: string) {
    return await this.client.vectorStores.files.delete(fileId, {
      vector_store_id: vectorStoreId,
    });
  }

  async uploadDirectoryToVectorStore(vectorStoreId: string, directoryPath: string, recursive: boolean = false) {
    const fs = await import('fs');
    const path = await import('path');

    const results: any[] = [];
    const errors: any[] = [];
    let totalFiles = 0;

    const processDirectory = async (currentPath: string, relativePath: string = '') => {
      const items = fs.readdirSync(currentPath);
      
      for (const itemName of items) {
        const itemPath = path.join(currentPath, itemName);
        const stat = fs.statSync(itemPath);
        const displayPath = relativePath ? path.join(relativePath, itemName) : itemName;

        if (stat.isDirectory()) {
          if (recursive && !itemName.startsWith('.')) {
            // Recursively process subdirectory
            await processDirectory(itemPath, displayPath);
          }
          // Skip directories themselves
          continue;
        }

        // Skip hidden files
        if (itemName.startsWith('.')) {
          continue;
        }

        totalFiles++;

        try {
          console.log(`📁 Uploading: ${displayPath} (${(stat.size / 1024).toFixed(1)} KB)`);
          const result = await this.uploadAndAddFileToVectorStore(vectorStoreId, itemPath);
          results.push({ fileName: displayPath, filePath: itemPath, ...result });
          console.log(`✅ Uploaded: ${displayPath}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`❌ Failed to upload ${displayPath}: ${errorMessage}`);
          errors.push({ fileName: displayPath, filePath: itemPath, error: errorMessage });
        }
      }
    };

    await processDirectory(directoryPath);

    return { results, errors, totalFiles };
  }

  async chatWithVectorStore(input: string, vectorStoreIds: string[], model: string = 'gpt-4o-mini') {
    return await this.client.responses.create({
      model,
      input,
      tools: [{
        type: 'file_search',
        vector_store_ids: vectorStoreIds,
      }],
    });
  }
}

// Default instance for convenience
export const openaiConnector = new OpenAIConnector();