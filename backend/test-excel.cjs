const ExcelJS = require('exceljs');
async function run() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sheet1');
  ws.addRow(['Name', 'Phone']);
  ws.addRow(['Affan', '03001234567']);
  
  const headers = (ws.getRow(1).values).map(h => (h ? h.toString().trim().toLowerCase() : ''));
  console.log('Headers:', headers);
  
  let phoneIdx = -1;
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    if (phoneIdx === -1 && (h.includes('phone') || h.includes('mobile') || h.includes('whatsapp') || h.includes('contact') || h.includes('number'))) {
      phoneIdx = i;
    }
  }
  console.log('Phone Idx:', phoneIdx);
  console.log('Row 2 values:', ws.getRow(2).values);
  console.log('Phone in row 2:', ws.getRow(2).values[phoneIdx]);
}
run();
