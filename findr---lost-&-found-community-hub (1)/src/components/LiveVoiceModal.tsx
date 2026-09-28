import { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Volume2, PhoneOff, Sparkles, AlertCircle, Radio } from 'lucide-react';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLocationName?: string;
}

// Convert Float32Array PCM samples from microphone to 16-bit PCM little-endian Base64
function floatTo16BitPCMBase64(input: Float32Array): string {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  let binary = '';
  const bytes = new Uint8Array(output.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 16-bit PCM audio back to AudioBuffer for 24kHz output
function base64ToAudioBuffer(base64: string, audioCtx: AudioContext): AudioBuffer {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const int16Data = new Int16Array(bytes.buffer);
  const floatData = new Float32Array(int16Data.length);
  for (let i = 0; i < int16Data.length; i++) {
    floatData[i] = int16Data[i] / 32768.0;
  }
  const buffer = audioCtx.createBuffer(1, floatData.length, 24000);
  buffer.getChannelData(0).set(floatData);
  return buffer;
}

export function LiveVoiceModal({ isOpen, onClose, userLocationName }: LiveVoiceModalProps) {
  if (!isOpen) return null;

  const [status, setStatus] = useState<'connecting' | 'listening' | 'speaking' | 'muted' | 'error'>('connecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([
    { sender: 'ai', text: 'Connecting to Gemini 3.8 Live Voice Session...' }
  ]);
  const [isMuted, setIsMuted] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const currentSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const isMutedRef = useRef(false);

  isMutedRef.current = isMuted;

  const stopAllAudio = () => {
    // Stop playing sources
    currentSourcesRef.current.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // ignore
      }
    });
    currentSourcesRef.current = [];
    if (outputAudioCtxRef.current) {
      nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
    }
  };

  const cleanupSession = () => {
    stopAllAudio();

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (inputAudioCtxRef.current && inputAudioCtxRef.current.state !== 'closed') {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }

    if (outputAudioCtxRef.current && outputAudioCtxRef.current.state !== 'closed') {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  useEffect(() => {
    let isSubscribed = true;

    async function initLiveVoice() {
      try {
        setStatus('connecting');
        setErrorMessage(null);

        // 1. Setup AudioContexts
        // Input: 16kHz for mic capture (as required by Gemini Live API)
        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 16000
        });
        inputAudioCtxRef.current = inputCtx;

        // Output: 24kHz for Gemini Live audio playback
        const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000
        });
        outputAudioCtxRef.current = outputCtx;
        nextStartTimeRef.current = outputCtx.currentTime;

        // 2. Request mic permission
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
          }
        });
        mediaStreamRef.current = stream;

        // 3. Connect to WebSocket
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/live`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isSubscribed) return;
          setStatus('listening');
          setTranscripts([
            { sender: 'ai', text: `Hello! I'm your Findr voice assistant. What did you lose or find near ${userLocationName || 'campus'}?` }
          ]);

          // Connect microphone to ScriptProcessor
          const source = inputCtx.createMediaStreamSource(stream);
          const processor = inputCtx.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;

          processor.onaudioprocess = (e) => {
            if (isMutedRef.current || ws.readyState !== WebSocket.OPEN) return;
            const inputData = e.inputBuffer.getChannelData(0);
            const base64Audio = floatTo16BitPCMBase64(inputData);
            ws.send(JSON.stringify({ audio: base64Audio }));
          };

          source.connect(processor);
          processor.connect(inputCtx.destination);
        };

        ws.onmessage = (event) => {
          if (!isSubscribed) return;
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'audio' && data.audio) {
              setStatus('speaking');
              if (outputCtx.state === 'suspended') {
                outputCtx.resume();
              }
              const audioBuffer = base64ToAudioBuffer(data.audio, outputCtx);
              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputCtx.destination);

              // Schedule gapless playback
              const now = outputCtx.currentTime;
              const startTime = Math.max(now, nextStartTimeRef.current);
              source.start(startTime);
              nextStartTimeRef.current = startTime + audioBuffer.duration;

              currentSourcesRef.current.push(source);
              source.onended = () => {
                currentSourcesRef.current = currentSourcesRef.current.filter(s => s !== source);
                if (currentSourcesRef.current.length === 0) {
                  setStatus('listening');
                }
              };
            }

            if (data.type === 'text' && data.text) {
              setTranscripts(prev => {
                const last = prev[prev.length - 1];
                if (last && last.sender === 'ai') {
                  return [...prev.slice(0, -1), { sender: 'ai', text: last.text + ' ' + data.text }];
                }
                return [...prev, { sender: 'ai', text: data.text }];
              });
            }

            if (data.type === 'interrupted') {
              stopAllAudio();
              setStatus('listening');
            }

            if (data.type === 'error') {
              setStatus('error');
              setErrorMessage(data.message || 'Live session error');
            }
          } catch (e) {
            console.error('Error handling WebSocket message:', e);
          }
        };

        ws.onerror = (err) => {
          console.error('WebSocket connection error:', err);
          if (isSubscribed) {
            setStatus('error');
            setErrorMessage('Could not establish Live voice connection with server.');
          }
        };

        ws.onclose = () => {
          if (isSubscribed && status !== 'error') {
            setStatus('error');
            setErrorMessage('Live voice session ended.');
          }
        };
      } catch (err: any) {
        console.error('Failed to start Live Voice Assistant:', err);
        if (isSubscribed) {
          setStatus('error');
          setErrorMessage(err?.message || 'Microphone access denied or audio initialization failed.');
        }
      }
    }

    initLiveVoice();

    return () => {
      isSubscribed = false;
      cleanupSession();
    };
  }, []);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      setStatus('muted');
    } else {
      setStatus('listening');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-700 text-white rounded-3xl shadow-2xl overflow-hidden flex flex-col p-6 text-center space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                status === 'speaking' ? 'bg-emerald-400' : status === 'listening' ? 'bg-blue-400' : 'bg-amber-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                status === 'speaking' ? 'bg-emerald-500' : status === 'listening' ? 'bg-blue-500' : 'bg-amber-500'
              }`}></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              Gemini 3.8 Live API
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Central Audio Visualizer Orb */}
        <div className="py-6 flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center">
            {/* Pulsing rings */}
            <div className={`absolute w-36 h-36 rounded-full transition-all duration-300 ${
              status === 'speaking'
                ? 'bg-emerald-500/20 scale-125 animate-pulse'
                : status === 'listening'
                ? 'bg-blue-500/20 scale-110 animate-ping'
                : 'bg-neutral-700/20'
            }`}></div>

            <div className={`relative w-28 h-28 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
              status === 'speaking'
                ? 'bg-gradient-to-tr from-emerald-600 to-teal-400 ring-4 ring-emerald-400/40'
                : status === 'listening'
                ? 'bg-gradient-to-tr from-blue-600 to-indigo-500 ring-4 ring-blue-400/40'
                : 'bg-neutral-800 ring-4 ring-neutral-700'
            }`}>
              {status === 'speaking' ? (
                <Volume2 className="w-10 h-10 text-white animate-bounce" />
              ) : status === 'listening' ? (
                <Mic className="w-10 h-10 text-white animate-pulse" />
              ) : status === 'muted' ? (
                <MicOff className="w-10 h-10 text-neutral-400" />
              ) : (
                <Radio className="w-10 h-10 text-neutral-400 animate-spin" />
              )}
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-base font-bold text-white font-display">
              {status === 'speaking' && 'Gemini is speaking...'}
              {status === 'listening' && 'Listening to you... Speak naturally'}
              {status === 'connecting' && 'Connecting audio stream...'}
              {status === 'muted' && 'Microphone muted'}
              {status === 'error' && 'Session error'}
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Real-time bidirectional 16kHz/24kHz speech with Gemini 3.8 Live
            </p>
          </div>
        </div>

        {/* Error notification if any */}
        {errorMessage && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-200 flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Transcript / Conversation History snippet */}
        <div className="max-h-36 overflow-y-auto p-3 bg-neutral-950/70 border border-neutral-800 rounded-xl text-left space-y-2 text-xs">
          {transcripts.map((t, idx) => (
            <div key={idx} className={`flex items-start gap-1.5 ${t.sender === 'ai' ? 'text-neutral-200' : 'text-blue-300'}`}>
              <span className="font-bold shrink-0">{t.sender === 'ai' ? 'Gemini:' : 'You:'}</span>
              <span className="leading-relaxed">{t.text}</span>
            </div>
          ))}
        </div>

        {/* Suggested Voice Prompts */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-neutral-400 text-[11px]">Try saying:</span>
          <span className="bg-neutral-800 text-neutral-300 px-2 py-1 rounded border border-neutral-700 text-[11px]">
            "I lost my keys near the library fountain"
          </span>
          <span className="bg-neutral-800 text-neutral-300 px-2 py-1 rounded border border-neutral-700 text-[11px]">
            "What question should I ask to verify a wallet?"
          </span>
        </div>

        {/* Action Controls */}
        <div className="pt-2 border-t border-neutral-800 flex items-center justify-center gap-4">
          <button
            onClick={toggleMute}
            className={`p-3 rounded-full border transition cursor-pointer ${
              isMuted
                ? 'bg-rose-900/60 border-rose-700 text-rose-200 hover:bg-rose-900'
                : 'bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            onClick={onClose}
            className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg active:scale-95"
          >
            <PhoneOff className="w-4 h-4" />
            <span>End Voice Call</span>
          </button>
        </div>
      </div>
    </div>
  );
}
