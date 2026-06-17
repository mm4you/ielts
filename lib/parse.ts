export function parseMeaning(rawMeaning: string | null, dbPos?: string | null) {
  if (!rawMeaning || rawMeaning.trim() === '') {
    return { pos: dbPos || null, en: '', vi: '' };
  }

  const separator = rawMeaning.includes('///') ? '///' : '|||';
  const [enPart, viPart] = rawMeaning.split(separator);
  let en = enPart?.trim() || '';
  const vi = viPart?.trim() || '';

  let pos = dbPos || null;
  const match = en.match(/^(n|v|adj|adv|prep|conj|pron)\s+(.*)$/i) || en.match(/^(n|v|adj|adv|prep|conj|pron)\t(.*)$/i);

  if (match) {
    en = match[2].trim(); // always strip the tag from en
    if (!pos) {
      const posTag = match[1].toLowerCase();
    switch (posTag) {
      case 'n': pos = 'Danh từ'; break;
      case 'v': pos = 'Động từ'; break;
      case 'adj': pos = 'Tính từ'; break;
      case 'adv': pos = 'Trạng từ'; break;
      case 'prep': pos = 'Giới từ'; break;
      case 'conj': pos = 'Liên từ'; break;
      case 'pron': pos = 'Đại từ'; break;
      }
    }
  }

  return { pos, en, vi };
}
