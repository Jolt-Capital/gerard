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
}

// Default instance for convenience
export const openaiConnector = new OpenAIConnector();