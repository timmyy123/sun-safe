import { NextResponse } from 'next/server';
import { databases } from '@/lib/appwrite-server';
import { Query } from 'node-appwrite';

export async function GET(request: Request) {
  try {
    const databaseId = process.env.APPWRITE_DATABASE_ID;
    const cancerCollectionId = process.env.APPWRITE_CANCER_COLLECTION_ID;
    
    if (!databaseId || !cancerCollectionId) {
      throw new Error('Missing database or collection ID');
    }
    
    // Extract filters from query parameters
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const cancerType = searchParams.get('cancer_type');
    const sex = searchParams.get('sex');
    const ageGroup = searchParams.get('age_group');
    const groupBy = searchParams.get('groupBy') || 'none'; // none, year, age_group, cancer_type
    const limit = parseInt(searchParams.get('limit') || '1000');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Build query based on filters
    const queries = [];
    
    if (year) {
      queries.push(Query.equal('year', parseInt(year)));
    }
    
    if (cancerType) {
      queries.push(Query.equal('cancer_type', cancerType));
    }
    
    if (sex) {
      queries.push(Query.equal('sex', sex));
    }
    
    if (ageGroup) {
      queries.push(Query.equal('age_group', ageGroup));
    }
    
    // Add pagination
    queries.push(Query.limit(limit));
    queries.push(Query.offset(offset));
    
    // Execute query
    const response = await databases.listDocuments(
      databaseId,
      cancerCollectionId,
      queries
    );

    console.log(`Retrieved ${response.documents.length} cancer records from total ${response.total}`);
    
    // Transform the data for easier use
    let data = response.documents.map(doc => ({
      year: doc.year,
      cancer_type: doc.cancer_type,
      sex: doc.sex,
      age_group: doc.age_group,
      cases: doc.count,
      rate: doc.rate
    }));
    
    // Group data if needed
    if (groupBy !== 'none') {
      data = groupDataBy(data, groupBy);
    }

    // Return both data and pagination info
    return NextResponse.json({
      data,
      total: response.total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching cancer data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cancer data', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to group data
function groupDataBy(data, groupBy) {
  const grouped = {};
  
  data.forEach(item => {
    const key = item[groupBy];
    if (!key) return;
    
    if (!grouped[key]) {
      grouped[key] = { 
        [groupBy]: key,
        maleCount: 0,
        femaleCount: 0,
        totalCases: 0
      };
    }
    
    const cases = item.cases || 0;
    grouped[key].totalCases += cases;
    
    if (item.sex === 'Males') {
      grouped[key].maleCount += cases;
    } else if (item.sex === 'Females') {
      grouped[key].femaleCount += cases;
    }
  });
  
  return Object.values(grouped);
}