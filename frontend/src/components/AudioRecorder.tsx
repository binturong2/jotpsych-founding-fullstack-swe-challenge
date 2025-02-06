import React, { useState, useEffect, useRef, useCallback } from "react";
import APIService from "../services/APIService";
import AudioRecorderService from "../services/AudioRecorderService";

const MAX_RECORDING_TIME_SECONDS = 10;

const AudioRecorder = (props: { onTranscriptionStart: Function; onTranscriptionCancel: Function; onTranscriptionFailed: Function; onTranscriptionComplete: Function; }) => {
  const { onTranscriptionStart, onTranscriptionCancel, onTranscriptionFailed, onTranscriptionComplete } = props;

  const [isRecordingRequested, setIsRecordingRequested] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef(null);
  const maxRecordingTimerRef = useRef(null);
  const transcriptionCancelRef = useRef(null);

  const startRecording = useCallback(() => {
    setRecordingTime(0);
    setAudioBlob(null);
    setIsRecordingRequested(true);
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsRecordingRequested(false);
      clearTimeout(maxRecordingTimerRef.current);
      clearInterval(recordingIntervalRef.current);
    }
  }, []);

  useEffect(() => {
    if (!isRecordingRequested) {
      return;
    }

    const startStream = async () => {
      try {
        const stream = await AudioRecorderService.requestMicrophoneAccess();
        const recorder = AudioRecorderService.createMediaRecorder(stream, setAudioBlob);
        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
        onTranscriptionCancel?.();
      } catch (error) {
        console.error(error.message);
        setIsRecordingRequested(false);
      }
    };

    startStream();

    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecordingRequested, onTranscriptionCancel]);


  useEffect(() => {
    if (!audioBlob) {
      transcriptionCancelRef.current?.();
      return;
    }

    const handleRecordingStop = async (audioBlob) => {
      try {
        onTranscriptionStart?.();
        const transcribeAudio = APIService.transcribeAudio(audioBlob);
        transcriptionCancelRef.current = transcribeAudio.cancel;
        const response = await transcribeAudio.response;
        transcriptionCancelRef.current = null;
        if (response.error && response.error !== "Request was aborted") {
          throw new Error(response.error);
        }
        if (response.data?.transcription) {
          onTranscriptionComplete?.(response.data.transcription);
        }
      } catch (error) {
        console.error("Error transcribing audio:", error.message);
        transcriptionCancelRef.current = null;
        onTranscriptionFailed?.(error.message);
      }
    };

    handleRecordingStop(audioBlob);
  }, [audioBlob, onTranscriptionStart, onTranscriptionFailed, onTranscriptionComplete]);

  useEffect(() => {
    if (!isRecording) {
      return undefined;
    }

    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1)
    }, 1000);

    return () => {
      clearInterval(recordingIntervalRef.current);
    };
  }, [isRecording]);

  useEffect(() => {
    if (!isRecording) {
      return undefined;
    }

    maxRecordingTimerRef.current = setTimeout(() => {
      stopRecording();
    }, MAX_RECORDING_TIME_SECONDS * 1000);

    return () => {
      clearTimeout(maxRecordingTimerRef.current);
    };
  }, [isRecording, stopRecording]);

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`px-6 py-3 rounded-lg font-semibold ${
          isRecording
            ? "bg-red-500 hover:bg-red-600 text-white"
            : "bg-blue-500 hover:bg-blue-600 text-white"
        }`}
      >
        {isRecording
          ? `Stop Recording (${MAX_RECORDING_TIME_SECONDS - recordingTime}s)`
          : "Start Recording"}
      </button>

      {isRecording && (
        <p className="text-sm text-gray-600">
          Recording in progress (Current time: {recordingTime}s)
        </p>
      )}

      {!isRecording && !!audioBlob && (
        <p className="text-sm text-gray-600">
          Final recording time: {recordingTime}s
        </p>
      )}
    </div>
  );
};

export default AudioRecorder;
