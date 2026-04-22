const XLSX = require('xlsx');
const path = require('path');

const filePath = 'C:\\Users\\DATA-PSDKP\\Downloads\\DATA GTK SDN NGUWOK (1).xlsx';

try {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  console.log('--- SHEET DATA ---');
  console.log('Total Rows:', data.length);
  if (data.length > 0) {
    console.log('Columns:', Object.keys(data[0]).join(', '));
    console.log('Sample Data (First 10 rows):');
    console.log(JSON.stringify(data.slice(0, 10), null, 2));
  }
} catch (error) {
  console.error('Error reading Excel:', error.message);
}
