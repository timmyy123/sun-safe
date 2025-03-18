import { Client, Databases, Query } from 'node-appwrite';

// Initialize the Appwrite client (server-side)
const client = new Client();

client
  .setEndpoint(process.env.APPWRITE_ENDPOINT || '')
  .setProject(process.env.APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_API_KEY || '');

// Initialize Database
export const databases = new Databases(client);

// Export database and collection IDs
export const databaseId = process.env.APPWRITE_DATABASE_ID || '';
export const cancerCollectionId = process.env.APPWRITE_CANCER_COLLECTION_ID || '';
export const uvCollectionId = process.env.APPWRITE_UV_COLLECTION_ID || '';