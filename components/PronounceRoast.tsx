'use client';

import { useState, useEffect, useRef } from 'react';

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
  const [result, setResult] = useState<{ score: number; roast: string } | null>(null);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [viVoices, setViVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('google-tts');
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
        
        if (list.length > 0) {
          // Tự động tìm giọng miền Nam làm mặc định nếu có sẵn
          const southern = list.find(v => isSouthernVoice(v.name));
          if (southern) {
            setSelectedVoiceName(southern.name);
          } else {
            setSelectedVoiceName('google-tts');
          }
        } else {
          setSelectedVoiceName('google-tts');
        }
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
      // Dừng âm thanh đang phát
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.src = '';
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
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

      const selectedVoice = viVoices.find(v => v.name === selectedVoiceName);

      // Nếu sếp chọn một giọng nói cụ thể của hệ thống:
      if (selectedVoiceName !== 'google-tts' && selectedVoice && typeof window !== 'undefined' && window.speechSynthesis) {
        const utter = new SpeechSynthesisUtterance(chunk);
        utter.voice = selectedVoice;
        utter.lang = selectedVoice.lang;
        const isSouth = isSouthernVoice(selectedVoice.name);
        utter.rate = isSouth ? 1.25 : 1.2; // Giọng Nam thì để 1.25, giọng Bắc thì để 1.2 cho cân đối
        utter.onend = () => {
          handleNext();
        };
        utter.onerror = (e) => {
          console.warn("System voice failed, falling back to Google TTS:", e);
          playGoogleTTS(chunk, handleNext);
        };
        window.speechSynthesis.speak(utter);
      } else {
        // Mặc định hoặc do sếp chọn Google Cloud (Google TTS)
        playGoogleTTS(chunk, handleNext);
      }
    };

    const playGoogleTTS = (chunk: string, callback: () => void) => {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encodeURIComponent(chunk)}`;
      const audio = currentAudioRef.current || new Audio();
      currentAudioRef.current = audio;
      
      audio.src = url;
      audio.playbackRate = 1.4; // Tốc độ 1.4 lý tưởng
      
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
          utter.rate = 1.2; // Giọng chuẩn fallback chạy vừa phải 1.2
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
        console.warn("Google TTS failed chunk, using standard Web Speech fallback:", chunk, e);
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
        🎙️ CHẤM ĐIỂM PHÁT ÂM <span className="text-xs text-[var(--red)] ml-2">v2.0</span>
      </div>

      <div className="text-center mb-6 pt-4 relative">
        <p className="font-bold text-[var(--muted)] mb-2">Hãy đọc to từ này vào Mic:</p>
        <div className="flex items-center justify-center gap-3">
          <h3 className="text-4xl font-black text-[var(--red)] uppercase tracking-widest">{wordText}</h3>
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
              {viVoices.length > 0 && (
                <select
                  value={selectedVoiceName}
                  onChange={(e) => setSelectedVoiceName(e.target.value)}
                  className="text-xs p-1 border-2 border-[var(--line)] font-bold bg-[var(--bg)] text-[var(--ink)] rounded cursor-pointer max-w-[200px]"
                  title="Chọn giọng đọc AI"
                >
                  <option value="google-tts">🔊 Google Cloud (Giọng Bắc)</option>
                  {viVoices.map(v => {
                    const isSouth = isSouthernVoice(v.name);
                    return (
                      <option key={v.name} value={v.name}>
                        🗣️ {v.name.replace('Microsoft', 'MS').replace('Online (Natural)', '')} {isSouth ? '(Giọng Nam)' : '(Giọng Bắc)'}
                      </option>
                    );
                  })}
                </select>
              )}
              <button 
                onClick={() => speakRoast(result.roast)}
                className={`text-sm px-3 py-1 rounded border-2 border-[var(--line)] font-bold shrink-0 ${isPlaying ? 'bg-[var(--ink)] text-[var(--bg)]' : 'bg-[var(--bg)] text-[var(--ink)] hover:brightness-95'}`}
              >
                {isPlaying ? '🔊 Đang la...' : '🔊 Nghe la'}
              </button>
            </div>
          </div>
          <p className="font-bold text-lg leading-relaxed whitespace-pre-wrap text-[var(--ink)]">{result.roast}</p>
        </div>
      )}
    </div>
  );
}
