    document.addEventListener('DOMContentLoaded', function() {
      console.log('CineArena Player Initializing...');
      
      // DOM Elements
      const playerContainer = document.getElementById('player');
      const categoryTabs = document.getElementById('categoryTabs');
      const streamButtons = document.getElementById('streamButtons');
      const infoPanel = document.getElementById('infoPanel');
      const streamInfo = document.getElementById('streamInfo');
      const errorMessage = document.getElementById('errorMessage');
      const customSpinner = document.getElementById('customSpinner');
      const searchContainer = document.getElementById('searchContainer');
      const searchInput = document.getElementById('searchInput');
      
      // Get ID from URL parameter
      function getUrlParameter(name) {
        name = name.replace(/[\[\]]/g, '\\$&');
        const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
        const results = regex.exec(window.location.href);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
      }
      
      const streamId = getUrlParameter('id');
      
      // Fetch JSON data from external file
      async function fetchStreamsData() {
        try {
          // You can change this URL to your external JSON file
          const response = await fetch('https://matches.asifansaribr.workers.dev/');
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return await response.json();
        } catch (error) {
          console.error('Error fetching streams data:', error);
          // Fallback to local data if fetch fails
          return getLocalStreamsData();
        }
      }
      
      // Local fallback data (same as your original data)
      function getLocalStreamsData() {
        return {
          "wpl": {
            "Jio-Hotstar [Hindi]": {
              "url": "https://allrounderlive.pages.dev/player?url=https://dillzyserver.dillzycreations.workers.dev/live/king.m3u8",
              "type": "iframe"
            },
            "Willow [iOS]": {
              "url": "https://allrounderlive.pages.dev/player?url=https://amg01269-amg01269c1-sportstribal-emea-5204.playouts.now.amagi.tv/ts-eu-w1-n2/playlist/amg01269-willowtvfast-willowplus-sportstribalemea/playlist.m3u8",
              "type": "iframe"
            },
            "WILLOW SD": {
              "url": "https://ottb.live.cf.ww.aiv-cdn.net/lhr-nitro/live/clients/dash-sd/enc/sq3nwcl4j4/out/v1/41930b7349364099bb1b4ef153032937/cenc-sd.mpd",
              "type": "mpd-shaka",
              "keyId": "4ae41f5965180707b310360dc5060c09",
              "key": "f78d1ba450f7ff87f215eb472cb4e17e"
            }   
          },
          "u19": {
            "Hindi": {
              "url": "https://cinearena.github.io/id/sports.html?id=Star2HINDISD",
              "type": "iframe",
              "keyId": "9457eb90129456fa8ea95e10ba4ac51e",
              "key": "e620a970cea474c491ac78ae71a4d764"
            },
            "WILLOW": {
              "url": "https://otte.live.fly.ww.aiv-cdn.net/iad-nitro/live/clients/dash/enc/etebjbu25h/out/v1/935090e6afe6461594b16a907ce1c30b/cenc.mpd",
              "type": "mpd-shaka",
              "keyId": "98b8700f64cb7149fc4695c66b7d8687",
              "key": "3f67576ea915c603c13aed959474bea8"
            },
            "PRIME": {
              "url": "https://otte.live.fly.ww.aiv-cdn.net/syd-nitro/live/clients/dash-sd/enc/khizze9pef/out/v1/89aee82791d94c9ea9eb181b74f9ec4e/cenc-sd.mpd",
              "type": "mpd-shaka",
              "keyId": "a7a854393efeeb6067fd79b0cf2bad85",
              "key": "6bcbb19ef718eb4c965afa3a1f088f2f"
            },
            "Star Sports-2": {
              "url": "https://cricketstan.github.io/Channel-14/",
              "type": "iframe",
              "keyId": "9457eb90129456fa8ea95e10ba4ac51e",
              "key": "e620a970cea474c491ac78ae71a4d764"
            }
          }
        };
      }
      
      // State variables
      let currentCategory = null;
      let currentStream = null;
      let currentPlayer = null;
      let streamsData = {};
      let allStreamsData = {};
      let streamStatus = 'stopped'; // 'stopped', 'loaded', 'playing', 'failed'
      let autoPlayFirstChannel = false;
      
      // Initialize UI with fetched data
      async function initializeUI() {
        console.log('Initializing UI...');
        
        // Show loading state
        categoryTabs.innerHTML = '<div class="loader-spinner"></div>';
        streamButtons.innerHTML = '<p>Loading streams...</p>';
        
        try {
          // Fetch data from external JSON file
          allStreamsData = await fetchStreamsData();
          
          // Check if we have an ID search parameter
          let filteredData = allStreamsData;
          if (streamId) {
            console.log('Filtering for ID:', streamId);
            filteredData = filterDataById(allStreamsData, streamId);
            
            // Update page title
            document.title = `${streamId.toUpperCase()} - CineArena.Live`;
            
            // Set flag to auto-play first channel
            autoPlayFirstChannel = true;
          }
          
          // Store filtered data
          streamsData = filteredData;
          
          // Show search bar if we have multiple categories
          if (Object.keys(streamsData).length > 1) {
            searchContainer.classList.remove('hidden');
            setupSearch();
          }
          
          // Create category tabs from filtered data
          createCategoryTabs(streamsData);
          
          // Select first category by default
          const firstCategory = Object.keys(streamsData)[0];
          if (firstCategory) {
            selectCategory(firstCategory, true); // Pass true to indicate initial load
          } else {
            showNoStreamsMessage();
          }
        } catch (error) {
          console.error('Error initializing UI:', error);
          showErrorMessage('Failed to load streams data');
        }
      }
      
      // Setup search functionality
      function setupSearch() {
        searchInput.addEventListener('input', function() {
          const searchTerm = this.value.toLowerCase().trim();
          
          if (searchTerm === '') {
            // Reset to original data
            streamsData = allStreamsData;
            createCategoryTabs(streamsData);
            
            // Select first category
            const firstCategory = Object.keys(streamsData)[0];
            if (firstCategory) {
              selectCategory(firstCategory, false);
            }
          } else {
            // Filter data
            const filteredData = filterDataById(allStreamsData, searchTerm);
            streamsData = filteredData;
            
            // Update UI
            createCategoryTabs(streamsData);
            
            if (Object.keys(streamsData).length > 0) {
              // Select first filtered category
              const firstCategory = Object.keys(streamsData)[0];
              selectCategory(firstCategory, false);
            } else {
              categoryTabs.innerHTML = '';
              streamButtons.innerHTML = `
                <div class="error-message">
                  <h2>No Results Found</h2>
                  <p>No streams match your search: "${searchTerm}"</p>
                </div>
              `;
            }
          }
        });
      }
      
      // Filter data by ID (search in category names and stream names)
      function filterDataById(data, searchTerm) {
        const filtered = {};
        const searchLower = searchTerm.toLowerCase();
        
        Object.keys(data).forEach(category => {
          // Check if category matches search
          if (category.toLowerCase().includes(searchLower)) {
            filtered[category] = data[category];
          } else {
            // Check if any stream in this category matches search
            const matchingStreams = {};
            Object.keys(data[category]).forEach(streamName => {
              if (streamName.toLowerCase().includes(searchLower)) {
                matchingStreams[streamName] = data[category][streamName];
              }
            });
            
            // If we found matching streams in this category, add the category
            if (Object.keys(matchingStreams).length > 0) {
              filtered[category] = matchingStreams;
            }
          }
        });
        
        return filtered;
      }
      
      // Show no streams message
      function showNoStreamsMessage() {
        categoryTabs.innerHTML = '';
        streamButtons.innerHTML = `
          <div class="error-message">
            <h2>No Streams Found</h2>
            <p>No streams match your search: "${streamId}"</p>
            <p><a href="?" style="color: var(--sky-medium); text-decoration: underline;">View all streams</a></p>
          </div>
        `;
      }
      
      // Show error message
      function showErrorMessage(message) {
        streamButtons.innerHTML = `
          <div class="error-message">
            <h2>Error Loading Streams</h2>
            <p>${message}</p>
          </div>
        `;
      }
      
      // Create category tabs
      function createCategoryTabs(data) {
        categoryTabs.innerHTML = '';
        
        Object.keys(data).forEach(category => {
          const tab = document.createElement('div');
          tab.className = 'category-tab';
          tab.textContent = category.toUpperCase();
          tab.dataset.category = category;
          
          // Add live badge to category tab if it matches the searched ID
          if (streamId && category.toLowerCase() === streamId.toLowerCase()) {
            const liveBadge = document.createElement('span');
            liveBadge.className = 'category-live-badge';
            liveBadge.textContent = 'LIVE';
            tab.appendChild(liveBadge);
          }
          
          tab.addEventListener('click', () => {
            selectCategory(category, false);
          });
          
          categoryTabs.appendChild(tab);
        });
      }
      
      // Select category
      function selectCategory(category, isInitialLoad = false) {
        console.log('Selecting category:', category, 'isInitialLoad:', isInitialLoad);
        
        // Update active tab
        document.querySelectorAll('.category-tab').forEach(tab => {
          tab.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');
        
        currentCategory = category;
        
        // Create stream buttons for this category
        createStreamButtons(category);
        
        // Hide info panel
        infoPanel.classList.remove('visible');
        
        // Clear player if no stream selected
        clearPlayer();
        
        // Auto-play first channel if we're searching by ID and this is initial load
        if (streamId && isInitialLoad && autoPlayFirstChannel) {
          autoPlayFirstChannel = false; // Reset flag
          autoPlayFirstStream(category);
        }
      }
      
      // Create stream buttons for category
      function createStreamButtons(category) {
        console.log('Creating stream buttons for:', category);
        
        streamButtons.innerHTML = '';
        const streams = streamsData[category];
        
        Object.keys(streams).forEach(streamName => {
          const stream = streams[streamName];
          const button = document.createElement('div');
          button.className = 'stream-button';
          
          button.innerHTML = `
            ${streamName}
            <div class="stream-type">${stream.type}</div>
            ${stream.keyId ? '<span class="stream-badge">DRM</span>' : ''}
          `;
          
          button.addEventListener('click', () => {
            selectStream(category, streamName, stream);
          });
          
          streamButtons.appendChild(button);
        });
      }
      
      // Auto-play first stream in category
      function autoPlayFirstStream(category) {
        const streams = streamsData[category];
        const firstStreamName = Object.keys(streams)[0];
        
        if (firstStreamName) {
          console.log('Auto-playing first stream:', firstStreamName);
          const firstStream = streams[firstStreamName];
          
          // Simulate click on first stream button
          const firstButton = streamButtons.querySelector('.stream-button');
          if (firstButton) {
            firstButton.classList.add('active');
            selectStream(category, firstStreamName, firstStream, true);
          }
        }
      }
      
      // Select stream
      async function selectStream(category, streamName, streamData, isAutoPlay = false) {
        console.log('Selecting stream:', streamName, 'isAutoPlay:', isAutoPlay);
        
        if (!isAutoPlay) {
          // Update active button only if not auto-playing
          document.querySelectorAll('.stream-button').forEach(btn => {
            btn.classList.remove('active');
          });
          event.target.closest('.stream-button').classList.add('active');
        }
        
        currentStream = { category, name: streamName, data: streamData };
        
        // Show loading spinner
        customSpinner.style.display = 'flex';
        errorMessage.classList.add('hidden');
        
        // Reset status
        streamStatus = 'stopped';
        
        // Update info panel with loading status
        updateInfoPanel(category, streamName, streamData, streamStatus);
        infoPanel.classList.add('visible');
        
        // Load stream
        try {
          await loadStream(streamData);
        } catch (error) {
          console.error('Error loading stream:', error);
          streamStatus = 'failed';
          updateInfoPanel(category, streamName, streamData, streamStatus);
          errorMessage.classList.remove('hidden');
          customSpinner.style.display = 'none';
        }
      }
      
      // Load stream based on type
      async function loadStream(streamData) {
        console.log('Loading stream type:', streamData.type);
        
        // Clear existing player
        clearPlayer();
        
        // Reset stream status
        streamStatus = 'stopped';
        
        switch(streamData.type) {
          case 'iframe':
            await loadIframeStream(streamData);
            break;
            
          case 'mpd-shaka':
            await loadMpdShakaStream(streamData);
            break;
            
          case 'hls':
            await loadHlsStream(streamData);
            break;
            
          default:
            throw new Error(`Unsupported stream type: ${streamData.type}`);
        }
        
        // Hide spinner after a delay
        setTimeout(() => {
          customSpinner.style.display = 'none';
        }, 1000);
      }
      
      // Load iframe stream
      function loadIframeStream(streamData) {
        return new Promise((resolve) => {
          const iframe = document.createElement('iframe');
          iframe.src = streamData.url;
          iframe.allow = 'autoplay; encrypted-media; fullscreen';
          iframe.allowFullscreen = true;
          
          // Set stream as loaded
          streamStatus = 'loaded';
          updateInfoPanel(currentStream.category, currentStream.name, currentStream.data, streamStatus);
          
          // Set stream as playing for iframe
          streamStatus = 'playing';
          updateInfoPanel(currentStream.category, currentStream.name, currentStream.data, streamStatus);
          
          playerContainer.appendChild(iframe);
          currentPlayer = iframe;
          resolve();
        });
      }
      
      // Load MPD stream with Shaka Player
      async function loadMpdShakaStream(streamData) {
        // Check if Shaka Player is loaded
        if (!window.shaka) {
          throw new Error('Shaka Player not loaded');
        }
        
        shaka.polyfill.installAll();
        
        const video = document.createElement('video');
        video.id = 'shaka-video';
        video.setAttribute('controls', 'false');
        video.setAttribute('autoplay', '');
        video.style.width = '100%';
        video.style.height = '100%';
        
        playerContainer.appendChild(video);
        
        const player = new shaka.Player(video);
        const ui = new shaka.ui.Overlay(player, playerContainer, video);
        
        // Configure DRM if keys are provided
        if (streamData.keyId && streamData.key) {
          const drmConfig = {
            servers: {
              'com.widevine.alpha': 'https://widevine-dash.ezdrm.com/proxy?pX=288FF5&user_id=MTAwMA=='
            },
            clearKeys: {
              [streamData.keyId]: streamData.key
            }
          };
          player.configure({
            drm: drmConfig
          });
        }
        
        try {
          await player.load(streamData.url);
          currentPlayer = player;
          
          // Set stream as loaded
          streamStatus = 'loaded';
          updateInfoPanel(currentStream.category, currentStream.name, currentStream.data, streamStatus);
          
          // Set stream as playing when autoplay works
          streamStatus = 'playing';
          updateInfoPanel(currentStream.category, currentStream.name, currentStream.data, streamStatus);
          
          // Listen for play events
          video.addEventListener('play', () => {
            streamStatus = 'playing';
            updateInfoPanel(currentStream.category, currentStream.name, currentStream.data, streamStatus);
          });
          
          // Listen for pause events
          video.addEventListener('pause', () => {
            streamStatus = 'loaded';
            updateInfoPanel(currentStream.category, currentStream.name, currentStream.data, streamStatus);
          });
          
          // Listen for error events
          video.addEventListener('error', () => {
            streamStatus = 'failed';
            updateInfoPanel(currentStream.category, currentStream.name, currentStream.data, streamStatus);
          });
          
        } catch (error) {
          console.error('Error loading MPD:', error);
          streamStatus = 'failed';
          updateInfoPanel(currentStream.category, currentStream.name, currentStream.data, streamStatus);
          throw error;
        }
      }
      
      // Load HLS stream with Plyr
      async function loadHlsStream(streamData) {
        const video = document.createElement('video');
        video.id = 'hls-video';
        video.setAttribute('controls', 'false');
        video.setAttribute('autoplay', '');
        video.style.width = '100%';
        video.style.height = '100%';
        
        playerContainer.appendChild(video);
        
        // Check if HLS.js is available
        if (window.Hls && Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(streamData.url);
          hls.attachMedia(video);
          
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            // Set stream as loaded
            streamStatus = 'loaded';
            updateInfoPanel(currentStream.category, currentStream.name, currentStream.data, streamStatus);
            
            video.play().then(() => {
              streamStatus = 'playing';
              updateInfoPanel(currentStream.category, currentStream.name, currentStream.data, streamStatus);
            }).catch(() => {
              streamStatus = 'loaded';
              updateInfoPanel(currentStream.category, currentStream.name, currentStream.data, streamStatus);
            });
          });
          
          // Listen for play events
          video.addEventListener('play', () => {
            streamStatus = 'playing';
            updateInfoPanel(currentStream.category, currentStream.name, currentStream.data, streamStatus);
          });
          
          // Listen for pause events
          video.addEventListener('pause', () => {
            streamStatus = 'loaded';
            updateInfoPanel(currentStream.category, currentStream.name, currentStream.data, streamStatus);
          });
          
          // Listen for error events
          video.addEventListener('error', () => {
            streamStatus = 'failed';
            updateInfoPanel(currentStream.category, currentStream.name, currentStream.data, streamStatus);
          });
          
          hls.on(Hls.Events.ERROR, () => {
            streamStatus = 'failed';
            updateInfoPanel(currentStream.category, currentStream.name, currentStream.data, streamStatus);
          });
          
          currentPlayer = hls;
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Native HLS support (Safari, iOS)
          video.src = streamData.url;
          video.addEventListener('loadedmetadata', () => {
            // Set stream as loaded
            streamStatus = 'loaded';
            updateInfoPanel(currentStream.category, currentStream.name, currentStream.data, streamStatus);
            
            video.play().then(() => {
              streamStatus = 'playing';
              updateInfoPanel(currentStream.category, currentStream.name, currentStream.data, streamStatus);
            }).catch(() => {
              streamStatus = 'loaded';
              updateInfoPanel(currentStream.category, currentStream.name, currentStream.data, streamStatus);
            });
          });
          
          // Listen for play events
          video.addEventListener('play', () => {
            streamStatus = 'playing';
            updateInfoPanel(currentStream.category, currentStream.name, currentStream.data, streamStatus);
          });
          
          // Listen for pause events
          video.addEventListener('pause', () => {
            streamStatus = 'loaded';
            updateInfoPanel(currentStream.category, currentStream.name, currentStream.data, streamStatus);
          });
          
          // Listen for error events
          video.addEventListener('error', () => {
            streamStatus = 'failed';
            updateInfoPanel(currentStream.category, currentStream.name, currentStream.data, streamStatus);
          });
          
          currentPlayer = video;
        } else {
          throw new Error('HLS not supported');
        }
      }
      
      // Clear current player
      function clearPlayer() {
        if (currentPlayer) {
          if (currentPlayer instanceof shaka.Player) {
            currentPlayer.destroy();
          } else if (currentPlayer instanceof Hls) {
            currentPlayer.destroy();
          }
          currentPlayer = null;
        }
        
        // Reset stream status
        streamStatus = 'stopped';
        
        // Remove all children from player container
        while (playerContainer.firstChild) {
          playerContainer.removeChild(playerContainer.firstChild);
        }
        
        // Re-add spinner container
        const newSpinner = document.createElement('div');
        newSpinner.className = 'custom-shaka-spinner-container';
        newSpinner.id = 'customSpinner';
        newSpinner.style.display = 'none';
        newSpinner.innerHTML = `
          <div class="custom-shaka-spinner"></div>
          <div style="color: white; margin-top: 80px; position: absolute;">Loading stream...</div>
        `;
        playerContainer.appendChild(newSpinner);
      }
      
      // Update info panel
      function updateInfoPanel(category, streamName, streamData, status = 'stopped') {
        let statusText = '';
        let statusClass = '';
        
        switch(status) {
          case 'playing':
            statusText = 'Live';
            statusClass = 'status-live';
            break;
          case 'loaded':
            statusText = 'Loaded';
            statusClass = 'status-loaded';
            break;
          case 'failed':
            statusText = 'Fail';
            statusClass = 'status-fail';
            break;
          default:
            statusText = 'Stopped';
            break;
        }
        
        const infoHTML = `
          <p><strong>Category:</strong> ${category.toUpperCase()}</p>
          <p><strong>Stream:</strong> ${streamName}</p>
          <p><strong>Type:</strong> ${streamData.type}</p>
          <p><strong>Status:</strong> ${statusText} ${statusClass ? `<span class="status-badge ${statusClass}">${statusText}</span>` : ''}</p>
          ${streamData.keyId ? `<p><strong>DRM:</strong> Enabled</p>` : ''}
        `;
        
        streamInfo.innerHTML = infoHTML;
      }
      
      // Initialize the application
      initializeUI();
    });
  </script>

  <!-- Additional JavaScript Libraries and Functions -->
  <script src="https://cdn.jsdelivr.net/npm/disable-devtool@latest/dist/index.min.js"></script>
  <script>
    // Disable DevTools
    DisableDevtool({
      clearLog: true,
      disableCopy: true,
      disableCut: true,
      disablePaste: true,
      disableSelect: true,
      disableDevtoolAuto: true
    });

    // Load JW Player dynamically
    (function(){
      const DEFAULT_JW_URL = 'https://cdn.jwplayer.com/libraries/SAHhwvZq.js';
      window._jwLibUrl = DEFAULT_JW_URL;

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

    // Theme sync to system
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

    // Header spacing adjustment
    (function(){
      const header = document.getElementById('topHeader');
      const mainWrap = document.getElementById('mainWrap');
      
      function setTopPadding(){
        try {
          const h = Math.ceil(header.getBoundingClientRect().height);
          mainWrap.style.paddingTop = '8px';
        } catch(e){}
      }
      
      setTopPadding();
      window.addEventListener('load', setTopPadding);
      window.addEventListener('resize', setTopPadding);
      
      const observer = new MutationObserver(setTopPadding);
      if (header) {
        observer.observe(header, { 
          childList: true, 
          subtree: true, 
          attributes: true 
        });
      }
    })();

    // Modal functionality
    (function(){
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.id = 'skpop';
      modal.innerHTML = `
        <div class="modal-content">
          <button id="closeModal">&times;</button>
          <h2>Join Our Telegram Channel</h2>
          <p>Get access to more live streams and updates!</p>
          <button id="joinChannel" class="telegram-join" style="margin-top: 20px;">Join Now</button>
          <button id="alreadyJoined" style="margin-top: 10px; background: transparent; border: none; color: var(--text-secondary); cursor: pointer;">Already Joined</button>
        </div>
      `;
      document.body.appendChild(modal);

      // Show modal after a delay
      setTimeout(() => {
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
      }, 3000);

      // Modal event handlers
      document.getElementById('closeModal').addEventListener('click', function(){ 
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
      });
      
      document.getElementById('alreadyJoined').addEventListener('click', function(){ 
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
      });
      
      document.getElementById('joinChannel').addEventListener('click', function(){ 
        window.open('https://t.me/cine_arena','_blank'); 
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
      });

      // Initial alert
      try { 
        if(confirm("Join Telegram For More Links! @cine_arena")) 
          window.open("https://t.me/cine_arena", '_blank'); 
      } catch(e){}
    })();
