import { Client, ID } from 'appwrite';
import dotenv from 'dotenv';
import path from 'path';
import fetch from 'node-fetch';
import fs from 'fs';
import xlsx from 'xlsx';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

// Declare TEMP_DIR first
const TEMP_DIR = path.join(process.cwd(), 'temp');

// Then build the full path
const CANCER_FILENAME = 'CDiA-2024-Book-1a-Cancer-incidence-age-standardised-rates-5-year-age-groups.xlsx';
const CANCER_FILE_PATH = path.join(TEMP_DIR, CANCER_FILENAME);

// Reduce batch size for better handling
const batchSize = 10000; // Reduced from 1000
const databaseId = process.env.APPWRITE_DATABASE_ID || '';
const cancerCollectionId = process.env.APPWRITE_CANCER_COLLECTION_ID || '';

// Add concurrency control
const MAX_CONCURRENT_REQUESTS = 20;

// Create temp directory if needed
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

async function processExcelFile(): Promise<number> {
  console.log(`Processing cancer data from ${CANCER_FILE_PATH}`);
  
  try {
    // Read Excel file
    const workbook = xlsx.readFile(CANCER_FILE_PATH);
    console.log(`Found ${workbook.SheetNames.length} sheets`);
    
    // Use the second sheet as it contains the data
    const sheetName = workbook.SheetNames[1];
    console.log(`Using sheet: ${sheetName}`);
    const worksheet = workbook.Sheets[sheetName];
    
    // Get range of the sheet
    const range = xlsx.utils.decode_range(worksheet['!ref'] || 'A1');
    console.log(`Sheet range: ${worksheet['!ref']}`);
    
    // Skip header rows
    const skipRows = 4;
    let count = 0;
    const batchedRows = [];
    
    // Process larger chunks at once
    for (let rowNum = skipRows; rowNum <= range.e.r; rowNum++) {
      const row: any = {};
      
      // Only extract the columns we need
      const dataTypeCell = worksheet[xlsx.utils.encode_cell({r: rowNum, c: 0})];
      const cancerTypeCell = worksheet[xlsx.utils.encode_cell({r: rowNum, c: 1})];
      const yearCell = worksheet[xlsx.utils.encode_cell({r: rowNum, c: 2})];
      
      // Quick check - if these essential cells are empty, skip row
      if (!dataTypeCell || !cancerTypeCell || !yearCell) continue;
      
      row['Data type'] = String(dataTypeCell.v || '');
      row['Cancer group/site'] = String(cancerTypeCell.v || '');
      row['Year'] = parseInt(String(yearCell.v || '0'));
      
      // Skip rows with missing essential data
      if (!row['Data type'] || !row['Cancer group/site'] || row['Year'] === 0) {
        continue;
      }
      
      // Now extract remaining columns only if we'll use this row
      row['Sex'] = String(worksheet[xlsx.utils.encode_cell({r: rowNum, c: 3})]?.v || '');
      row['Age group'] = String(worksheet[xlsx.utils.encode_cell({r: rowNum, c: 4})]?.v || '');
      row['Count'] = parseInt(String(worksheet[xlsx.utils.encode_cell({r: rowNum, c: 5})]?.v || '0'));
      row['Rate'] = parseFloat(String(worksheet[xlsx.utils.encode_cell({r: rowNum, c: 6})]?.v || '0'));
      row['ICD10 codes'] = String(worksheet[xlsx.utils.encode_cell({r: rowNum, c: 11})]?.v || '');
      
      batchedRows.push(row);
      
      // Use larger batches but process less frequently
      if (batchedRows.length >= batchSize) {
        await processBatchFast(batchedRows);
        count += batchedRows.length;
        
        // Log progress less frequently
        if (count % 1000 === 0) {
          console.log(`Processed ${count} records so far`);
        }
        
        batchedRows.length = 0;
      }
    }
    
    // Process remaining rows
    if (batchedRows.length > 0) {
      await processBatchFast(batchedRows);
      count += batchedRows.length;
    }
    
    return count;
  } catch (error) {
    console.error('Error processing cancer Excel:', error);
    throw error;
  }
}

// Modify the processBatchFast function to expose errors and log status codes
async function processBatchFast(batch: any[]): Promise<void> {
  console.log(`Processing batch of ${batch.length} records`);
  
  // Process in smaller chunks to control concurrency
  for (let i = 0; i < batch.length; i += MAX_CONCURRENT_REQUESTS) {
    const chunk = batch.slice(i, i + MAX_CONCURRENT_REQUESTS);
    
    const promises = chunk.map(row => {
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
              data_type: row['Data type'],
              cancer_type: row['Cancer group/site'],
              year: row['Year'],
              sex: row['Sex'],
              age_group: row['Age group'],
              count: row['Count'],
              rate: row['Rate'],
              icd10_code: row['ICD10 codes']
            }
          })
        }
      ).then(async response => {
        if (!response.ok) {
          // Log the status code of failed responses
          const text = await response.text();
          console.error(`Error status: ${response.status}, message: ${text}`);
          
          // If rate limited, throw error to trigger delay
          if (response.status === 429) {
            throw new Error('Rate limit hit');
          }
        }
        return response;
      });
    });
    
    try {
      await Promise.all(promises);
    } catch (error) {
      // Add type guard to fix the TypeScript error
      if (error instanceof Error && error.message === 'Rate limit hit') {
        console.log('Rate limit detected, pausing for 10 seconds');
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second pause
      } else {
        console.error('Error in batch processing:', error);
      }
    }
    
    // Regular delay between mini-batches
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Longer delay between full batches
  await new Promise(resolve => setTimeout(resolve, 1000));
}

async function downloadFile(url: string): Promise<string> {
  console.log(`Downloading ${url}`);
  
  try {
    const response = await fetch(url);
    const buffer = await response.buffer();
    
    const fileName = path.basename(url);
    const localPath = path.join(TEMP_DIR, fileName);
    
    fs.writeFileSync(localPath, buffer);
    console.log(`Saved to ${localPath}`);
    
    return localPath;
  } catch (error) {
    console.error(`Error downloading file: ${error}`);
    throw error;
  }
}

async function main(): Promise<void> {
  try {
    console.log('Starting cancer data import process...');
    
    // Download file (always download fresh copy)
    const url = 'https://www.aihw.gov.au/getmedia/2bea39d6-4cb9-4fa7-815d-3bb56a795bb5/CDiA-2024-Book-1a-Cancer-incidence-age-standardised-rates-5-year-age-groups.xlsx';
    await downloadFile(url);
    
    const recordCount = await processExcelFile();
    console.log(`Import completed! Added ${recordCount} cancer records.`);
  } catch (error) {
    console.error('Error in main process:', error);
  }
}

main().catch(console.error);