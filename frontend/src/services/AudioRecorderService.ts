class AudioRecorderService {
  static async requestMicrophoneAccess(): Promise<MediaStream> {
    try {
      return await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      throw new Error("Error accessing microphone");
    }
  }

  static createMediaRecorder(stream: MediaStream, onStopCallback: (audioBlob: Blob) => void): MediaRecorder {
    const recorder = new MediaRecorder(stream);
    const audioChunks: Blob[] = [];

    recorder.ondataavailable = (event: BlobEvent) => audioChunks.push(event.data);

    recorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
      onStopCallback(audioBlob);
    };

    return recorder;
  }
}

export default AudioRecorderService;
