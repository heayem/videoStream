const videoId = window.location.pathname.split('/').pop();
fetch(`/api/videos/${videoId}`)
  .then(res => res.json())
  .then(video => {
      document.getElementById('videoTitle').innerText = video.title || video.id;
      const videoEl = document.getElementById('videoPlayer');
      const src = '/stream/' + videoId + '/master.m3u8';

      if(Hls.isSupported()){
          const hls = new Hls({ capLevelToPlayerSize:true });
          hls.loadSource(src);
          hls.attachMedia(videoEl);
          window.currentHls = hls;

          hls.on(Hls.Events.MANIFEST_PARSED, ()=>{
              const qc = document.getElementById('qualityControls');
              let html = '';
              hls.levels.forEach((level,index)=> {
                if(level.height > 0) html += '<button onclick="window.currentHls.currentLevel='+index+'">'+level.height+'p</button>'
              });
              qc.innerHTML = html;
              
              const buttons = Array.from(qc.children);
              if (buttons.length > 0) {
                buttons[0].classList.add('active');
                window.currentHls.currentLevel = 0; // Default to the lowest quality instead of auto
              }

              qc.addEventListener('click', e=>{
                  if(e.target.tagName==='BUTTON'){
                      buttons.forEach(btn=>btn.classList.remove('active'));
                      e.target.classList.add('active');
                  }
              });
          });
      } else if(videoEl.canPlayType('application/vnd.apple.mpegurl')){
          videoEl.src = src;
      }
  });
