import { NextResponse } from 'next/server';
import { databases } from '@/lib/appwrite-server';
import { Query } from 'node-appwrite';

export async function GET(request: Request) {
  try {
    const databaseId = process.env.APPWRITE_DATABASE_ID;
    const uvCollectionId = process.env.APPWRITE_UV_COLLECTION_ID;
    
    if (!databaseId || !uvCollectionId) {
      throw new Error('Missing database or collection ID');
    }

    // Extract pagination from query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5000');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build queries (no year restriction)
    const queries = [Query.limit(limit), Query.offset(offset)];

    // Fetch all documents within pagination limit
    const response = await databases.listDocuments(
      databaseId,
      uvCollectionId,
      queries
    );

    // Simply return them all so your chart can show any year
    const data = response.documents.map(doc => ({
      state: doc.state,
      date: doc.date,
      month: doc.month,
      avgUV: doc.avgUV,
      maxUV: doc.maxUV
    }));

    return NextResponse.json({
      data,
      total: response.total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching UV data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch UV data', details: (error as Error).message },
      { status: 500 }
    );
  }
}