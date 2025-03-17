// lib/appwrite.ts
import { Client, Databases } from 'appwrite';

// Initialize Appwrite client - without exposing sensitive defaults
const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1') // Public URL is okay
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || ''); // Empty fallback instead of real ID

// Initialize Database
export const databases = new Databases(client);

// Database and collection IDs - use empty strings as fallbacks
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
const CANCER_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_CANCER_COLLECTION_ID || '';
const UV_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_UV_COLLECTION_ID || '';

// Function to fetch cancer data
export async function fetchCancerData() {
    try {
        // Check if we have the required configuration
        if (!DATABASE_ID || !CANCER_COLLECTION_ID) {
            throw new Error('Missing Appwrite configuration for cancer data');
        }
        
        const response = await databases.listDocuments(
            DATABASE_ID, 
            CANCER_COLLECTION_ID
        );
        
        // Transform data for visualization
        return response.documents.map(doc => ({
            year: doc.year,
            cases: doc.count
        }));
    } catch (error) {
        console.error('Error fetching cancer data:', error);
        throw error;
    }
}

// Function to fetch UV data
export async function fetchUVData() {
    try {
        // Check if we have the required configuration
        if (!DATABASE_ID || !UV_COLLECTION_ID) {
            throw new Error('Missing Appwrite configuration for UV data');
        }
        
        const response = await databases.listDocuments(
            DATABASE_ID, 
            UV_COLLECTION_ID
        );
        
        // Transform the state-by-state data into monthly averages
        return response.documents.map(doc => ({
            month: doc.month,
            avgUV: doc.avgUV,
            avgTemp: doc.avgTemp
        }));
    } catch (error) {
        console.error('Error fetching UV data:', error);
        throw error;
    }
}