const ExcelJS = require('exceljs');
const fs = require('fs');

async function test() {
  fs.writeFileSync('test.csv', 'Name,Phone\nJohn,1234567890\n');
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.readFile('test.csv');
    console.log('Success reading CSV with xlsx.readFile!');
  } catch (err) {
    console.error('Error reading CSV:', err.message);
  }
}
test();
