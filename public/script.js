// ── Tab switching ──
function switchTab(name, el) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('panel-' + name).classList.add('active');
  if (name === 'library') fetchVideos();
}

// ── Fetch & render videos ──
async function fetchVideos() {
  const list = document.getElementById('videoList');
  list.innerHTML = '<div class="loading-row">Loading…</div>';

  try {
    const res = await fetch('/api/videos');
    const videos = await res.json();
    renderVideos(videos);
  } catch {
    list.innerHTML = '<div class="loading-row" style="color:var(--red)">Failed to load videos.</div>';
  }
}

function renderVideos(videos) {
  const list = document.getElementById('videoList');
  const count = document.getElementById('libraryCount');
  count.textContent = videos.length === 1 ? '1 video' : videos.length + ' videos';

  if (!videos.length) {
    list.innerHTML = '<div class="empty-state"><span class="icon">📭</span>No videos yet. Upload one to get started.</div>';
    return;
  }

  list.innerHTML = '';
  videos.forEach(v => {
    const isReady = v.status === 'ready';
    const title = v.title || 'Untitled';
    const embedCode = `<iframe src="${location.origin}/embed/${v.id}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`;

    const wrap = document.createElement('div');
    wrap.style.display = 'contents';
    wrap.innerHTML = `
      <div class="video-row" id="row-${v.id}">
        <div class="thumb-cell">
          ${isReady
            ? `<img src="/stream/${v.id}/thumbnail.jpg" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'thumb-placeholder',textContent:'🎞️'}))">`
            : '<div class="thumb-placeholder">🕐</div>'}
        </div>
        <div class="meta-cell">
          <div class="meta-title-row" id="title-display-${v.id}">
            <span class="meta-title" id="title-text-${v.id}">${escHtml(title)}</span>
            <span class="badge badge-${v.status}">${v.status}</span>
            <button class="btn-tiny" onclick="editTitle('${v.id}')">Edit</button>
          </div>
          <div class="title-edit-wrap" id="title-edit-${v.id}">
            <input class="title-edit-input" id="title-input-${v.id}" value="${escAttr(title)}">
            <button class="btn-tiny save" onclick="saveTitle('${v.id}')">Save</button>
            <button class="btn-tiny cancel" onclick="cancelEdit('${v.id}')">✕</button>
          </div>
          <div class="meta-tags">
            <span class="meta-id">${v.id}</span>
            ${v.library ? `<span class="tag tag-lib">Library: ${escHtml(v.library)}</span>` : ''}
            ${v.collection ? `<span class="tag tag-col">Collection: ${escHtml(v.collection)}</span>` : ''}
          </div>
        </div>
        <div class="actions-cell">
          ${isReady ? `
            <button class="btn-action play" onclick="playVideo('${v.id}', this.dataset.title)" data-title="${escAttr(title)}">Play</button>
            <button class="btn-action" onclick="toggleEmbed('${v.id}')">Embed</button>
          ` : ''}
          <button class="btn-action del" onclick="deleteVideo('${v.id}')">Delete</button>
        </div>
        <div class="embed-row" id="embed-${v.id}">
          <div class="embed-label">Embed snippet</div>
          <input class="embed-code" readonly value="${escAttr(embedCode)}" onclick="this.select()">
        </div>
      </div>`;
    list.appendChild(wrap);
  });
}

function toggleEmbed(id) {
  const el = document.getElementById('embed-' + id);
  el.classList.toggle('open');
}

// ── Title editing ──
function editTitle(id) {
  document.getElementById('title-display-' + id).style.display = 'none';
  const editWrap = document.getElementById('title-edit-' + id);
  editWrap.style.display = 'flex';
  document.getElementById('title-input-' + id).focus();
}
function cancelEdit(id) {
  document.getElementById('title-display-' + id).style.display = 'flex';
  document.getElementById('title-edit-' + id).style.display = 'none';
}
async function saveTitle(id) {
  const val = document.getElementById('title-input-' + id).value;
  await fetch('/api/videos/' + id, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: val })
  });
  fetchVideos();
}

// ── Upload ──
async function uploadVideo() {
  const fileInput = document.getElementById('videoFile');
  const thumbInput = document.getElementById('thumbnailFile');
  const titleInput = document.getElementById('videoTitle');
  const libraryInput = document.getElementById('videoLibrary');
  const collectionInput = document.getElementById('videoCollection');

  if (!fileInput.files[0]) return alert('Please select a video file first.');

  const formData = new FormData();
  formData.append('video', fileInput.files[0]);
  if (thumbInput.files[0]) formData.append('thumbnail', thumbInput.files[0]);
  formData.append('title', titleInput.value);
  formData.append('library', libraryInput.value);
  formData.append('collection', collectionInput.value);

  const uploadBtn = document.getElementById('uploadBtn');
  const progressWrap = document.getElementById('progressWrap');
  const progressFill = document.getElementById('progressFill');
  const progressLabel = document.getElementById('progressLabel');

  uploadBtn.disabled = true;
  progressWrap.style.display = 'block';

  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/videos', true);

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      const pct = Math.round((e.loaded / e.total) * 100);
      progressFill.style.width = pct + '%';
      progressLabel.textContent = pct + '%';
    }
  };

  xhr.onload = () => {
    uploadBtn.disabled = false;
    progressWrap.style.display = 'none';
    progressFill.style.width = '0%';

    if (xhr.status === 201) {
      fileInput.value = '';
      thumbInput.value = '';
      titleInput.value = '';
      libraryInput.value = '';
      collectionInput.value = '';
      document.getElementById('videoFileName').textContent = 'Drop or click to select';
      document.getElementById('thumbFileName').textContent = 'Auto-generated if blank';

      // Auto-switch to library
      const libTab = document.querySelectorAll('.tab-btn')[1];
      switchTab('library', libTab);

      const poll = setInterval(async () => {
        const res = await fetch('/api/videos');
        const videos = await res.json();
        renderVideos(videos);
        if (!videos.some(v => v.status === 'pending')) clearInterval(poll);
      }, 5000);
    } else {
      let errText = xhr.responseText;
      try {
        const errObj = JSON.parse(errText);
        if (errObj.error) errText = errObj.error;
      } catch (e) {}
      alert('Upload failed: ' + errText);
    }
  };

  xhr.onerror = () => {
    uploadBtn.disabled = false;
    progressWrap.style.display = 'none';
    alert('Upload error.');
  };

  xhr.send(formData);
}

// ── Delete ──
async function deleteVideo(id) {
  if (!confirm('Delete this video?')) return;
  await fetch('/api/videos/' + id, { method: 'DELETE' });
  fetchVideos();
}

// ── Helpers ──
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function escAttr(s) {
  return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;');
}

// ── Video Player Modal ──
let currentHls = null;

function playVideo(id, title) {
  const modal = document.getElementById('videoModal');
  const videoEl = document.getElementById('videoPlayerModal');
  const qc = document.getElementById('qualityControls');
  document.getElementById('modalTitle').innerText = title || 'Video Player';
  modal.classList.add('active');
  const src = `/stream/${id}/master.m3u8`;

  if (Hls.isSupported()) {
    if (currentHls) { currentHls.destroy(); }
    const hls = new Hls({ capLevelToPlayerSize: true });
    hls.loadSource(src);
    hls.attachMedia(videoEl);
    currentHls = hls;

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      let html = '';
      hls.levels.forEach((level, index) => {
        if (level.height > 0) {
           html += `<button class="quality-btn" data-level="${index}">${level.height}p</button>`;
        }
      });
      qc.innerHTML = html;
      
      const buttons = Array.from(qc.children);
      if (buttons.length > 0) {
        buttons[0].classList.add('active');
        currentHls.currentLevel = parseInt(buttons[0].getAttribute('data-level'));
      }

      buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          buttons.forEach(b => b.classList.remove('active'));
          e.target.classList.add('active');
          currentHls.currentLevel = parseInt(e.target.getAttribute('data-level'));
        });
      });
      videoEl.play();
    });
  } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
    videoEl.src = src;
    videoEl.play();
  }
}

function closeModal() {
  const modal = document.getElementById('videoModal');
  const videoEl = document.getElementById('videoPlayerModal');
  modal.classList.remove('active');
  videoEl.pause();
  videoEl.removeAttribute('src');
  videoEl.load();
  if (currentHls) { currentHls.destroy(); currentHls = null; }
}
