const ExcelJS = require('exceljs');
async function test() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('My Sheet');
  sheet.addRow(['Name', 'Phone', 'ID']);
  sheet.addRow(['John', '1234567890', 'A1']);
  
  const row1 = sheet.getRow(1);
  console.log('row1.values:', row1.values, Array.isArray(row1.values));
  
  const row2 = sheet.getRow(2);
  console.log('row2.values:', row2.values, Array.isArray(row2.values));
}
test();
