(async () => {
  const video = document.createElement("video");
  document.body.prepend(video);

  video.src =
    "https://mdn.github.io/learning-area/html/multimedia-and-embedding/video-and-audio-content/rabbit320.mp4";

  video.loop = true;
  video.controls = true;
  video.style.opacity = 0;

  await video.play();

  function handler(/** @type {MediaSessionActionDetails} */ { action }) {
    console.log(action);
  }

  navigator.mediaSession.setActionHandler("pause", handler);
  navigator.mediaSession.setActionHandler("play", handler);
  navigator.mediaSession.setActionHandler("previoustrack", handler);
  navigator.mediaSession.setActionHandler("nexttrack", handler);
  navigator.mediaSession.setActionHandler("seekbackward", handler);
  navigator.mediaSession.setActionHandler("seekforward", handler);
})();
