export interface ScrubResult {
  text: string;
  hits: string[];
}

export const scrubPHI = (text: string): ScrubResult => {
  const hits: string[] = [];
  let out = text;

  const patterns: [RegExp, string][] = [
    [/[\w.+-]+@[\w-]+\.[\w.]+/g, 'email'],
    [/\b(?:\+91[- ]?)?\d{10}\b/g, 'phone'],
    [/\b\d{3}-\d{2}-\d{4}\b/g, 'ssn'],
    [/\bMRN[- ]?\d+\b/gi, 'mrn'],
    [/\b\d{2}[/-]\d{2}[/-]\d{4}\b/g, 'dob'],
    [/\b[A-Z]{2,}-?PH-?\d{4,}\b/g, 'policy'],
  ];

  patterns.forEach(([regex, label]) => {
    if (regex.test(out)) {
      hits.push(label);
      out = out.replace(regex, `[REDACTED:${label.toUpperCase()}]`);
    }
  });

  return { text: out, hits };
};

export const maskPatientValue = (kind: string, raw: string): string => {
  if (kind === 'policy') {
    return raw.replace(/^(.*?)([A-Za-z0-9]{4})$/, (_, a, b) => a.replace(/[A-Za-z0-9]/g, '•') + b);
  }
  if (kind === 'phone') {
    return raw.replace(/\d(?=(?:\D*\d){4})/g, '•');
  }
  if (kind === 'email') {
    return raw.replace(/^(.)([^@]*)(@.*)$/, (_, a, b, c) => a + '•'.repeat(Math.min(b.length, 5)) + c);
  }
  if (kind === 'mrn') {
    return raw.replace(/\d(?=\d{3})/g, '•');
  }
  if (kind === 'dob') {
    return raw.replace(/^\d{2} [A-Za-z]{3}/, '•• •••');
  }
  return raw.replace(/./g, '•');
};
