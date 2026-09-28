let mediaRecorder;
let audioChunks = [];

function startRecording() {
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start();
    audioChunks = [];

    mediaRecorder.addEventListener("dataavailable", event => {
      audioChunks.push(event.data);
    });

    mediaRecorder.addEventListener("stop", () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      const audioUrl = URL.createObjectURL(audioBlob);
      document.getElementById("audioPlayer").src = audioUrl;

      const file = new File([audioBlob], "enregistrement.webm", { type: "audio/webm" });

      // simuler un input type="file" via DataTransfer (nouvelle API)
      const dt = new DataTransfer();
      dt.items.add(file);
      document.getElementById("audioInput").files = dt.files;
    });
  });
}

function stopRecording() {
  mediaRecorder.stop();
}