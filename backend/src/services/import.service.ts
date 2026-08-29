import ExcelJS from 'exceljs';
import Contact from '../models/Contact.js';
import { normalizePhoneNumber } from '../utils/phone.utils.js';

export const analyzeExcelFile = async (filePath: string) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const sheets = workbook.worksheets.map((sheet) => sheet.name);
  if (sheets.length === 0) {
    throw new Error('No worksheets found in the Excel file');
  }

  const firstSheet = workbook.worksheets[0];
  const firstRow = firstSheet.getRow(1);
  const headers = (firstRow.values as string[]).filter(v => v !== undefined).map((h) => (h ? h.toString().trim() : ''));

  let phoneColumn = '';
  let nameColumn = '';
  let emailColumn = '';

  for (const header of headers) {
    const lower = header.toLowerCase();
    if (!phoneColumn && (lower.includes('phone') || lower.includes('mobile') || lower.includes('whatsapp') || lower.includes('contact'))) {
      phoneColumn = header;
    }
    if (!nameColumn && (lower.includes('name') || lower.includes('first name') || lower.includes('full name'))) {
      nameColumn = header;
    }
    if (!emailColumn && (lower.includes('email') || lower.includes('e-mail'))) {
      emailColumn = header;
    }
  }

  return {
    sheets,
    headers,
    detectedColumns: { phoneColumn, nameColumn, emailColumn },
  };
};

export const processImport = async (
  userId: string,
  filePath: string,
  originalFileName: string,
  sheetName: string,
  mapping: { phone: string; name?: string; email?: string },
  defaultCountry: string
) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const sheet = workbook.getWorksheet(sheetName);
  if (!sheet) {
    throw new Error(`Sheet ${sheetName} not found`);
  }

  const firstRow = sheet.getRow(1);
  const headers = (firstRow.values as string[]).map(h => (h ? h.toString().trim() : ''));
  
  const phoneIdx = headers.indexOf(mapping.phone);
  const nameIdx = mapping.name ? headers.indexOf(mapping.name) : -1;
  const emailIdx = mapping.email ? headers.indexOf(mapping.email) : -1;

  if (phoneIdx === -1) {
    throw new Error(`Phone column "${mapping.phone}" not found`);
  }

  const invalidRows: any[] = [];
  let importedCount = 0;
  let duplicatesCount = 0;

  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    const values = row.values as any[];
    const rawPhone = values[phoneIdx] ? values[phoneIdx].toString() : '';
    const name = nameIdx !== -1 && values[nameIdx] ? values[nameIdx].toString() : undefined;
    const email = emailIdx !== -1 && values[emailIdx] ? values[emailIdx].toString() : undefined;

    const normalizedPhone = normalizePhoneNumber(rawPhone, defaultCountry);

    if (!normalizedPhone) {
      invalidRows.push({ rowNumber, rawPhone, reason: 'Invalid phone number format' });
      continue;
    }

    const existing = await Contact.findOne({ userId, normalizedPhoneNumber: normalizedPhone });
    if (existing) {
      duplicatesCount++;
      continue;
    }

    await Contact.create({
      userId,
      phoneNumber: rawPhone,
      normalizedPhoneNumber: normalizedPhone,
      name,
      email,
      source: 'EXCEL_IMPORT',
    });
    importedCount++;
  }

  return {
    success: true,
    importedCount,
    duplicatesCount,
    invalidRowsCount: invalidRows.length,
    invalidRows,
  };
};
