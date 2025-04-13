export const charMap: Record<string, string> = {
  'ą': 'a', 'č': 'c', 'ę': 'e', 'ė': 'e', 'į': 'i',
  'š': 's', 'ų': 'u', 'ū': 'u', 'ž': 'z',
  'Ą': 'A', 'Č': 'C', 'Ę': 'E', 'Ė': 'E', 'Į': 'I',
  'Š': 'S', 'Ų': 'U', 'Ū': 'U', 'Ž': 'Z',
  '\u201C': '"', '\u201D': '"', '\u2018': "'", '\u2019': "'", '\u2013': '-', '\u2014': '-'
};

export const normalizeChar = (char: string): string => {
  return charMap[char] || char;
}; 