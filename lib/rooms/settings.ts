export const MAX_ROOM_PLAYERS = 40;
export const DEFAULT_ROOM_PLAYERS = 8;
export function roomCapacity(settings: {maxPlayers?:number}) {
  return Number.isInteger(settings.maxPlayers) && settings.maxPlayers! >= 2 && settings.maxPlayers! <= MAX_ROOM_PLAYERS ? settings.maxPlayers! : DEFAULT_ROOM_PLAYERS;
}
export const ROOM_QUESTION_COUNTS = [5, 10, 15, 20, 30, 50] as const;
export const MAX_ROOM_QUESTIONS = 50;

export const ROOM_MODES = ['quiz', 'speedrun', 'match', 'sniper', 'blockblast', 'typing'] as const;
export type RoomMode = typeof ROOM_MODES[number];
export const ROOM_DURATIONS = [60, 90, 120, 180] as const;
export const ROOM_MODE_INFO: Record<RoomMode, { name: string; description: string; rules: string }> = {
  quiz: { name: 'Trắc nghiệm', description: 'Cùng trả lời từng câu', rules: 'Cùng một câu hỏi và thời hạn. Đúng được 100 điểm, nhanh được thêm tối đa 50 điểm.' },
  speedrun: { name: 'Tốc chiến', description: 'Đua trả lời liên tiếp', rules: 'Tự chuyển câu sau mỗi đáp án. Trả lời đúng liên tiếp để tăng combo; sai sẽ mất combo.' },
  match: { name: 'Lật thẻ', description: 'Ghi nhớ và ghép cặp', rules: 'Lật hai thẻ để ghép từ và nghĩa. Mỗi bàn có tối đa 6 cặp. Ghép đúng được 100 điểm và thưởng tốc độ.' },
  sniper: { name: 'Thiện xạ', description: 'Ngắm từ đúng với nghĩa', rules: 'Đọc nghĩa và bắn từ tiếng Anh tương ứng. Chọn sai hoặc hết thời gian một mục tiêu sẽ mất 1 trong 3 lượt.' },
  blockblast: { name: 'Xếp hình', description: 'Xếp khối, giải từ vựng', rules: 'Chọn khối rồi chọn ô để đặt. Đầy hàng hoặc cột sẽ xóa và ghi điểm. Hết 3 khối, trả lời từ vựng để nhận bộ mới; sai thêm một ô chặn.' },
  typing: { name: 'Chíu chíu luyện gõ', description: 'Gõ đủ từ để bắn', rules: 'Gõ đúng từ đang rơi để tự bắn. Dùng Backspace để sửa. Bỏ lỡ 3 mục tiêu sẽ hết lượt; trận vẫn tiếp tục với những người còn lại.' },
};
