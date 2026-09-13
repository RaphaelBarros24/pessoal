const fs = require('node:fs');
const ExcelJS = require('exceljs');
const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
function iso(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const match = String(value ?? '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  throw new Error('Data não reconhecida na planilha.');
}
async function readItau(filename) {
  if (fs.statSync(filename).size > 10 * 1024 * 1024) throw new Error('A planilha deve ter até 10 MB.');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filename);
  let dueDate, header, sheet;
  for (const candidate of workbook.worksheets) {
    candidate.eachRow((row, n) => {
      const values = row.values;
      if (values.some(v => normalize(v) === 'vencimento')) {
        const col = values.findIndex(v => normalize(v) === 'vencimento');
        dueDate = iso(candidate.getRow(n + 1).getCell(col).value);
      }
      if (normalize(values[2]) === 'data' && normalize(values[4]) === 'parcelamento' && normalize(values[5]) === 'valor') { header = n; sheet = candidate; }
    });
  }
  if (!header || !dueDate) throw new Error('Formato Itaú não reconhecido. Exporte a fatura em Excel (.xlsx).');
  const entries = []; let payments = 0;
  sheet.eachRow((row, n) => {
    if (n <= header) return;
    const v = row.values;
    if (!v[2] || typeof v[5] !== 'number') return;
    const description = String(v[3] ?? '').trim();
    if (normalize(description) === 'pagamento efetuado') { payments++; return; }
    if (v[5] <= 0) throw new Error(`Linha ${n}: crédito/estorno não suportado nesta versão. Nenhum lançamento foi importado.`);
    const installment = v[4] ? String(v[4]).match(/^Parcela\s+(\d+)\s+de\s+(\d+)$/i) : null;
    if (v[4] && !installment) throw new Error(`Parcelamento não reconhecido na linha ${n}.`);
    entries.push({ description, purchaseDate: iso(v[2]), amount: Math.round(v[5] * 100), installmentNumber: installment ? Number(installment[1]) : 1, installmentCount: installment ? Number(installment[2]) : 1, sourceCard: String(v[10] ?? '') });
  });
  if (!entries.length || entries.length > 5000) throw new Error('Planilha sem compras ou com mais de 5.000 lançamentos.');
  return { dueDate, entries, payments };
}
module.exports = { readItau, normalize };
