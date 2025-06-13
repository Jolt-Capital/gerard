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

  async uploadDirectoryToVectorStore(vectorStoreId: string, directoryPath: string) {
    const fs = await import('fs');
    const path = await import('path');

    // Read directory contents
    const files = fs.readdirSync(directoryPath);
    const results = [];
    const errors = [];

    for (const fileName of files) {
      const filePath = path.join(directoryPath, fileName);
      const stat = fs.statSync(filePath);

      // Skip directories and hidden files
      if (stat.isDirectory() || fileName.startsWith('.')) {
        continue;
      }

      try {
        console.log(`📁 Uploading: ${fileName} (${(stat.size / 1024).toFixed(1)} KB)`);
        const result = await this.uploadAndAddFileToVectorStore(vectorStoreId, filePath);
        results.push({ fileName, filePath, ...result });
        console.log(`✅ Uploaded: ${fileName}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ Failed to upload ${fileName}: ${errorMessage}`);
        errors.push({ fileName, filePath, error: errorMessage });
      }
    }

    return { results, errors, totalFiles: files.length };
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