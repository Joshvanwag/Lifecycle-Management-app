import { read, utils } from "xlsx";

export interface ParsedSpreadsheet {
  headers: string[];
  rows: Array<Record<string, string>>;
}

export const MAX_IMPORT_BYTES = 50 * 1024 * 1024;

function parseCsv(text: string): ParsedSpreadsheet {
  const source = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(current);
      if (row.some((cell) => cell.trim())) {
        rows.push(row);
      }
      row = [];
      current = "";
      continue;
    }
    current += char;
  }

  if (current || row.length > 0) {
    row.push(current);
    if (row.some((cell) => cell.trim())) {
      rows.push(row);
    }
  }

  const headers = (rows[0] ?? []).map((header) => header.trim()).filter(Boolean);
  const records = rows.slice(1).map((cells) => {
    const record: Record<string, string> = {};
    headers.forEach((header, headerIndex) => {
      record[header] = (cells[headerIndex] ?? "").trim();
    });
    return record;
  });

  return { headers, rows: records };
}

function parseXlsx(buffer: ArrayBuffer): ParsedSpreadsheet {
  const workbook = read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { headers: [], rows: [] };
  }

  const sheet = workbook.Sheets[sheetName];
  const matrix = utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    raw: false,
    defval: "",
  });
  const headers = (matrix[0] ?? []).map((header) => String(header).trim()).filter(Boolean);
  const rows = matrix.slice(1).map((cells) => {
    const record: Record<string, string> = {};
    headers.forEach((header, headerIndex) => {
      record[header] = String(cells[headerIndex] ?? "").trim();
    });
    return record;
  });

  return { headers, rows };
}

export async function parseImportFile(file: File): Promise<ParsedSpreadsheet> {
  if (file.size > MAX_IMPORT_BYTES) {
    throw new Error("File is larger than 50 MB.");
  }

  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    return parseXlsx(await file.arrayBuffer());
  }

  if (name.endsWith(".csv") || file.type.includes("csv") || file.type === "text/plain") {
    return parseCsv(await file.text());
  }

  throw new Error("Upload a CSV or Excel (.xlsx) file.");
}
