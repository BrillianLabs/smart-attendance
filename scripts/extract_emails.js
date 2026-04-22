const XLSX = require('xlsx');
const fs = require('fs');

const filePath = 'C:\\Users\\DATA-PSDKP\\Downloads\\DATA GTK SDN NGUWOK (1).xlsx';

try {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  const mapping = {};
  
  // Data starts from index 3 (4th row)
  data.slice(3).forEach(row => {
    const rawNip = row['__EMPTY_1'];
    const email = row['__EMPTY_3'];
    
    if (rawNip && email) {
      const cleanNip = rawNip.toString().replace(/\s/g, '');
      mapping[cleanNip] = email.trim();
    }
  });

  const outputPath = 'C:\\Users\\DATA-PSDKP\\.gemini\\antigravity\\brain\\e57dd68f-1941-4b2c-9b46-4aa4f5702594\\scratch\\nip_email_map.json';
  fs.writeFileSync(outputPath, JSON.stringify(mapping, null, 2));
  console.log('Mapping saved to:', outputPath);
  console.log('Sample mapping count:', Object.keys(mapping).length);
} catch (error) {
  console.error('Error:', error.message);
}
