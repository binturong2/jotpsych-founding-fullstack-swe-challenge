import React, { useCallback, useState } from "react";
import AudioRecorder from "./components/AudioRecorder";

const App = () => {
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcription, setTranscription] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const onTranscriptionStart = useCallback(() => {
    setIsTranscribing(true);
    setErrorMessage("");
    setTranscription("");
  }, []);

  const onTranscriptionCancel = useCallback(() => {
    setIsTranscribing(false);
    setErrorMessage("");
    setTranscription("");
  }, []);

  const onTranscriptionFailed = useCallback((message: string) => {
    setIsTranscribing(false);
    setErrorMessage(message);
  }, []);

  const onTranscriptionComplete = useCallback((text: string) => {
    setIsTranscribing(false);
    setTranscription(text);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-8">Audio Transcription Demo</h1>

      <AudioRecorder
        onTranscriptionStart={onTranscriptionStart}
        onTranscriptionCancel={onTranscriptionCancel}
        onTranscriptionFailed={onTranscriptionFailed}
        onTranscriptionComplete={onTranscriptionComplete}
      />

      {isTranscribing && (
        <div className="mt-8 p-4 bg-blue-100 rounded-lg">
          <p className="text-blue-700">Transcription in progress...</p>
        </div>
      )}

      {transcription && !isTranscribing && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h2 className="font-semibold mb-2">Transcription:</h2>
          <p>{transcription}</p>
        </div>
      )}

      {errorMessage && (
        <div className="mt-8 p-4 bg-red-100 rounded-lg shadow-md">
          <p className="text-red-700">Transcription failed: {errorMessage}. Please try again.</p>
        </div>
      )}
    </div>
  );
}

export default App;
