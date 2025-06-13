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
}

// Default instance for convenience
export const openaiConnector = new OpenAIConnector();