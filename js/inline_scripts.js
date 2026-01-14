
    DisableDevtool({
      clearLog: true,
      disableCopy: true,
      disableCut: true,
      disablePaste: true,
      disableSelect: true,
      disableDevtoolAuto: true
    });
  


    /* ---------------------------
      Load JW Player library dynamically
    ---------------------------- */
    (function(){
      // Use a working JW Player library URL
      const DEFAULT_JW_URL = 'https://cdn.jwplayer.com/libraries/SAHhwvZq.js';
      window._jwLibUrl = DEFAULT_JW_URL;

      // create loader
      function loadJW(url, cb) {
        if(window.jwplayer) { cb && cb(null); return; }
        const s = document.createElement('script');
        s.src = url;
        s.async = true;
        s.onload = function(){ console.log('JW library loaded:', url); cb && cb(null); };
        s.onerror = function(err){ console.warn('JW library failed to load:', url, err); cb && cb(err || new Error('JW load failed')); };
        document.head.appendChild(s);
      }

      // Load JW Player
      loadJW(window._jwLibUrl, function(err){
        if(err) console.warn('JW Player library failed to load');
      });
    })();
  


    // ---------- Improved Theme sync to system ----------
    (function(){
      function applyTheme(isDark) {
        if(isDark) {
          document.body.classList.add('dark');
        } else {
          document.body.classList.remove('dark');
        }
      }
      
      // Check initial theme
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mq.matches);
      
      // Listen for theme changes
      if (mq.addEventListener) {
        mq.addEventListener('change', (e) => applyTheme(e.matches));
      } else if (mq.addListener) {
        mq.addListener((e) => applyTheme(e.matches));
      }
    })();

    // small UI/modal behavior
    (function(){
      $('#skpop').addClass('show'); 
      $('#skpop').attr('aria-hidden','false');
      $('#closeModal, #alreadyJoined').on('click', function(){ 
        $('#skpop').removeClass('show'); 
        $('#skpop').attr('aria-hidden','true'); 
      });
      $('#joinChannel').on('click', function(){ 
        window.open('https://t.me/cine_arena','_blank'); 
        $('#skpop').removeClass('show'); 
        $('#skpop').attr('aria-hidden','true'); 
      });
      
    })();

    /* ---------- Player code with improved JW initialization ---------- */
    let hls, plyrPlayer, jwPlayerInstance, shakaPlayerInstance, dPlayerInstance;

    function getUrlParam(name) {
      var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
      var r = window.location.search.substr(1).match(reg);
      if (r != null) return unescape(r[2]);
      return null;
    }

    function showError(message) {
      const err = document.getElementById('errorMessage');
      err.style.display = 'block';
      const p = err.querySelector('p');
      if (p) p.textContent = message;
      document.getElementById('player').style.display = 'none';
      document.querySelector('.language-buttons').style.display = 'none';
    }

    function hideError() {
      const err = document.getElementById('errorMessage');
      err.style.display = 'none';
      document.getElementById('player').style.display = 'block';
      document.querySelector('.language-buttons').style.display = 'grid';
    }

    function showMainContent(){
      document.getElementById('pageLoader').classList.add('hidden');
      document.getElementById('mainContent').style.display = 'block';
      setTimeout(()=>window.dispatchEvent(new Event('resize')), 160);
    }

    // Improved header spacing - fixed
    (function(){
      const header = document.getElementById('topHeader');
      const mainWrap = document.getElementById('mainWrap');
      
      function setTopPadding(){
        try {
          const h = Math.ceil(header.getBoundingClientRect().height);
          // Reduced padding to eliminate gap
          mainWrap.style.paddingTop = '8px';
        } catch(e){}
      }
      
      // Call immediately and on relevant events
      setTopPadding();
      window.addEventListener('load', setTopPadding);
      window.addEventListener('resize', setTopPadding);
      
      // Also adjust on DOM changes that might affect header height
      const observer = new MutationObserver(setTopPadding);
      if (header) {
        observer.observe(header, { 
          childList: true, 
          subtree: true, 
          attributes: true 
        });
      }
    })();

    function cleanup(){
      if(hls){ try{ hls.destroy(); }catch(e){} hls = null; }
      if(plyrPlayer){ try{ plyrPlayer.destroy(); }catch(e){} plyrPlayer = null; }
      if(jwPlayerInstance){ try{ jwPlayerInstance.remove(); }catch(e){} jwPlayerInstance = null; }
      if(shakaPlayerInstance){ try{ shakaPlayerInstance.destroy(); }catch(e){} shakaPlayerInstance = null; }
      if(dPlayerInstance){ try{ dPlayerInstance.destroy(); }catch(e){} dPlayerInstance = null; }
    }

    // HLS + Plyr
    function initHlsPlayer(url, headers = {}) {
      const container = document.getElementById('player');
      container.innerHTML = '';
      const video = document.createElement('video');
      video.setAttribute('crossorigin', 'anonymous');
      ['controls', 'playsinline', 'autoplay', 'muted'].forEach(attr => video.setAttribute(attr, ''));
      video.classList.add('plyr__video');
      container.appendChild(video);

      cleanup();

      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        xhrSetup: function(xhr) {
          xhr.withCredentials = false;
        }
      });

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const levels = hls.levels.map((l, i) => ({ height: l.height, index: i })).sort((a, b) => b.height - a.height);
        const qualityOptions = [0, ...levels.map(l => l.height)];

        const plyrOptions = {
          controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'fullscreen'],
          settings: ['quality'],
          quality: {
            default: 0,
            options: qualityOptions,
            forced: true,
            onChange: q => { hls.currentLevel = q === 0 ? -1 : levels.find(l => l.height === q).index; }
          },
          i18n: { qualityLabel: { 0: 'Auto' } }
        };

        try { if (plyrPlayer) plyrPlayer.destroy(); } catch(e) {}
        plyrPlayer = new Plyr(video, plyrOptions);

        plyrPlayer.on('enterfullscreen', () => { try{ screen.orientation?.lock('landscape'); } catch(e){} });
        plyrPlayer.on('exitfullscreen', () => { try{ screen.orientation?.unlock(); } catch(e){} });

        video.play().catch(() => { video.muted = true; return video.play(); });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS Error:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR: hls.startLoad(); break;
            case Hls.ErrorTypes.MEDIA_ERROR: hls.recoverMediaError(); break;
            default: try{ hls.destroy(); } catch(e){} break;
          }
        }
      });
    }

    // DPlayer
    function initDPlayer(url, headers = {}) {
      const container = document.getElementById('player');
      container.innerHTML = '<div id="dplayer-container"></div>';
      cleanup();
      const videoUrl = getUrlParam('url') || url;

      dPlayerInstance = new DPlayer({
        container: document.getElementById('dplayer-container'),
        autoplay: true,
        volume: 0.8,
        mutex: false,
        video: {
          url: videoUrl,
          type: 'auto',
          customType: {
            'hls': function(video, player) {
              const localHls = new Hls();
              localHls.loadSource(video.src);
              localHls.attachMedia(video);
            }
          }
        },
        contextmenu: [],
        controls: true,
        lang: 'en',
        fullscreen: function() { if (window.innerWidth < 768 || window.innerHeight > window.innerWidth) try{ screen.orientation?.lock('landscape'); } catch(e){} }
      });
    }

    // Iframe fallback
    function initIframePlayer(url) {
      const container = document.getElementById('player');
      container.innerHTML = '';
      const iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.setAttribute('loading', 'lazy');
      iframe.setAttribute('allow', 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen; geolocation; web-share; speaker-selection; screen-wake-lock; idle-detection');
      iframe.setAttribute('allowfullscreen', '');
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '12px';
      container.appendChild(iframe);
    }

    // Improved JW Player initialization
    function initJwPlayer(url, drmConfig = null) {
      const container = document.getElementById('player');
      container.innerHTML = '<div id="jw-container"></div>';
      cleanup();

      const config = {
        file: url,
        width: '100%',
        height: '100%',
        aspectratio: '16:9',
        autostart: true,
        mute: true,
        controls: true
      };
      if (drmConfig) config.drm = drmConfig;

      // Improved JW Player loading with better error handling
      function initializeJWPlayer() {
        if (typeof jwplayer !== 'undefined' && typeof jwplayer === 'function') {
          try {
            jwPlayerInstance = jwplayer('jw-container').setup(config);
            console.log('JW Player initialized successfully');
          } catch (e) {
            console.error('JW Player setup error:', e);
            showError('JW Player failed to initialize. Trying fallback player...');
            // Fallback to HLS if JW fails
            if (url && url.includes('.m3u8')) {
              initHlsPlayer(url);
            }
          }
        } else {
          // Retry after a short delay if JW Player not loaded yet
          setTimeout(initializeJWPlayer, 500);
        }
      }

      initializeJWPlayer();
    }

    // Shaka (mpd)
    function initShakaPlayer(url, keyId, key) {
      const container = document.getElementById('player');
      container.innerHTML = '';
      const video = document.createElement('video');
      video.style.width = '100%'; video.style.height = '100%';
      video.setAttribute('playsinline', ''); video.setAttribute('controls', ''); video.setAttribute('autoplay', ''); video.muted = true; video.controls = false;
      container.appendChild(video);

      const player = new shaka.Player(video);
      player.configure({ drm: { clearKeys: { [keyId]: key } } });

      const ui = new shaka.ui.Overlay(player, container, video);
      const uiConfig = {
          controlPanelElements: [
            'play_pause', 'mute', 'volume', 'time_and_duration', 'spacer', 'picture_in_picture', 'overflow_menu', 'fullscreen'
          ],
          addSeekBar: true,
          seekBarColors: {
            base: 'rgba(255, 255, 255, 0.3)',
            buffered: 'rgba(255, 255, 255, 0.5)',
            played: 'rgba(220, 38, 38, 0.9)'
          },
          volumeBarColors: {
            base: 'rgba(255,255,255,0.3)',
            level: 'rgba(220,38,38,0.9)'
          }
        };
        ui.configure(uiConfig);

      player.load(url).then(() => { video.play().catch(e => console.error('Shaka play error', e)); }).catch(e => console.error('Shaka load error', e));
      shakaPlayerInstance = player;
    }

    function loadStream(stream) {
      cleanup();
      if (!stream) { showError('No stream data'); return; }
      if (stream.type === 'hls') initHlsPlayer(stream.url, stream.headers || {});
      else if (stream.type === 'dplayer') initDPlayer(stream.url, stream.headers || {});
      else if (stream.type === 'iframe') initIframePlayer(stream.url);
      else if (stream.type === 'jw') initJwPlayer(stream.url);
      else if (stream.type === 'mpd-jw') initJwPlayer(stream.url, { clearkey: { keyId: stream.keyId, key: stream.key } });
      else if (stream.type === 'mpd-shaka') initShakaPlayer(stream.url, stream.keyId, stream.key);
      else showError('Unknown stream type');
    }

    function createLanguageButtons(streams) {
      const btnContainer = document.querySelector('.language-buttons');
      btnContainer.innerHTML = '';
      Object.entries(streams || {}).forEach(([lang, stream], i) => {
        const btn = document.createElement('button');
        btn.className = 'lang-btn';
        btn.textContent = lang;
        btn.onclick = () => {
          document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          loadStream(stream);
        };
        btnContainer.appendChild(btn);
        if (i === 0) btn.click();
      });
    }

    // init page and fetch matches
    function initializePage() {
      $('#skpop').addClass('show');
      $('#skpop').attr('aria-hidden','false');
      $('#closeModal, #alreadyJoined').on('click',function(){ $('#skpop').removeClass('show'); $('#skpop').attr('aria-hidden','true'); });
      $('#joinChannel').on('click',function(){ window.open('https://t.me/cine_arena','_blank'); $('#skpop').removeClass('show'); $('#skpop').attr('aria-hidden','true'); });

      const matchId = getUrlParam('id');
      if (!matchId) {
        showError("No match ID provided. Please add ?id=1 or choose a match below.");
        document.querySelector('.match-select').style.display = 'block';
        const matchSelect = document.getElementById('matchSelect');

        fetch('https://raw.githubusercontent.com/cinearena/json/refs/heads/main/ipl.json')
          .then(response => response.json())
          .then(matches => {
            matchSelect.innerHTML = '';
            Object.keys(matches || {}).slice(0,10).forEach(k => {
              const opt = document.createElement('option'); opt.value = k; opt.textContent = 'Match ' + k; matchSelect.appendChild(opt);
            });
            matchSelect.onchange = () => {
              if (matches[matchSelect.value]) {
                hideError();
                createLanguageButtons(matches[matchSelect.value]);
              } else showError('Invalid match selected');
            };
            showMainContent();
          })
          .catch(err => {
            console.error('Error fetching matches', err);
            showMainContent();
          });
        return;
      }

      fetch('https://raw.githubusercontent.com/cinearena/json/refs/heads/main/ipl.json')
        .then(r => r.json())
        .then(matches => {
          if (matches && matches[matchId]) {
            hideError();
            createLanguageButtons(matches[matchId]);
          } else {
            showError('Invalid match ID: ' + matchId);
          }
          showMainContent();
        })
        .catch(err => {
          console.error('Error fetching matches', err);
          showMainContent();
        });
    }

    document.addEventListener('DOMContentLoaded', initializePage);
  
