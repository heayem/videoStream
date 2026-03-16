const videoId = window.location.pathname.split('/').pop();
const video = document.getElementById('videoPlayer');
const src = '/stream/' + videoId + '/master.m3u8';
if (Hls.isSupported()) {
    const hls = new Hls({ capLevelToPlayerSize: true });
    hls.loadSource(src);
    hls.attachMedia(video);
} else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = src;
}
