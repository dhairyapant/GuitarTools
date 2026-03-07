import { useState, useEffect, useRef, useCallback } from 'react';
import { autoCorrelate, noteFromPitch, frequencyFromNoteNumber, centsOffFromPitch, PitchResult } from '../utils/pitchDetection';
import { BUFFER_SIZE, TUNINGS, ALL_NOTES, IN_TUNE_THRESHOLD_CENTS } from '../constants';
import { TuningStatus, StringName } from '../types';

interface PitchSample {
  frequency: number;
  clarity: number;
}

// Lock-on: how many consecutive high-clarity frames to "lock" the needle
const LOCK_ON_CLARITY_THRESHOLD = 0.85;
const LOCK_ON_FRAMES_REQUIRED = 3;
const PITCH_BUFFER_SIZE = 7; // rolling window of samples

/** Clarity-weighted average: high-confidence frames dominate the result */
function getWeightedFrequency(samples: PitchSample[]): number {
  if (samples.length === 0) return 0;
  if (samples.length === 1) return samples[0].frequency;

  let weightedSum = 0;
  let totalWeight = 0;

  for (const sample of samples) {
    // Square the clarity to strongly favor clean frames
    const weight = sample.clarity * sample.clarity;
    weightedSum += sample.frequency * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : samples[samples.length - 1].frequency;
}

export const useTuner = () => {
  const [isListening, setIsListening] = useState(false);
  const [tuningStatus, setTuningStatus] = useState<TuningStatus>({
    note: null,
    frequency: 0,
    deviation: 0,
    isInTune: false
  });
  const [selectedString, setSelectedString] = useState<StringName>(StringName.AUTO);
  const [tuningId, setTuningId] = useState<string>('standard');
  const [pitchOffset, setPitchOffset] = useState<number>(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Weighted temporal stability buffers
  const pitchBufferRef = useRef<PitchSample[]>([]);
  const lockOnCountRef = useRef<number>(0);
  const lockedFrequencyRef = useRef<number | null>(null);

  const updatePitch = useCallback(() => {
    if (!analyserRef.current || !audioContextRef.current) return;

    const buffer = new Float32Array(BUFFER_SIZE);
    analyserRef.current.getFloatTimeDomainData(buffer);
    const sampleRate = audioContextRef.current.sampleRate;

    const result: PitchResult = autoCorrelate(buffer, sampleRate);

    if (result.frequency === -1) {
      // Silence detected — decay the buffer gradually
      const pitchBuffer = pitchBufferRef.current;
      if (pitchBuffer.length > 0) {
        // Remove oldest sample on silence to slowly fade
        pitchBuffer.shift();
      }
      if (pitchBuffer.length === 0) {
        // Full silence: release the lock
        lockOnCountRef.current = 0;
        lockedFrequencyRef.current = null;
      }
    } else {
      // --- New valid sample ---
      const pitchBuffer = pitchBufferRef.current;
      pitchBuffer.push({ frequency: result.frequency, clarity: result.clarity });
      if (pitchBuffer.length > PITCH_BUFFER_SIZE) pitchBuffer.shift();

      // --- Lock-on logic ---
      // Detect if this is a "new pluck" (sudden transient) that should reset the lock.
      // A new pluck is detected when the frequency shifts significantly from the locked value.
      if (lockedFrequencyRef.current !== null) {
        const centsDrift = Math.abs(1200 * Math.log(result.frequency / lockedFrequencyRef.current) / Math.log(2));
        if (centsDrift > 50) {
          // Major frequency shift = new pluck, release lock
          lockOnCountRef.current = 0;
          lockedFrequencyRef.current = null;
          pitchBufferRef.current = [{ frequency: result.frequency, clarity: result.clarity }];
        }
      }

      // Count consecutive high-clarity frames
      if (result.clarity >= LOCK_ON_CLARITY_THRESHOLD) {
        lockOnCountRef.current++;
      } else {
        lockOnCountRef.current = Math.max(0, lockOnCountRef.current - 1);
      }

      // --- Calculate weighted frequency ---
      let frequency: number;

      if (lockOnCountRef.current >= LOCK_ON_FRAMES_REQUIRED && lockedFrequencyRef.current !== null) {
        // LOCKED: use the locked frequency (ultra-stable needle)
        // But gently drift towards the latest weighted average to stay responsive
        const weightedAvg = getWeightedFrequency(pitchBuffer);
        frequency = lockedFrequencyRef.current * 0.85 + weightedAvg * 0.15;
        lockedFrequencyRef.current = frequency; // update lock point
      } else {
        // NOT LOCKED: use clarity-weighted average
        frequency = getWeightedFrequency(pitchBuffer);

        // Check if we should engage the lock
        if (lockOnCountRef.current >= LOCK_ON_FRAMES_REQUIRED) {
          lockedFrequencyRef.current = frequency;
        }
      }

      // --- Standard pitch logic with the stabilized frequency ---
      const noteNum = noteFromPitch(frequency);
      let targetFrequency = frequencyFromNoteNumber(noteNum);

      const currentTuning = TUNINGS.find(t => t.id === tuningId) || TUNINGS[0];
      const activeStrings = currentTuning.strings.map(s => ({
        ...s,
        frequency: s.frequency * Math.pow(2, pitchOffset / 12)
      }));

      if (selectedString !== StringName.AUTO) {
        const targetString = activeStrings.find(s => s.name === selectedString);
        if (targetString) {
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
  }, [selectedString, tuningId, pitchOffset]);

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
    lockOnCountRef.current = 0;
    lockedFrequencyRef.current = null;
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
  }, [selectedString, tuningId, pitchOffset, isListening, updatePitch]);

  return {
    isListening,
    startListening,
    stopListening,
    tuningStatus,
    selectedString,
    setSelectedString,
    tuningId,
    setTuningId,
    pitchOffset,
    setPitchOffset,
    permissionError,
    activeStrings: TUNINGS.find(t => t.id === tuningId)?.strings.map(s => ({
      ...s,
      frequency: s.frequency * Math.pow(2, pitchOffset / 12)
    })) || TUNINGS[0].strings
  };
};
