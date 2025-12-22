import { useState, useEffect, useRef, useCallback } from 'react';
import { autoCorrelate, noteFromPitch, frequencyFromNoteNumber, centsOffFromPitch } from '../utils/pitchDetection';
import { BUFFER_SIZE, STANDARD_TUNING, ALL_NOTES, IN_TUNE_THRESHOLD_CENTS } from '../constants';
import { TuningStatus, StringName } from '../types';

export const useTuner = () => {
  const [isListening, setIsListening] = useState(false);
  const [tuningStatus, setTuningStatus] = useState<TuningStatus>({
    note: null,
    frequency: 0,
    deviation: 0,
    isInTune: false
  });
  const [selectedString, setSelectedString] = useState<StringName>(StringName.AUTO);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Buffer for median smoothing
  const pitchBufferRef = useRef<number[]>([]);

  const updatePitch = useCallback(() => {
    if (!analyserRef.current || !audioContextRef.current) return;

    const buffer = new Float32Array(BUFFER_SIZE);
    analyserRef.current.getFloatTimeDomainData(buffer);
    const sampleRate = audioContextRef.current.sampleRate;

    const rawFrequency = autoCorrelate(buffer, sampleRate);

    if (rawFrequency === -1) {
      // Silence or invalid detection.
      // We gradually clear the buffer or keep the last known for a brief moment?
      // Clearing is safer for "instant" feedback of silence.
      pitchBufferRef.current = [];
      
      // Optional: Delay setting state to 'unknown' to avoid flickering on missed frames
      // But for now, we leave the last visual state or set to 0. 
      // The gauge handles freq=0 gracefully (showing "--").
      // However, we don't want to reset immediately if it's just one missed frame.
      // Let's just do nothing here, the gauge will hold the previous value until the loop clears or finding a new note.
      // Actually, to show "Listening..." we should probably update occasionally if silence persists.
      // For simplicity in this refined version:
      // If buffer is empty (persistent silence), we update status to null.
      if (pitchBufferRef.current.length === 0) {
          // This creates a smoother falloff to silence
         // We can choose to update the UI to "Listening..." if we really want
      }

    } else {
      // Add to buffer
      const pitchBuffer = pitchBufferRef.current;
      pitchBuffer.push(rawFrequency);
      if (pitchBuffer.length > 5) pitchBuffer.shift(); // Keep last 5 frames

      // Calculate Median Frequency
      // Copy to avoid sorting the ref array order
      const sorted = [...pitchBuffer].sort((a, b) => a - b);
      const medianFrequency = sorted[Math.floor(sorted.length / 2)];

      const frequency = medianFrequency;
      
      // --- Standard Logic with Smoothed Frequency ---
      const noteNum = noteFromPitch(frequency);
      
      // Calculate target note
      let targetNoteNum = noteNum; // Default to chromatic closest
      let targetFrequency = frequencyFromNoteNumber(noteNum);
      
      // If manual string selected, force comparison against that string
      if (selectedString !== StringName.AUTO) {
        const targetString = STANDARD_TUNING.find(s => s.name === selectedString);
        if (targetString) {
            const targetNoteNumber = noteFromPitch(targetString.frequency);
            targetNoteNum = targetNoteNumber;
            targetFrequency = targetString.frequency;
        }
      }

      const noteName = ALL_NOTES[noteNum % 12];
      const octave = Math.floor(noteNum / 12) - 1;

      let deviation = 0;
      
      if (selectedString === StringName.AUTO) {
          deviation = centsOffFromPitch(frequency, noteNum);
      } else {
          deviation = 1200 * Math.log(frequency / targetFrequency) / Math.log(2);
      }
      
      const isInTune = Math.abs(deviation) <= IN_TUNE_THRESHOLD_CENTS;

      setTuningStatus({
        note: {
          name: noteName,
          octave: octave,
          frequency: frequency
        },
        frequency,
        deviation,
        isInTune
      });
    }

    rafIdRef.current = requestAnimationFrame(updatePitch);
  }, [selectedString]);

  const startListening = async () => {
    try {
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      if (isListening) return;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = BUFFER_SIZE * 2;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      setIsListening(true);
      setPermissionError(null);
      
      updatePitch();
    } catch (err: any) {
      console.error("Microphone access denied or error:", err);
      setPermissionError("Please allow microphone access to use the tuner.");
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    if (sourceRef.current) {
        sourceRef.current.disconnect();
    }
    if (analyserRef.current) {
        analyserRef.current.disconnect();
    }
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
        audioContextRef.current.close();
    }
    
    setIsListening(false);
    setTuningStatus({ note: null, frequency: 0, deviation: 0, isInTune: false });
    pitchBufferRef.current = [];
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  useEffect(() => {
      if (isListening) {
          if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
          updatePitch();
      }
  }, [selectedString, isListening, updatePitch]);

  return {
    isListening,
    startListening,
    stopListening,
    tuningStatus,
    selectedString,
    setSelectedString,
    permissionError
  };
};
