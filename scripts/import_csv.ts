import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or Key is missing from environment variables.');
  process.exit(1);
}

if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('Using Service Role Key (bypassing RLS)');
} else {
  console.log('Using Anon Key (subject to RLS)');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Imports data from a CSV file into a Supabase table.
 * @param filePath Path to the CSV file
 * @param tableName Name of the Supabase table
 */
async function importCsv(filePath: string, tableName: string) {
  console.log(`Reading CSV file: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found at ${filePath}`);
    return;
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  
  try {
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`Parsed ${records.length} records. Importing into table: ${tableName}`);

    const { error } = await supabase
      .from(tableName)
      .insert(records);

    if (error) {
      console.error('Error importing data:', error.message);
      console.error('Details:', error.details);
      console.error('Hint:', error.hint);
    } else {
      console.log(`Successfully imported ${records.length} records into ${tableName}!`);
    }
  } catch (err) {
    console.error('Error parsing CSV:', err instanceof Error ? err.message : String(err));
  }
}

// Example usage:
// Run with: npx tsx scripts/import_csv.ts <file_path> <table_name>
const args = process.argv.slice(2);
if (args.length >= 2) {
  const [file, table] = args;
  importCsv(path.resolve(process.cwd(), file), table);
} else {
  console.log('Usage: npx tsx scripts/import_csv.ts <path_to_csv> <table_name>');
}
