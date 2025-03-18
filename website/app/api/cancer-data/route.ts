import { NextResponse } from 'next/server';
import { databases } from '@/lib/appwrite-server';
import { Query } from 'node-appwrite';

export async function GET(request: Request) {
  try {
    const databaseId = process.env.APPWRITE_DATABASE_ID || '';
    const cancerCollectionId = process.env.APPWRITE_CANCER_COLLECTION_ID || '';

    if (!databaseId || !cancerCollectionId) {
      throw new Error('Missing database or collection ID');
    }

    const url = new URL(request.url);
    
    // Extract query parameters
    const dataType = url.searchParams.get('data_type');
    const cancerType = url.searchParams.get('cancer_type');
    const year = url.searchParams.get('year');
    const sex = url.searchParams.get('sex');
    const ageGroup = url.searchParams.get('age_group');
    const limit = parseInt(url.searchParams.get('limit') || '5000');
    
    // Build query
    const queries: any[] = [Query.limit(limit)];
    
    if (dataType) {
      queries.push(Query.equal('data_type', dataType));
    }
    
    if (cancerType) {
      queries.push(Query.equal('cancer_type', cancerType));
    }
    
    if (year) {
      queries.push(Query.equal('year', parseInt(year, 10)));
    }
    
    if (sex) {
      queries.push(Query.equal('sex', sex));
    }
    
    if (ageGroup) {
      queries.push(Query.equal('age_group', ageGroup));
    }
    
    console.log('Fetching cancer data with query:', queries);
    
    // Execute query
    const response = await databases.listDocuments(
      databaseId,
      cancerCollectionId,
      queries
    );
    
    // Transform documents to match the expected structure
    const data = response.documents.map(doc => ({
      data_type: doc.data_type,
      cancer_type: doc.cancer_type,
      year: doc.year,
      sex: doc.sex,
      age_group: doc.age_group,
      count: doc.count,
      rate: doc.rate,
      icd10_code: doc.icd10_code
    }));
    
    console.log(`Retrieved ${data.length} cancer records from total ${response.total}`);
    
    return NextResponse.json({
      data,
      total: response.total
    });
  } catch (error) {
    console.error('Error fetching cancer data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cancer data', details: (error as Error).message },
      { status: 500 }
    );
  }
}