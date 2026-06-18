'use client';

import { useState, useEffect, useRef } from 'react';
import { parseMeaning } from '@/lib/parse';
import SaveToCollection from '@/app/(main)/collections/SaveToCollection';

// Hack for TypeScript to recognize Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface PronounceRoastProps {
  wordId: number;
  wordText: string;
  onFinish?: () => void;
}

const isSouthernVoice = (name: string) => {
  const lower = name.toLowerCase();
  // Khớp các giọng miền Nam nổi tiếng của Microsoft và Apple
  if (lower.includes('hoaimy') || lower.includes('hoài my') || lower.includes('tuong') || lower.includes('tương') || lower.includes('dung') || lower.includes('dũng') || lower.includes('kiet') || lower.includes('kiệt')) {
    return true;
  }
  // Tách chữ để kiểm tra từ "nam" độc lập, tránh bị khớp nhầm với "vietnam" hay "vietnamese"
  const words = lower.split(/[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/u);
  return words.includes('nam') && !words.includes('vietnam') && !words.includes('vietnamese');
};

export default function PronounceRoast({ wordId, wordText, onFinish }: PronounceRoastProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcribed, setTranscribed] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    roast: string;
    wordDetails?: {
      word: string;
      ipa?: string | null;
      pos?: string | null;
      meaning_vi: string;
      example?: string | null;
      synonyms?: string | null;
    };
  } | null>(null);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [viVoices, setViVoices] = useState<SpeechSynthesisVoice[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const isUnmountedRef = useRef(false);

  // Load voices early and add cleanup for unmount
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const list = window.speechSynthesis.getVoices().filter(v => v.lang.replace('_', '-').startsWith('vi'));
        setViVoices(list);
      }
    };

    loadVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    return () => {
      isUnmountedRef.current = true;
      // Dọn dẹp Mic nếu đang thu
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      // Dừng âm thanh đang phát và xóa sạch callback tránh chạy ngầm khi đổi từ
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.onended = null;
        currentAudioRef.current.onerror = null;
        currentAudioRef.current.src = '';
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        // Cú lừa Safari: nói câu rỗng rồi hủy để xóa sạch hàng đợi bị nghẽn trên iOS
        try {
          const dummy = new SpeechSynthesisUtterance('');
          window.speechSynthesis.speak(dummy);
          window.speechSynthesis.cancel();
        } catch (e) {}
      }
    };
  }, []);

  const speakRoast = (text: string) => {
    // Dừng âm thanh đang phát & hủy callbacks của lượt phát cũ để không bị lặp đè
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.onended = null;
      currentAudioRef.current.onerror = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setIsPlaying(true);
    
    // Tách câu để lách luật 200 ký tự của Google TTS
    // Tách dựa trên dấu câu (. ! ?)
    let sentences = text.match(/[^.!?]+[.!?]+/g);
    
    // Nếu AI không dùng dấu câu, cắt cứng theo 150 ký tự
    if (!sentences) {
      sentences = text.match(/.{1,150}(\s|$)/g) || [text];
    }

    let currentSentence = 0;

    const playSentence = (index: number) => {
      // Ngăn chặn việc chạy đè nhiều nhánh callback trùng lặp
      if (index !== currentSentence) return;

      if (!sentences || index >= sentences.length) {
        setIsPlaying(false);
        return;
      }

      const chunk = sentences[index].trim();
      if (!chunk) {
        currentSentence = index + 1;
        playSentence(currentSentence);
        return;
      }

      let handled = false;
      const handleNext = () => {
        if (handled) return;
        handled = true;
        
        if (isUnmountedRef.current) return;
        currentSentence = index + 1;
        playSentence(currentSentence);
      };

      let freshVoices: SpeechSynthesisVoice[] = [];
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        freshVoices = window.speechSynthesis.getVoices().filter(v => v.lang.replace('_', '-').startsWith('vi'));
      }

      // Chỉ chọn giọng native nếu đó là giọng miền Nam. Nếu không có giọng Nam, để selectedVoice = undefined để nó rớt xuống nhánh Proxy (Edge TTS Nam)
      const selectedVoice = freshVoices.find(v => isSouthernVoice(v.name));

      if (selectedVoice && typeof window !== 'undefined' && window.speechSynthesis) {
        const utter = new SpeechSynthesisUtterance(chunk);
        utter.voice = selectedVoice;
        utter.lang = selectedVoice.lang;
        const isSouth = isSouthernVoice(selectedVoice.name);
        utter.rate = isSouth ? 1.15 : 1.0; // Giọng tự nhiên, tốc độ 1.15 theo yêu cầu sếp
        utter.onend = () => {
          handleNext();
        };
        utter.onerror = () => {
          handleNext();
        };
        window.speechSynthesis.speak(utter);
      } else {
        // Sử dụng Edge TTS proxy với giọng miền Nam chất lượng cao
        playProxyTTS(chunk, handleNext);
      }
    };

    const playProxyTTS = (chunk: string, callback: () => void) => {
      const url = `/api/tts?text=${encodeURIComponent(chunk)}`;
      const audio = currentAudioRef.current || new Audio();
      currentAudioRef.current = audio;
      
      audio.src = url;
      audio.playbackRate = 1.15; // Đọc tự nhiên, không bị líu lưỡi
      
      let localHandled = false;
      const localCallback = () => {
        if (localHandled) return;
        localHandled = true;
        callback();
      };

      audio.onended = () => {
        localCallback();
      };

      const playStandardFallback = () => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          const utter = new SpeechSynthesisUtterance(chunk);
          utter.lang = 'vi-VN';
          utter.rate = 1.15; // Tốc độ 1.15 theo yêu cầu
          
          // Gán giọng Tiếng Việt từ hệ thống để tránh bị giọng Anh đọc đè tiếng Việt
          const systemVoices = window.speechSynthesis.getVoices();
          const viVoice = systemVoices.find(v => v.lang.replace('_', '-').startsWith('vi'));
          if (viVoice) {
            utter.voice = viVoice;
          }

          utter.onend = () => {
            localCallback();
          };
          utter.onerror = () => {
            localCallback();
          };
          window.speechSynthesis.speak(utter);
        } else {
          localCallback();
        }
      };

      audio.onerror = (e) => {
        console.warn("Edge TTS Proxy failed chunk, using standard Web Speech fallback:", chunk, e);
        if (currentAudioRef.current) {
          currentAudioRef.current.pause();
          currentAudioRef.current.onended = null;
          currentAudioRef.current.onerror = null;
        }
        playStandardFallback();
      };
      
      audio.play().catch(e => {
        console.warn("Audio play blocked by browser, using standard Web Speech fallback:", e);
        if (currentAudioRef.current) {
          currentAudioRef.current.pause();
          currentAudioRef.current.onended = null;
          currentAudioRef.current.onerror = null;
        }
        playStandardFallback();
      });
    };

    playSentence(0);
  };

  const startRecording = async () => {
    if (typeof window === 'undefined') return;
    
    // 1. Reset trạng thái phát âm thanh & dọn sạch hàng đợi nói của trình duyệt để tránh kích hoạt lại
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.onended = null;
      currentAudioRef.current.onerror = null;
      currentAudioRef.current.src = "";
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);

    // 2. Unlock Web Speech API bằng tiếng câm sau khi đã dọn sạch hàng đợi
    if (window.speechSynthesis) {
      const dummy = new SpeechSynthesisUtterance('');
      dummy.volume = 0;
      window.speechSynthesis.speak(dummy);
    }

    // Unlock HTML5 Audio bằng cách phát tiếng tĩnh rất ngắn ngay khi người dùng click
    if (!currentAudioRef.current) {
      currentAudioRef.current = new Audio();
    }
    const audio = currentAudioRef.current;
    audio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
    audio.play().then(() => {
      audio.pause();
    }).catch(e => {
      console.warn("Silent audio unlock failed:", e);
    });

    try {
      setError('');
      setTranscribed('');
      setResult(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // THUẬT TOÁN TỰ ĐỘNG NGẮT KHI IM LẶNG (VAD)
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      let silenceStart = Date.now();
      let hasSpoken = false;
      let checkAudioInterval: NodeJS.Timeout;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstart = () => {
        setIsRecording(true);
        silenceStart = Date.now();
        
        checkAudioInterval = setInterval(() => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
          const average = sum / bufferLength;

          // Nếu âm lượng đủ lớn (ngưỡng 15 để tránh bị kích hoạt bởi tiếng thở/tiếng ồn nhỏ)
          if (average > 15) { 
            hasSpoken = true;
            silenceStart = Date.now(); // Reset bộ đếm im lặng
          } else {
            // Nếu đã nói xong và im lặng kéo dài 900ms -> TỰ ĐỘNG NGẮT NGAY!
            if (hasSpoken && Date.now() - silenceStart > 900) {
              if (mediaRecorder.state === 'recording') mediaRecorder.stop();
            }
          }
        }, 100);
      };

      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        clearInterval(checkAudioInterval);
        audioContext.close();
        
        // Tắt đèn đỏ trên tab trình duyệt
        stream.getTracks().forEach(track => track.stop());

        if (audioChunksRef.current.length === 0) {
          setError('Không có âm thanh được ghi lại.');
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudioWithWhisper(audioBlob);
      };

      mediaRecorder.start();

      // Hỗ trợ ngắt dự phòng sau 10 giây nếu xung quanh quá ồn không nhận diện được im lặng
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 10000);

    } catch (err: any) {
      console.error('Lỗi truy cập Mic:', err);
      setError('Không thể truy cập Micro. Vui lòng cấp quyền trong trình duyệt nha sếp!');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const processAudioWithWhisper = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('file', blob, 'audio.webm');

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi bóc băng Whisper');
      
      const text = data.text.trim();
      setTranscribed(text);
      
      if (!text) {
        throw new Error('Bạn chưa nói gì cả, nói to lên sếp ơi!');
      }

      await evaluatePronunciation(text);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsTranscribing(false);
    }
  };

  const evaluatePronunciation = async (speechResult: string) => {
    setLoading(true);
    
    // Giới hạn 6 giây cho API, nếu AI quá tải thì báo lỗi ngay thay vì treo
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch(`/api/word/${wordId}/pronounce-roast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcribedText: speechResult }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi AI');
      
      setResult(data);
      if (onFinish) onFinish();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('AI đang bận đi đẻ, sếp bấm nút Mic thử lại giùm nha!');
      } else {
        setError(err.message);
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 border-4 border-[var(--line)] p-6 bg-[var(--paper)] shadow-[8px_8px_0_var(--line)] relative">
      <div className="absolute -top-4 -left-4 bg-[var(--ink)] text-[var(--bg)] px-3 py-1 font-black border-2 border-[var(--line)] rotate-[-3deg]">
        🎙️ CHẤM ĐIỂM PHÁT ÂM <span className="text-xs text-[var(--red)] ml-2">BETA</span>
      </div>

      <div className="text-center mb-6 pt-4 relative">
        <p className="font-bold text-[var(--muted)] mb-2">Hãy đọc to từ này vào Mic:</p>
        <div className="flex items-center justify-center gap-3">
          <h3 className="text-4xl font-black text-[var(--red)] uppercase tracking-widest">{wordText}</h3>
          <SaveToCollection wordId={wordId} />
          <button 
            onClick={() => {
              if (typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
              }
              if (currentAudioRef.current) {
                currentAudioRef.current.pause();
                currentAudioRef.current.onended = null;
                currentAudioRef.current.onerror = null;
              }
              setIsPlaying(false);

              if (typeof window !== 'undefined' && window.speechSynthesis) {
                const utter = new SpeechSynthesisUtterance(wordText);
                utter.lang = 'en-US';
                
                // Gán giọng tiếng Anh cụ thể để tránh trình duyệt lấy nhầm giọng tiếng Việt đọc tiếng Anh
                const systemVoices = window.speechSynthesis.getVoices();
                const enVoice = systemVoices.find(v => v.lang.replace('_', '-').startsWith('en'));
                if (enVoice) {
                  utter.voice = enVoice;
                }
                
                window.speechSynthesis.speak(utter);
              }
            }}
            className="text-2xl hover:scale-125 transition-transform"
            title="Nghe cách đọc chuẩn"
          >
            🔊
          </button>
        </div>
      </div>

      <div className="flex justify-center mb-6">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={loading || isTranscribing}
          className={`btn-brutal w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-[6px_6px_0_var(--line)] transition-transform ${
            isRecording 
              ? 'bg-[var(--red)] animate-pulse scale-110 border-[var(--line)] shadow-[2px_2px_0_var(--line)]' 
              : (loading || isTranscribing)
                ? 'bg-[var(--yellow)]/30 border-[var(--line)] shadow-[2px_2px_0_var(--line)] animate-bounce'
                : result 
                  ? 'bg-[#34C759] border-[var(--line)] shadow-[4px_4px_0_var(--line)]' 
                  : 'bg-[var(--bg)] hover:brightness-95 border-[var(--line)] hover:-translate-y-1'
          } ${loading || isTranscribing ? 'cursor-not-allowed' : ''}`}
        >
          {isRecording 
            ? '🔴' 
            : (loading || isTranscribing)
              ? '⏳'
              : result 
                ? '🟢' 
                : '🎤'}
        </button>
      </div>

      {isRecording && (
        <div className="text-center animate-pulse">
          <p className="font-black text-[var(--red)] text-xl uppercase">Đang nghe...</p>
          <p className="font-bold text-[var(--ink)] mt-2">Đọc xong cứ im lặng 1 giây, máy sẽ tự nộp bài!</p>
        </div>
      )}

      {isTranscribing && (
        <p className="text-center font-bold text-[var(--blue)] animate-pulse">Đang dùng siêu AI Whisper để bóc băng...</p>
      )}

      {transcribed && !isRecording && !isTranscribing && (
        <div className="bg-[var(--bg)] border-2 border-dashed border-[var(--muted)] p-3 text-center mb-4">
          <p className="text-sm text-[var(--muted)] font-bold">Máy nghe ra chữ:</p>
          <p className="text-2xl font-black text-[var(--ink)]">{transcribed}</p>
        </div>
      )}

      {loading && (
        <div className="panel bg-[var(--yellow)]/20 border-[var(--yellow)] text-center">
          <p className="font-bold text-[var(--yellow)] animate-pulse">⏳ AI đang soi mói lỗi phát âm của bạn...</p>
        </div>
      )}

      {error && (
        <div className="panel bg-[var(--red)]/20 border-[var(--red)]">
          <p className="font-bold text-[var(--red)] text-center">{error}</p>
        </div>
      )}

      {result && (
        <div className={`panel mt-4 border-4 shadow-[6px_6px_0_var(--line)] ${result.score >= 80 ? 'bg-[var(--green)]/20 border-[var(--green)]' : 'bg-[var(--red)]/20 border-[var(--red)]'}`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
            <h4 className="font-black text-2xl">
              ĐIỂM: <span className={result.score >= 80 ? 'text-[var(--green)]' : 'text-[var(--red)]'}>{result.score}/100</span>
            </h4>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button 
                onClick={() => speakRoast(result.roast)}
                className={`text-sm px-3 py-1 rounded border-2 border-[var(--line)] font-bold shrink-0 ${isPlaying ? 'bg-[var(--ink)] text-[var(--bg)]' : 'bg-[var(--bg)] text-[var(--ink)] hover:brightness-95'}`}
              >
                {isPlaying ? '🔊 Đang la...' : '🔊 Nghe la'}
              </button>
            </div>
          </div>
          <p className="font-bold text-lg leading-relaxed whitespace-pre-wrap text-[var(--ink)] mb-4">{result.roast}</p>

          {/* Chi tiết từ vựng gốc */}
          {result.wordDetails && (
            <div className="mt-4 pt-4 border-t-2 border-dashed border-[var(--line)] text-left">
              <span className="inline-block bg-[var(--yellow)] text-[var(--ink)] text-xs font-black px-2.5 py-1 border-2 border-[var(--line)] uppercase tracking-wider mb-3 rotate-[-1.5deg]">
                📖 CHI TIẾT TỪ VỰNG:
              </span>
              <div className="flex flex-wrap items-baseline gap-2 mb-2">
                <span className="text-2xl font-black uppercase text-[var(--blue)] tracking-wider">{result.wordDetails.word}</span>
                {result.wordDetails.ipa && (
                  <span className="text-sm font-bold text-[var(--muted)]">{result.wordDetails.ipa}</span>
                )}
                {result.wordDetails.pos && (
                  <span className="text-xs font-bold bg-[var(--ink)] text-[var(--bg)] px-2 py-0.5 border border-[var(--line)]">
                    {result.wordDetails.pos}
                  </span>
                )}
              </div>
              <div className="font-bold text-base text-[var(--ink)] mb-3">
                <span className="text-[var(--muted)]">Ý nghĩa: </span>
                {(() => {
                  const { en, vi } = parseMeaning(result.wordDetails.meaning_vi, result.wordDetails.pos);
                  return (
                    <span>
                      {vi} {en && <span className="text-xs font-bold text-[var(--muted)] block sm:inline sm:ml-2 italic font-normal">({en})</span>}
                    </span>
                  );
                })()}
              </div>
              {result.wordDetails.example && (
                <div className="bg-[var(--bg)] p-3 border-2 border-[var(--line)] text-sm font-medium text-[var(--ink)] italic shadow-[2px_2px_0_var(--line)]">
                  <span className="font-bold not-italic text-[var(--muted)] block mb-1 text-xs uppercase tracking-wide">Ví dụ:</span>
                  "{result.wordDetails.example}"
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
