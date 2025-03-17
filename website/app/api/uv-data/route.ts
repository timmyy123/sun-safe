import { NextResponse } from 'next/server';
import { databases } from '@/lib/appwrite-server';

export async function GET() {
  try {
    const databaseId = process.env.APPWRITE_DATABASE_ID;
    const uvCollectionId = process.env.APPWRITE_UV_COLLECTION_ID;
    
    if (!databaseId || !uvCollectionId) {
      throw new Error('Missing database or collection ID');
    }
    
    const response = await databases.listDocuments(
      databaseId,
      uvCollectionId
    );

    // Transform the data for easier use in visualizations
    const data = response.documents.map(doc => ({
      state: doc.state,
      date: doc.date,
      month: doc.month,
      avgUV: doc.avgUV,
      maxUV: doc.maxUV
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching UV data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch UV data' },
      { status: 500 }
    );
  }
}