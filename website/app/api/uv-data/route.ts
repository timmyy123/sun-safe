import { NextResponse } from 'next/server';
import { databases } from '@/lib/appwrite-server';
import { Query } from 'node-appwrite';

export async function GET(request: Request) {
  try {
    const databaseId = process.env.APPWRITE_DATABASE_ID || '';
    const uvCollectionId = process.env.APPWRITE_UV_COLLECTION_ID || '';

    if (!databaseId || !uvCollectionId) {
      throw new Error('Missing database or collection ID');
    }

    const url = new URL(request.url);
    const groupBy = url.searchParams.get('groupBy') || 'year'; // 'year' or 'month'
    const stateParam = url.searchParams.get('state') || 'all';

    // Basic list query for demonstration
    const listQuery = [Query.limit(5000)]; // you can adjust as needed

    // If filtering by state
    if (stateParam !== 'all') {
      listQuery.push(Query.equal('state', stateParam));
    }

    const response = await databases.listDocuments(databaseId, uvCollectionId, listQuery);
    const docs = response.documents || [];

    // Convert raw docs to a simpler structure
    // e.g., { state, year, month, avgUV, maxUV }
    let data = docs.map(doc => {
      const dateStr = doc.date || '';
      const year = parseInt(dateStr.substring(0,4), 10);
      return {
        state: doc.state,
        year,
        month: doc.month,
        avgUV: doc.avgUV,
        maxUV: doc.maxUV
      };
    });

    // If groupBy=year, keep year; if groupBy=month, keep month field
    if (groupBy === 'year') {
      // We might want to combine docs with the same (state, year)
      // For demonstration, just return them all
      data = data.map(d => ({
        state: d.state,
        year: d.year,
        avgUV: d.avgUV,
        maxUV: d.maxUV
      }));
    } else {
      // groupBy=month
      data = data.map(d => ({
        state: d.state,
        month: d.month,
        avgUV: d.avgUV,
        maxUV: d.maxUV
      }));
    }

    return NextResponse.json({
      data,
      total: response.total,
    });
  } catch (error) {
    console.error('Error fetching UV data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch UV data', details: (error as Error).message },
      { status: 500 }
    );
  }
}