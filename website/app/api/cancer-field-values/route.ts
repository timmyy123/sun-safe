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
    
    // Fetch all unique values with proper pagination to ensure we get all values
    // This is critical for correctly populating the dropdowns
    const response = await databases.listDocuments(
      databaseId, 
      cancerCollectionId,
      [Query.limit(5000)] // Increase limit to get more complete results
    );
    
    // Extract unique values for each field
    const dataTypes = [...new Set(response.documents.map(doc => doc.data_type))].filter(Boolean).sort();
    const cancerTypes = [...new Set(response.documents.map(doc => doc.cancer_type))].filter(Boolean).sort();
    const sexOptions = [...new Set(response.documents.map(doc => doc.sex))].filter(Boolean).sort();
    const ageGroups = [...new Set(response.documents.map(doc => doc.age_group))].filter(Boolean).sort();
    const years = [...new Set(response.documents.map(doc => doc.year))].filter(Boolean).sort();
    
    console.log({
      dataTypesCount: dataTypes.length,
      cancerTypesCount: cancerTypes.length,
      sexOptionsCount: sexOptions.length,
      ageGroupsCount: ageGroups.length,
      yearsCount: years.length
    });
    
    return NextResponse.json({
      dataTypes,
      cancerTypes,
      sexOptions,
      ageGroups,
      years,
      total: response.total
    });
  } catch (error) {
    console.error('Error fetching cancer field values:', error);
    return NextResponse.json(
      { error: 'Failed to fetch field values', details: (error as Error).message },
      { status: 500 }
    );
  }
}