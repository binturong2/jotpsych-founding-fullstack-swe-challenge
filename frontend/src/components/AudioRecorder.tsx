import { useState, useEffect, useRef, useCallback, useMemo } from "react";

const MAX_RECORDING_TIME_SECONDS = 10;

const AudioRecorder = ({ onTranscriptionComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef(null);
  const maxRecordingTimerRef = useRef(null);

  const finalRecordingTime = useMemo(
    () => (!isRecording && recordingTime) || 0,
    [isRecording, recordingTime],
  );

  const startRecording = async () => {
    try {
      setRecordingTime(0);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        const formData = new FormData();
        formData.append("audio", audioBlob);

        try {
          // TODO: Use APIService for api requests
          const response = await fetch("http://localhost:8000/transcribe", {
            method: "POST",
            body: formData,
          });
          const data = await response.json();
          onTranscriptionComplete(data.transcription);
        } catch (error) {
          console.error("Error sending audio:", error);
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearTimeout(maxRecordingTimerRef.current);
      clearInterval(recordingIntervalRef.current);
    }
  }, []);

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
      {finalRecordingTime > 0 && (
        <p className="text-sm text-gray-600">
          Final recording time: {finalRecordingTime}s
        </p>
      )}

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
    </div>
  );
};

export default AudioRecorder;
