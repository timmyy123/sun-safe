import { NextResponse } from 'next/server';
import { databases, databaseId, cancerCollectionId } from '@/lib/appwrite-server';

export async function GET() {
  try {
    const response = await databases.listDocuments(
      databaseId,
      cancerCollectionId
    );

    // Transform data for visualization
    const data = response.documents.map(doc => ({
      year: doc.year,
      cancer_type: doc.cancer_type,
      sex: doc.sex,
      age_group: doc.age_group,
      cases: doc.count,
      rate: doc.rate
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching cancer data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cancer data' },
      { status: 500 }
    );
  }
}