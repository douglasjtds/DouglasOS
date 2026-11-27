export interface ParsedLine {
  name: string;
  args: string[];
  argText: string;
}

function splitArgs(text: string): string[] {
  const args: string[] = [];
  let current = "";
  let inQuotes = false;
  let has = false;
  for (const ch of text) {
    if (ch === '"') {
      inQuotes = !inQuotes;
      has = true;
    } else if (!inQuotes && /\s/.test(ch)) {
      if (has) args.push(current);
      current = "";
      has = false;
    } else {
      current += ch;
      has = true;
    }
  }
  if (has) args.push(current);
  return args;
}

export function parseLine(line: string): ParsedLine | null {
  const trimmed = line.trim();
  if (trimmed === "") return null;
  const match = /^(\S+)\s*([\s\S]*)$/.exec(trimmed)!;
  const argText = match[2].trim();
  return { name: match[1].toLowerCase(), args: splitArgs(argText), argText };
}
