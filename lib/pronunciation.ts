/** Text recognition agreement only; this does not measure phonemes or accent. */
export function recognitionScore(target: string, spoken: string): number {
  const clean = (value: string) => value.toLowerCase().replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim();
  const a = clean(target), b = clean(spoken);
  if (!a || !b) return 0;
  let row = Array.from({length: b.length + 1}, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) next[j] = Math.min(next[j-1]+1, row[j]+1, row[j-1]+Number(a[i-1]!==b[j-1]));
    row = next;
  }
  return Math.round(100 * (1 - row[b.length] / Math.max(a.length, b.length)));
}
export function recognitionFeedback(score: number): string {
  return score === 100 ? 'Hệ thống đã nhận đúng từ bạn đọc. Hãy nghe lại bản thu để tự đối chiếu với giọng mẫu.' : score >= 70 ? 'Hệ thống nhận được từ gần giống. Bạn thử nghe mẫu, đọc chậm lại rồi thu thêm một lần nhé.' : 'Hệ thống chưa nhận đúng từ. Hãy kiểm tra micro, nghe mẫu và thử đọc lại ở nơi yên tĩnh.';
}
export function recordingExtension(mime: string): string {
  return mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm';
}
