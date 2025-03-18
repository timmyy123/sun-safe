import { NextResponse } from 'next/server';
import { databases } from '@/lib/appwrite-server';
import { Query } from 'node-appwrite';

export async function GET() {
  try {
    const databaseId = process.env.APPWRITE_DATABASE_ID || '';
    const cancerCollectionId = process.env.APPWRITE_CANCER_COLLECTION_ID || '';

    if (!databaseId || !cancerCollectionId) {
      throw new Error('Missing database or collection ID');
    }
    
    // Get a sample of documents to extract unique cancer types
    // We limit to 1000 to ensure we don't hit API limits
    const response = await databases.listDocuments(
      databaseId, 
      cancerCollectionId,
      [Query.limit(1000)]
    );
    
    // Extract unique cancer types
    const types = [...new Set(response.documents.map(doc => doc.cancer_type))].sort();
    
    console.log(`Found ${types.length} unique cancer types`);
    
    return NextResponse.json({ types });
  } catch (error) {
    console.error('Error fetching cancer types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cancer types', details: (error as Error).message },
      { status: 500 }
    );
  }
}