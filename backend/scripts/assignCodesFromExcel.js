// backend/scripts/assignCodesFromExcel.js
// Usage: node assignCodesFromExcel.js <path-to-excel.xlsx>
// Example: node assignCodesFromExcel.js ../students.xlsx

const XLSX = require('xlsx');
const mongoose = require('mongoose');
const Student = require('../models/Student');
require('dotenv').config({ path: '../.env' });

const excelPath = process.argv[2];
if (!excelPath) {
  console.error('❌ Please provide the Excel file path as argument');
  console.error('   Usage: node assignCodesFromExcel.js /path/to/students.xlsx');
  process.exit(1);
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Read Excel
  const wb = XLSX.readFile(excelPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

  // Skip header row, parse name/email/phone
  const students = [];
  for (let i = 1; i < rows.length; i++) {
    const [name, email, phone] = rows[i];
    if (name) students.push({ name: String(name).trim(), email: String(email || '').trim(), phone: String(phone || '').trim() });
  }

  console.log(`📋 Found ${students.length} students in Excel`);

  // Get all codes from DB
  const codes = await Student.find().sort({ createdAt: 1 }).lean();
  if (students.length > codes.length) {
    console.error(`❌ Not enough codes in DB. Have ${codes.length}, need ${students.length}`);
    process.exit(1);
  }

  // Assign each student a code
  const mapping = [];
  for (let i = 0; i < students.length; i++) {
    await Student.updateOne(
      { code: codes[i].code },
      { $set: { name: students[i].name, email: students[i].email, phone: students[i].phone } }
    );
    mapping.push({ code: codes[i].code, ...students[i] });
    console.log(`  ✓ ${codes[i].code} → ${students[i].name} (${students[i].email})`);
  }

  // Also write mapping back to a new Excel file for reference
  const outputWb = XLSX.utils.book_new();
  const outputData = [
    ['Code', 'Name', 'Email', 'Phone'],
    ...mapping.map(m => [m.code, m.name, m.email, m.phone])
  ];
  const outputWs = XLSX.utils.aoa_to_sheet(outputData);
  XLSX.utils.book_append_sheet(outputWb, outputWs, 'Assignments');

  const outputPath = excelPath.replace('.xlsx', '_with_codes.xlsx');
  XLSX.writeFile(outputWb, outputPath);
  console.log(`\n✅ Done! Mapping saved to: ${outputPath}`);
  console.log(`   ${students.length} students assigned codes successfully.`);

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});