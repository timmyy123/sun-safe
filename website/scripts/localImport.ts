import { Client, Databases, ID, Storage } from 'appwrite';
import dotenv from 'dotenv';
import path from 'path';
import fetch from 'node-fetch';
import csvParser from 'csv-parser';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import { Readable } from 'stream';

dotenv.config(); // loads .env
dotenv.config({ path: '.env.local', override: true }); // merges/overrides with .env.local

// Appwrite configuration
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || '');


// Constants from environment
const databaseId = process.env.APPWRITE_DATABASE_ID || '';
const cancerCollectionId = process.env.APPWRITE_CANCER_COLLECTION_ID || '';
const uvCollectionId = process.env.APPWRITE_UV_COLLECTION_ID || '';

// Create temp directory for downloads
const TEMP_DIR = path.join(process.cwd(), 'temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Number of records to process at once
const batchSize = 50;

// URLs to fetch data from
const ARPANSA_URL = 'https://data.gov.au/data/organization/australian-radiation-protection-and-nuclear-safety-agency-arpansa';

/**
 * Download a file from a URL to a local path
 */
async function downloadFileLocally(url: string): Promise<string> {
  console.log(`Downloading ${url} to local machine...`);
  
  try {
    const fileName = path.basename(url);
    const localPath = path.join(TEMP_DIR, fileName);
    
    const response = await fetch(url);
    const buffer = await response.buffer();
    
    fs.writeFileSync(localPath, buffer);
    console.log(`Saved to ${localPath}`);
    
    return localPath;
  } catch (error) {
    console.error(`Error downloading file: ${error}`);
    throw error;
  }
}

/**
 * Process a cancer data CSV file from local path
 */
async function processCancerCSV(filePath: string): Promise<number> {
  console.log(`Processing cancer data from ${filePath}`);
  
  return new Promise<number>((resolve, reject) => {
    const results: any[] = [];
    let count = 0;
    
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (data: any) => results.push(data))
      .on('end', async () => {
        try {
          console.log(`Parsed ${results.length} rows from cancer data`);
          
          // Process in batches
          for (let i = 0; i < results.length; i += batchSize) {
            const batch = results.slice(i, i + batchSize);
            console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(results.length / batchSize)}`);
            
            const promises = batch.map(row => {
              // Convert fields
              const year = parseInt(row.Year || row.year || '0') || 0;
              const count = parseInt(row.Count || row.count || '0') || 0;
              const rate = parseFloat(row['Age-specific rate'] || row.rate || '0') || 0;
              
              // Use REST API directly instead of SDK
              return fetch(
                `${process.env.APPWRITE_ENDPOINT}/databases/${databaseId}/collections/${cancerCollectionId}/documents`,
                {
                  method: 'POST',
                  headers: {
                    'X-Appwrite-Project': process.env.APPWRITE_PROJECT_ID || '',
                    'X-Appwrite-Key': process.env.APPWRITE_API_KEY || '',
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    documentId: ID.unique(),
                    data: {
                      data_type: row['Data type'] || row.data_type || '',
                      cancer_type: row['Cancer group/site'] || row.cancer_type || '',
                      year: year,
                      sex: row.Sex || row.sex || '',
                      age_group: row['Age group (years)'] || row.age_group || '',
                      count: count,
                      rate: rate,
                      icd10_code: row['ICD10 codes'] || row.icd10_code || ''
                    }
                  })
                }
              );
            });
            
            try {
              await Promise.all(promises);
              count += batch.length;
              console.log(`Processed ${count}/${results.length} cancer records`);
            } catch (error) {
              console.error('Error uploading cancer batch:', error);
            }
          }
          
          resolve(count);
        } catch (error) {
          console.error('Error processing cancer CSV:', error);
          reject(error);
        }
      })
      .on('error', (error: Error) => {
        console.error('Error reading cancer CSV:', error);
        reject(error);
      });
  });
}

/**
 * Process a UV data CSV file from local path
 */
async function processUVCSV(filePath: string): Promise<number> {
  const fileName = path.basename(filePath);
  console.log(`Processing UV data from ${filePath}`);
  
  return new Promise<number>((resolve, reject) => {
    const results: any[] = [];
    let count = 0;
    
    // Extract location from filename (e.g., townsville from uv-townsville-2007.csv)
    let location = 'Unknown';
    // This improved regex will extract location names with spaces
    const locationMatch = fileName.toLowerCase().match(/uv[\s_-]*([a-z\s]+?)[\s_-]*\d/i);
    if (locationMatch && locationMatch[1]) {
      // Properly capitalize: "gold coast" -> "Gold Coast"
      location = locationMatch[1].trim().split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
    
    console.log(`Identified location: ${location}`);
    
    // Map location to state with the complete list of cities
    let state = '';

    // Queensland cities
    if (['townsville', 'brisbane', 'gold coast', 'emerald'].includes(location.toLowerCase())) {
      state = 'QLD';
    }

    // New South Wales cities
    else if (['sydney', 'newcastle'].includes(location.toLowerCase())) {
      state = 'NSW';
    }

    // Victorian cities
    else if (location.toLowerCase() === 'melbourne') {
      state = 'VIC';
    }

    // Western Australia cities
    else if (location.toLowerCase() === 'perth') {
      state = 'WA';
    }

    // South Australia cities
    else if (location.toLowerCase() === 'adelaide') {
      state = 'SA';
    }

    // Northern Territory cities
    else if (['darwin', 'alice springs'].includes(location.toLowerCase())) {
      state = 'NT';
    }

    // Tasmania cities
    else if (location.toLowerCase() === 'kingston') {
      state = 'TAS';
    }

    // ACT cities
    else if (location.toLowerCase() === 'canberra') {
      state = 'ACT';
    }

    // Default if no match found (shouldn't happen with your dataset)
    if (!state) {
      console.warn(`Could not determine state for location: ${location}`);
      state = 'Unknown';
    }
    
    // Log the first row to see the structure
    let rowCount = 0;
    
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (data: any) => {
        results.push(data);
        
        // Log the first row to see the structure
        if (rowCount === 0) {
          console.log("Sample row data:", data);
          rowCount++;
        }
      })
      .on('end', async () => {
        try {
          console.log(`Parsed ${results.length} rows from UV data for ${location}`);
          
          // Calculate daily averages to reduce data volume
          const dailyUV = new Map<string, {sum: number, count: number, max: number}>();
          
          // Group by day and calculate averages
          results.forEach(row => {
            // Convert object keys to an array so we can index them
            const columns = Object.keys(row);

            // Pull date/time from the first column
            let dateTimeStr = row[columns[0]] || '';

            // Parse date as before:
            let dateStr;
            if (dateTimeStr) {
              try {
                if (dateTimeStr.includes('-')) {
                  // e.g. "2007-05-16 00:00:00"
                  dateStr = dateTimeStr.split(' ')[0]; 
                } else if (dateTimeStr.includes('/')) {
                  // e.g. "16/05/2007 00:00"
                  const parts = dateTimeStr.split(' ')[0].split('/');
                  if (parts.length === 3) {
                    dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                  }
                } else {
                  console.log(`Unrecognized date format: ${dateTimeStr}`);
                  return;
                }
              } catch {
                console.log(`Could not parse date: ${dateTimeStr}`);
                return;
              }
            }

            // If UV index is in the fourth column (index [3]),
            // adjust to match your actual CSV layout.
            const uvIndexStr = row[columns[3]] || '0';
            const uvIndex = parseFloat(uvIndexStr) || 0;

            // Skip invalid data
            if (uvIndex < 0) return;

            // Group by day
            if (!dailyUV.has(dateStr)) {
              dailyUV.set(dateStr, {sum: 0, count: 0, max: 0});
            }
            
            const dayData = dailyUV.get(dateStr)!;
            dayData.sum += uvIndex;
            dayData.count += 1;
            dayData.max = Math.max(dayData.max, uvIndex);
          });
          
          // Convert the daily averages to records to insert
          const dailyRecords = Array.from(dailyUV.entries()).map(([date, data]) => {
            const avgUV = data.count > 0 ? data.sum / data.count : 0;
            const dateObj = new Date(date);
            const month = dateObj.toLocaleString('en-US', { month: 'short' });
            
            return {
              state,
              location,
              date,
              month,
              avgUV: parseFloat(avgUV.toFixed(2)),
              maxUV: data.max
            };
          });
          
          console.log(`Created ${dailyRecords.length} daily records`);
          console.log("Sample daily record:", dailyRecords[0]);
          
          // Process in batches
          for (let i = 0; i < dailyRecords.length; i += batchSize) {
            const batch = dailyRecords.slice(i, i + batchSize);
            console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(dailyRecords.length / batchSize)}`);
            
            const promises = batch.map(record => {
              // Remove the location field from record before sending to Appwrite
              const { location, ...documentData } = record;
              
              // Use REST API directly instead of SDK
              return fetch(
                `${process.env.APPWRITE_ENDPOINT}/databases/${databaseId}/collections/${uvCollectionId}/documents`,
                {
                  method: 'POST',
                  headers: {
                    'X-Appwrite-Project': process.env.APPWRITE_PROJECT_ID || '',
                    'X-Appwrite-Key': process.env.APPWRITE_API_KEY || '',
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    documentId: ID.unique(),
                    data: documentData // Use documentData without the location field
                  })
                }
              );
            });
            
            try {
              await Promise.all(promises);
              count += batch.length;
              console.log(`Processed ${count}/${dailyRecords.length} UV records for ${location}`);
            } catch (error) {
              console.error('Error uploading UV batch:', error);
              // Log the first failed record and detailed error
              if (batch.length > 0) {
                console.error('Sample record that failed:', batch[0]);
              }
              console.error('Detailed error:', JSON.stringify(error, null, 2));
            }
          }
          
          resolve(count);
        } catch (error) {
          console.error('Error processing UV CSV:', error);
          reject(error);
        }
      })
      .on('error', (error: Error) => {
        console.error('Error reading UV CSV:', error);
        reject(error);
      });
  });
}

/**
 * Find data files on the ARPANSA website
 */
async function findARPANSADatasets(): Promise<string[]> {
  try {
    console.log('Fetching ARPANSA dataset listing...');
    const response = await fetch(ARPANSA_URL);
    const html = await response.text();
    
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Find dataset links
    const datasetLinks = Array.from(document.querySelectorAll('a[href*="/dataset/"]'))
      .map(link => link.getAttribute('href'))
      .filter(href => href !== null) as string[];
    
    console.log(`Found ${datasetLinks.length} dataset links`);
    
    const csvUrls: string[] = [];
    const uniqueCsvUrls = new Set<string>();
    
    // Process just a few datasets for testing
    // const limitedLinks = datasetLinks.slice(0, 2);
    
    for (const link of datasetLinks) {
      const datasetUrl = new URL(link, ARPANSA_URL).toString();
      console.log(`Checking dataset: ${datasetUrl}`);
      
      const datasetResponse = await fetch(datasetUrl);
      const datasetHtml = await datasetResponse.text();
      const datasetDom = new JSDOM(datasetHtml);
      const datasetDocument = datasetDom.window.document;
      
      // Find CSV download links
      const csvLinks = Array.from(datasetDocument.querySelectorAll('a[href$=".csv"]'))
        .map(link => link.getAttribute('href'))
        .filter(href => href !== null) as string[];
      
      console.log(`Found ${csvLinks.length} CSV files in dataset`);
      
      // Convert relative URLs to absolute
      const absoluteCsvLinks = csvLinks.map(link => {
        link = link.trim(); // remove hidden whitespace
        try {
          // Always resolve against datasetUrl, even if the link looks absolute
          return new URL(link, datasetUrl).toString();
        } catch {
          // If parsing fails, skip or handle as needed
          console.warn(`Skipping invalid link: ${link}`);
          return '';
        }
      }).filter(Boolean);
      
      for (const link of absoluteCsvLinks) {
        uniqueCsvUrls.add(link);
      }
    }
    
    return Array.from(uniqueCsvUrls);
  } catch (error) {
    console.error('Error finding datasets:', error);
    return [];
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    console.log('Starting data import process...');
    
    console.log('Using the following configuration:');
    console.log(`- Database ID: ${databaseId}`);
    console.log(`- Cancer Collection ID: ${cancerCollectionId}`);
    console.log(`- UV Collection ID: ${uvCollectionId}`);
    
    // Find datasets on the ARPANSA website
    const csvUrls = await findARPANSADatasets();
    console.log(`Found ${csvUrls.length} CSV files to process`);
    
    for (const url of csvUrls) {
      const fileName = path.basename(url);
      
      try {
        // Download to local machine
        const localPath = await downloadFileLocally(url);
        
        // Process based on file type
        let recordCount = 0;
        let sourceType = 'other';
        
        if (fileName.toLowerCase().includes('cancer') || fileName.toLowerCase().includes('incidence')) {
          recordCount = await processCancerCSV(localPath);
          sourceType = 'cancer';
        } else if (fileName.toLowerCase().includes('uv') || fileName.toLowerCase().includes('temperature')) {
          recordCount = await processUVCSV(localPath);
          sourceType = 'uv';
        } else {
          console.log(`Skipping unknown file type: ${fileName}`);
        }
        
        // Cleanup the local file
        try {
          fs.unlinkSync(localPath);
          console.log(`Removed temporary file: ${localPath}`);
        } catch(err) {
          console.error(`Error removing temp file ${localPath}:`, err);
        }
        
        console.log(`Completed processing ${fileName}`);
      } catch (error) {
        console.error(`Error processing ${fileName}:`, error);
      }
    }
    
    console.log('Import process completed!');
  } catch (error) {
    console.error('Error in main process:', error);
  }
}

// Run the script
main().catch(console.error);