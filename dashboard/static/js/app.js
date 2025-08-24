// Dashboard Application
class StreamTrackerDashboard {
    constructor() {
      this.currentPage = 'dashboard';
  
      // Runtime-safe config
      this.apiBaseUrl = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) || (window.APP_CONFIG && window.APP_CONFIG.API_BASE) || '/api';
      this.socketUrl  = (window.APP_CONFIG && window.APP_CONFIG.SOCKET_URL) || (location.protocol + '//' + location.host);
  
      this.socket = null;
      this.data = {
        streamers: [],
        channels: [],
        liveStreams: [],
        activity: [],
        stats: {
          totalStreamers: 0,
          liveStreamers: 0,
          notificationsSent: 0,
          activeChannels: 0
        }
      };
  
      this.init();
    }
  
    init() {
      // Demo mode badge (unchanged)
      if (CONFIG.DEMO_MODE) {
        const statusIndicator = document.getElementById('status-indicator');
        const statusText = document.getElementById('status-text');
        if (statusIndicator && statusText) {
          statusIndicator.className = 'status-indicator demo-mode';
          statusText.textContent = 'Demo Mode';
          statusIndicator.style.background = 'linear-gradient(135deg, #ff6b6b, #feca57)';
          statusIndicator.style.color = 'white';
          statusIndicator.style.padding = '8px 12px';
          statusIndicator.style.borderRadius = '20px';
          statusIndicator.style.fontSize = '0.9em';
          statusIndicator.style.fontWeight = '600';
        }
      }
  
      this.setupEventListeners();
      this.setupSocket();
      this.loadInitialData();
      this.startPeriodicUpdates();
    }
  
    setupEventListeners() {
      // Navigation
      document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const page = link.dataset.page;
          this.navigateToPage(page);
        });
      });
  
      // Sidebar toggle
      const sidebarToggle = document.querySelector('.sidebar-toggle');
      if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
          document.querySelector('.sidebar').classList.toggle('open');
        });
      }
  
      // Refresh button
      const refreshBtn = document.querySelector('.refresh-btn');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', () => this.refreshData());
      }
  
      // Modals & forms
      this.setupModalControls();
      this.setupFormHandlers();
    }
  
    setupModalControls() {
      const addStreamerBtn = document.getElementById('add-streamer-btn');
      if (addStreamerBtn) {
        addStreamerBtn.addEventListener('click', () => {
          this.openModal('add-streamer-modal');
          this.loadChannelsForSelect();
        });
      }
  
      const addChannelBtn = document.getElementById('add-channel-btn');
      if (addChannelBtn) {
        addChannelBtn.addEventListener('click', () => this.openModal('add-channel-modal'));
      }
  
      // Close buttons
      document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
        btn.addEventListener('click', () => this.closeAllModals());
      });
  
      // Click backdrop to close
      document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) this.closeAllModals();
        });
      });
    }
  
    setupFormHandlers() {
      const addStreamerForm = document.getElementById('add-streamer-form');
      if (addStreamerForm) {
        addStreamerForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.addStreamer();
        });
      }
  
      const addChannelForm = document.getElementById('add-channel-form');
      if (addChannelForm) {
        addChannelForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.addChannel();
        });
      }
  
      const settingsForm = document.getElementById('settings-form');
      if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.saveSettings();
        });
      }
  
      const logLevel = document.getElementById('log-level');
      if (logLevel) logLevel.addEventListener('change', () => this.filterLogs());
  
      const clearLogsBtn = document.getElementById('clear-logs');
      if (clearLogsBtn) clearLogsBtn.addEventListener('click', () => this.clearLogs());
    }
  
    setupSocket() {
      if (CONFIG.DEMO_MODE) {
        console.log('Demo mode: Skipping WebSocket connection');
        this.updateBotStatus(true);
        this.simulateRealTimeUpdates();
        return;
      }
  
      // Socket.IO connection + status
      try {
        if (typeof io !== 'undefined') {
          this.socket = io(this.socketUrl, { path: '/socket.io' });
  
          this.socket.on('connect', () => {
            console.log('Socket connected');
            this.updateBotStatus(true);
          });
  
          this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
            this.updateBotStatus(false);
          });
  
          // Server-sent updates
          this.socket.on('streamUpdate', (data) => this.handleStreamUpdate(data));
          this.socket.on('statsUpdate', (stats) => this.updateStats(stats));
          this.socket.on('activityUpdate', (activity) => this.addActivity(activity));
        } else {
          console.warn('Socket.IO not available; will rely on polling');
          this.updateBotStatus(false);
        }
      } catch (err) {
        console.warn('Socket.IO connection failed; will rely on polling:', err);
        this.updateBotStatus(false);
      }
  
      // Also probe /api/health to reflect API availability
      this.healthProbe();
    }
  
    async healthProbe() {
      if (CONFIG.DEMO_MODE) return;
      try {
        const ok = await this.tryFetchJson(['/health', '/api/health']);
        this.updateBotStatus(Boolean(ok));
      } catch {
        this.updateBotStatus(false);
      }
    }
  
    // ------------- Unified API adapter with fallbacks -------------
    async apiRequest(endpoint, options = {}) {
      const url = `${this.apiBaseUrl}${endpoint}`;
      const resp = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      return resp.json();
    }
  
    async tryFetchJson(paths) {
      for (const p of paths) {
        try {
          const base = p.startsWith('http') ? '' : this.apiBaseUrl;
          const r = await fetch(`${base}${p}`);
          if (r.ok) return await r.json();
        } catch (_) { /* keep trying */ }
      }
      throw new Error('All paths failed: ' + paths.join(', '));
    }
  
    // ----------------- Initial data & loaders -----------------
    async loadInitialData() {
      if (CONFIG.DEMO_MODE) {
        this.showNotification('Running in demo mode with sample data', 'info');
        this.loadDemoData();
        return;
      }
  
      if (CONFIG.DATA_SOURCE === 'json-files') {
        await this.loadDataFromJsonFiles();
        return;
      }
  
      try {
        await Promise.all([
          this.loadStreamers(),
          this.loadChannels(),
          this.loadLiveStreams(),
          this.loadActivity(),
          this.loadStats(),
          this.loadSettings(),
          this.loadLogs()
        ]);
      } catch (error) {
        console.error('Failed to load initial data:', error);
        this.showNotification('Failed to load dashboard data. Using mock data.', 'error');
        this.loadMockData();
      }
    }
  
    async loadDataFromJsonFiles() {
      try {
        const response = await fetch('./data/current.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        const data = await response.json();
  
        if (data.message) this.showNotification(data.message, 'info');
  
        this.data.streamers = data.streamers || [];
        this.data.channels = this.transformSubscriptionsToChannels(data.subscriptions || []);
        this.data.liveStreams = this.transformStreamersToLiveStreams(data.streamers || []);
        this.data.activity = this.transformEventsToActivity(data.events || []);
        this.data.stats = data.stats || {
          totalStreamers: 0,
          liveStreamers: 0,
          notificationsSent: 0,
          activeChannels: 0
        };
  
        const lastUpdated = new Date(data.timestamp);
        const timeDiff = Math.floor((Date.now() - lastUpdated.getTime()) / 60000);
        this.showNotification(`Data updated ${timeDiff} minutes ago`, 'success');
  
        this.setupPeriodicJsonRefresh();
        this.renderAllData();
      } catch (error) {
        console.error('Failed to load JSON data:', error);
        this.showNotification('Failed to load real data. Using demo data.', 'error');
        this.loadDemoData();
      }
    }
  
    transformSubscriptionsToChannels(subs) {
      return subs.map(sub => ({
        id: sub.id || sub.channelId,
        channelId: sub.channelId,
        name: sub.channelName || `Channel ${String(sub.channelId).slice(-4)}`,
        guildName: sub.guildName || (sub.guildId ? `Guild ${String(sub.guildId).slice(-4)}` : 'Guild'),
        streamerId: sub.streamerId,
        isActive: sub.isActive
      }));
    }
  
    transformStreamersToLiveStreams(streamers) {
      return streamers.filter(s => s.isLive).map(s => ({
        id: s.id,
        streamer: s.displayName || s.username,
        platform: s.platform,
        title: s.streamTitle || 'No title',
        game: s.game || 'Unknown Game',
        viewers: s.viewerCount || 0,
        thumbnail: s.avatarUrl,
        url: s.lastStreamUrl || `https://${s.platform}.tv/${s.username}`
      }));
    }
  
    transformEventsToActivity(events) {
      return events.slice(0, 10).map(e => ({
        id: e.id,
        type: e.eventType === 'live' ? 'stream_started' : e.eventType === 'offline' ? 'stream_ended' : (e.type || 'system'),
        message: e.message || `Streamer ${e.eventType === 'live' ? 'went live' : 'ended stream'}: ${e.streamTitle || 'No title'}`,
        timestamp: e.timestamp
      }));
    }
  
    setupPeriodicJsonRefresh() {
      setInterval(async () => {
        console.log('Refreshing data from JSON files...');
        await this.loadDataFromJsonFiles();
      }, 5 * 60 * 1000);
    }
  
    loadMockData() {
      this.data.streamers = [
        { id: '1', platform: 'twitch', username: 'ninja', displayName: 'Ninja', isLive: true, lastSeen: new Date().toISOString(), channelId: '1' },
        { id: '2', platform: 'youtube', username: 'mrbeast', displayName: 'MrBeast', isLive: false, lastSeen: new Date(Date.now() - 3600000).toISOString(), channelId: '1' }
      ];
  
      this.data.channels = [{ id: '1', channelId: '123456789', name: 'stream-notifications', guildName: 'Gaming Server' }];
  
      this.data.liveStreams = [
        { id: '1', streamer: 'Ninja', platform: 'twitch', title: 'Fortnite Battle Royale', game: 'Fortnite', viewers: 25000, thumbnail: '', url: 'https://twitch.tv/ninja' }
      ];
  
      this.data.activity = [
        { id: '1', type: 'stream_started', message: 'Ninja went live on Twitch', timestamp: new Date().toISOString() },
        { id: '2', type: 'stream_ended', message: 'MrBeast ended their YouTube stream', timestamp: new Date(Date.now() - 1800000).toISOString() }
      ];
  
      this.data.stats = { totalStreamers: 2, liveStreamers: 1, notificationsSent: 15, activeChannels: 1 };
  
      this.renderAllData();
    }
  
    loadDemoData() {
      this.data.streamers = DEMO_DATA.streamers;
      this.data.channels = DEMO_DATA.subscriptions.map(sub => ({
        id: sub.channelId,
        channelId: sub.channelId,
        name: sub.channelName,
        guildName: sub.guildName
      }));
      this.data.liveStreams = DEMO_DATA.streamers.filter(s => s.isLive).map(s => ({
        id: s.id,
        streamer: s.displayName,
        platform: s.platform,
        title: s.streamTitle,
        game: 'Demo Game',
        viewers: s.viewerCount,
        thumbnail: s.avatarUrl,
        url: s.streamUrl || `https://${s.platform}.tv/${s.username}`
      }));
      this.data.activity = DEMO_DATA.events.map(e => ({
        id: e.id,
        type: e.eventType === 'live' ? 'stream_started' : 'stream_ended',
        message: `${e.streamerName} ${e.eventType === 'live' ? 'went live' : 'ended their stream'} on ${e.platform.charAt(0).toUpperCase() + e.platform.slice(1)}`,
        timestamp: e.timestamp
      }));
      this.data.stats = {
        totalStreamers: DEMO_DATA.stats.totalStreamers,
        liveStreamers: DEMO_DATA.stats.liveStreamers,
        notificationsSent: DEMO_DATA.stats.notificationsSent,
        activeChannels: DEMO_DATA.stats.activeGuilds
      };
  
      this.updateBotStatus(true);
      this.renderAllData();
    }
  
    // ---------- Loaders with route fallbacks ----------
    async loadStreamers() {
      try {
        const res = await this.apiRequest('/streamers');
        this.data.streamers = res.data || res || [];
      } catch (err) {
        console.error('Failed to load /streamers:', err);
      }
    }
  
    async loadChannels() {
      try {
        // Prefer /subscriptions (your API mount), else /channels
        let res;
        try { res = await this.apiRequest('/subscriptions'); }
        catch { res = await this.apiRequest('/channels'); }
  
        const raw = res.data || res || [];
        // normalize to channels
        this.data.channels = Array.isArray(raw)
          ? this.transformSubscriptionsToChannels(raw)
          : this.transformSubscriptionsToChannels(raw.data || []);
      } catch (err) {
        console.error('Failed to load channels/subscriptions:', err);
      }
    }
  
    async loadLiveStreams() {
      try {
        // Try dedicated live endpoint first
        let res = null;
        try { res = await this.apiRequest('/streams/live'); }
        catch {
          // Fallback: use streamers and filter live
          await this.loadStreamers();
          this.data.liveStreams = this.transformStreamersToLiveStreams(this.data.streamers);
          return;
        }
        this.data.liveStreams = res.data || res || [];
      } catch (err) {
        console.error('Failed to load live streams:', err);
      }
    }
  
    async loadActivity() {
      try {
        let res = null;
        try { res = await this.apiRequest('/activity'); }
        catch { res = await this.apiRequest('/events'); }
  
        const events = res.data || res || [];
        this.data.activity = Array.isArray(events) ? this.transformEventsToActivity(events) : this.transformEventsToActivity(events.data || []);
      } catch (err) {
        console.error('Failed to load activity:', err);
      }
    }
  
    async loadStats() {
      try {
        let res = null;
        try { res = await this.apiRequest('/stats'); }
        catch {
          // compute simple stats if /stats not available
          const totalStreamers = this.data.streamers.length;
          const liveStreamers = this.data.streamers.filter(s => s.isLive).length;
          const activeChannels = this.data.channels.length;
          this.data.stats = { totalStreamers, liveStreamers, notificationsSent: this.data.stats.notificationsSent || 0, activeChannels };
          return;
        }
        this.data.stats = res.data || res || this.data.stats;
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
    }
  
    async loadSettings() {
      try {
        let res = null;
        try { res = await this.apiRequest('/dashboard/settings'); }
        catch { res = await this.apiRequest('/settings'); }
  
        const settings = res.data || res || {};
        document.getElementById('check-interval').value = settings.checkInterval ?? 5;
        document.getElementById('notification-template').value = settings.notificationTemplate ?? '';
        document.getElementById('mention-everyone').checked = Boolean(settings.mentionEveryone);
        document.getElementById('delete-offline').checked = Boolean(settings.deleteOffline);
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    }
  
    async loadLogs() {
      try {
        let res = null;
        try { res = await this.apiRequest('/dashboard/logs'); }
        catch { res = await this.apiRequest('/logs'); }
  
        this.renderLogs(res.data || res || []);
      } catch (err) {
        console.error('Failed to load logs:', err);
      }
    }
  
    // ---------------- Renderers ----------------
    navigateToPage(page) {
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      const active = document.querySelector(`[data-page="${page}"]`);
      if (active) active.classList.add('active');
  
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      const el = document.getElementById(page);
      if (el) el.classList.add('active');
  
      const pageTitle = document.querySelector('.page-title');
      if (pageTitle) pageTitle.textContent = page.charAt(0).toUpperCase() + page.slice(1);
  
      this.currentPage = page;
      this.renderCurrentPageData();
    }
  
    renderCurrentPageData() {
      switch (this.currentPage) {
        case 'dashboard': this.renderDashboard(); break;
        case 'streamers': this.renderStreamers(); break;
        case 'channels':  this.renderChannels(); break;
        case 'logs':      this.loadLogs(); break;
      }
    }
  
    renderAllData() {
      this.renderDashboard();
      this.renderStreamers();
      this.renderChannels();
    }
  
    renderDashboard() {
      this.updateStats(this.data.stats);
      this.renderLiveStreams();
      this.renderActivity();
    }
  
    updateStats(stats) {
      document.getElementById('total-streamers').textContent     = stats.totalStreamers || 0;
      document.getElementById('live-streamers').textContent      = stats.liveStreamers || 0;
      document.getElementById('notifications-sent').textContent  = stats.notificationsSent || 0;
      document.getElementById('active-channels').textContent     = stats.activeChannels || 0;
    }
  
    renderLiveStreams() {
      const container = document.getElementById('live-streams-list');
      if (!container) return;
  
      if (this.data.liveStreams.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-video-slash"></i>
            <h3>No Live Streams</h3>
            <p>No streamers are currently live</p>
          </div>
        `;
        return;
      }
  
      container.innerHTML = this.data.liveStreams.map(stream => `
        <div class="stream-item">
          <div class="stream-header">
            <div class="platform-icon ${stream.platform}">${this.getPlatformIcon(stream.platform)}</div>
            <strong>${stream.streamer}</strong>
            <span class="live-indicator">🔴 LIVE</span>
          </div>
          <div class="stream-info">
            <div class="stream-title">${stream.title}</div>
            <div class="stream-meta">
              <span class="game">${stream.game}</span>
              <span class="viewers">${this.formatNumber(stream.viewers)} viewers</span>
            </div>
          </div>
          <div class="stream-actions">
            <a href="${stream.url}" target="_blank" class="btn btn-primary btn-sm">Watch</a>
          </div>
        </div>
      `).join('');
    }
  
    renderActivity() {
      const container = document.getElementById('activity-list');
      if (!container) return;
  
      if (this.data.activity.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-clock"></i>
            <h3>No Recent Activity</h3>
            <p>Activity will appear here</p>
          </div>
        `;
        return;
      }
  
      container.innerHTML = this.data.activity.slice(0, 10).map(activity => `
        <div class="activity-item">
          <div class="activity-icon"><i class="fas ${this.getActivityIcon(activity.type)}"></i></div>
          <div class="activity-content">
            <div class="activity-message">${activity.message}</div>
            <div class="activity-time">${this.formatTime(activity.timestamp)}</div>
          </div>
        </div>
      `).join('');
    }
  
    renderStreamers() {
      const container = document.getElementById('streamers-grid');
      if (!container) return;
  
      if (this.data.streamers.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-user-plus"></i>
            <h3>No Streamers Added</h3>
            <p>Add streamers to start tracking their streams</p>
          </div>
        `;
        return;
      }
  
      container.innerHTML = this.data.streamers.map(streamer => `
        <div class="streamer-card">
          <div class="streamer-header">
            <div class="platform-icon ${streamer.platform}">${this.getPlatformIcon(streamer.platform)}</div>
            <div class="streamer-info">
              <h3>${streamer.displayName || streamer.username}</h3>
              <p>@${streamer.username}</p>
            </div>
            <div class="status-indicator">
              <span class="status-dot ${streamer.isLive ? 'online' : ''}"></span>
            </div>
          </div>
          <div class="streamer-meta">
            <div class="last-seen">Last seen: ${this.formatTime(streamer.lastSeen)}</div>
          </div>
          <div class="streamer-actions">
            <button class="btn btn-secondary btn-sm" onclick="window.dashboard.editStreamer('${streamer.id}')">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-danger btn-sm" onclick="window.dashboard.removeStreamer('${streamer.id}')">
              <i class="fas fa-trash"></i> Remove
            </button>
          </div>
        </div>
      `).join('');
    }
  
    renderChannels() {
      const container = document.getElementById('channels-list');
      if (!container) return;
  
      if (this.data.channels.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-hashtag"></i>
            <h3>No Channels Added</h3>
            <p>Add Discord channels to receive stream notifications</p>
          </div>
        `;
        return;
      }
  
      container.innerHTML = this.data.channels.map(channel => `
        <div class="channel-item">
          <div class="channel-info">
            <h3>#${channel.name ?? ('channel-' + String(channel.channelId).slice(-4))}</h3>
            <p>${channel.guildName ?? 'Guild'}</p>
            <code>${channel.channelId}</code>
          </div>
          <div class="channel-actions">
            <button class="btn btn-secondary btn-sm" onclick="window.dashboard.editChannel('${channel.id}')">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-danger btn-sm" onclick="window.dashboard.removeChannel('${channel.id}')">
              <i class="fas fa-trash"></i> Remove
            </button>
          </div>
        </div>
      `).join('');
    }
  
    renderLogs(logs) {
      const container = document.getElementById('logs-content');
      if (!container) return;
  
      if (!logs || logs.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-file-alt"></i>
            <h3>No Logs</h3>
            <p>Logs will appear here</p>
          </div>
        `;
        return;
      }
  
      container.innerHTML = logs.map(log => `
        <div class="log-entry" data-level="${log.level}">
          <span class="log-timestamp">[${this.formatTime(log.timestamp)}]</span>
          <span class="log-level ${log.level}">${log.level}</span>
          <span class="log-message">${log.message}</span>
        </div>
      `).join('');
  
      container.scrollTop = container.scrollHeight;
    }
  
    // ----------------- Mutations (add/remove/save) -----------------
    async addStreamer() {
      const platform    = document.getElementById('platform-select').value;
      const username    = document.getElementById('username-input').value;
      const displayName = document.getElementById('display-name-input').value;
      const channelId   = document.getElementById('channel-select').value;
  
      try {
        await this.apiRequest('/streamers', {
          method: 'POST',
          body: JSON.stringify({ platform, username, displayName, channelId })
        });
  
        this.showNotification('Streamer added successfully!', 'success');
        this.closeAllModals();
        await this.loadStreamers();
        this.renderStreamers();
      } catch {
        this.showNotification('Failed to add streamer', 'error');
      }
    }
  
    async addChannel() {
      const channelId = document.getElementById('channel-id-input').value;
      const name      = document.getElementById('channel-name-input').value;
  
      try {
        // Prefer subscriptions API
        try {
          await this.apiRequest('/subscriptions', { method: 'POST', body: JSON.stringify({ channelId, channelName: name }) });
        } catch {
          await this.apiRequest('/channels', { method: 'POST', body: JSON.stringify({ channelId, name }) });
        }
  
        this.showNotification('Channel added successfully!', 'success');
        this.closeAllModals();
        await this.loadChannels();
        this.renderChannels();
      } catch {
        this.showNotification('Failed to add channel', 'error');
      }
    }
  
    async saveSettings() {
      const settings = {
        checkInterval: parseInt(document.getElementById('check-interval').value, 10),
        notificationTemplate: document.getElementById('notification-template').value,
        mentionEveryone: document.getElementById('mention-everyone').checked,
        deleteOffline: document.getElementById('delete-offline').checked
      };
  
      try {
        try {
          await this.apiRequest('/dashboard/settings', { method: 'PUT', body: JSON.stringify(settings) });
        } catch {
          await this.apiRequest('/settings', { method: 'PUT', body: JSON.stringify(settings) });
        }
        this.showNotification('Settings saved successfully!', 'success');
      } catch {
        this.showNotification('Failed to save settings', 'error');
      }
    }
  
    async removeStreamer(id) {
      if (!confirm('Are you sure you want to remove this streamer?')) return;
      try {
        await this.apiRequest(`/streamers/${id}`, { method: 'DELETE' });
        this.showNotification('Streamer removed successfully!', 'success');
        await this.loadStreamers();
        this.renderStreamers();
      } catch {
        this.showNotification('Failed to remove streamer', 'error');
      }
    }
  
    async removeChannel(id) {
      if (!confirm('Are you sure you want to remove this channel?')) return;
      try {
        try {
          await this.apiRequest(`/subscriptions/${id}`, { method: 'DELETE' });
        } catch {
          await this.apiRequest(`/channels/${id}`, { method: 'DELETE' });
        }
        this.showNotification('Channel removed successfully!', 'success');
        await this.loadChannels();
        this.renderChannels();
      } catch {
        this.showNotification('Failed to remove channel', 'error');
      }
    }
  
    loadChannelsForSelect() {
      const select = document.getElementById('channel-select');
      if (!select) return;
      select.innerHTML = '<option value="">Select Channel</option>';
      this.data.channels.forEach(channel => {
        const option = document.createElement('option');
        option.value = channel.id;
        option.textContent = `#${channel.name} (${channel.guildName})`;
        select.appendChild(option);
      });
    }
  
    openModal(id) {
      const el = document.getElementById(id);
      if (el) el.classList.add('active');
    }
  
    closeAllModals() {
      document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
      document.querySelectorAll('form').forEach(f => f.reset());
    }
  
    updateBotStatus(online) {
      const statusDot = document.querySelector('.status-dot');
      const statusText = statusDot ? statusDot.nextElementSibling : null;
      if (!statusDot || !statusText) return;
      if (online) {
        statusDot.classList.add('online');
        statusText.textContent = 'Bot Online';
      } else {
        statusDot.classList.remove('online');
        statusText.textContent = 'Bot Offline';
      }
    }
  
    handleStreamUpdate(data) {
      if (data.type === 'live') {
        this.addActivity({ type: 'stream_started', message: `${data.streamer} went live on ${data.platform}`, timestamp: new Date().toISOString() });
      } else if (data.type === 'offline') {
        this.addActivity({ type: 'stream_ended', message: `${data.streamer} ended their ${data.platform} stream`, timestamp: new Date().toISOString() });
      }
      this.loadLiveStreams().then(() => this.renderLiveStreams());
    }
  
    addActivity(activity) {
      this.data.activity.unshift(activity);
      if (this.data.activity.length > 50) this.data.activity = this.data.activity.slice(0, 50);
      if (this.currentPage === 'dashboard') this.renderActivity();
    }
  
    async refreshData() {
      const refreshBtn = document.querySelector('.refresh-btn');
      if (refreshBtn) refreshBtn.innerHTML = '<div class="loading"></div>';
      try {
        await this.loadInitialData();
        this.renderAllData();
        this.showNotification('Data refreshed successfully!', 'success');
      } catch {
        this.showNotification('Failed to refresh data', 'error');
      } finally {
        if (refreshBtn) refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
      }
    }
  
    startPeriodicUpdates() {
      setInterval(() => {
        if (this.socket && this.socket.connected) return;
        this.loadLiveStreams();
        this.loadStats();
        if (this.currentPage === 'dashboard') {
          this.renderLiveStreams();
          this.updateStats(this.data.stats);
        }
        // periodic health check too
        this.healthProbe();
      }, 30000);
    }
  
    simulateRealTimeUpdates() {
      setInterval(() => {
        if (!CONFIG.DEMO_MODE) return;
        this.data.liveStreams.forEach(s => {
          const delta = Math.floor(Math.random() * 200) - 100;
          s.viewers = Math.max(0, (s.viewers || 0) + delta);
        });
        this.data.streamers.forEach(st => {
          if (st.isLive) {
            const delta = Math.floor(Math.random() * 200) - 100;
            st.viewerCount = Math.max(0, (st.viewerCount || 0) + delta);
          }
        });
        if (Math.random() < 0.1) {
          const msgs = ['Bot restarted successfully', 'Configuration updated', 'New viewer milestone reached', 'Stream quality check completed'];
          this.data.activity.unshift({ id: Date.now().toString(), type: 'system', message: msgs[Math.floor(Math.random()*msgs.length)], timestamp: new Date().toISOString() });
          if (this.data.activity.length > 10) this.data.activity = this.data.activity.slice(0, 10);
        }
        this.renderLiveStreams();
        this.renderActivity();
      }, 5000);
    }
  
    // Utils
    getPlatformIcon(platform) {
      const icons = { twitch: 'T', youtube: 'Y', tiktok: 'TT', kick: 'K' };
      return icons[platform] || '?';
    }
  
    getActivityIcon(type) {
      const icons = {
        stream_started: 'fa-play-circle',
        stream_ended: 'fa-stop-circle',
        streamer_added: 'fa-user-plus',
        streamer_removed: 'fa-user-minus',
        channel_added: 'fa-hashtag',
        channel_removed: 'fa-hashtag'
      };
      return icons[type] || 'fa-info-circle';
    }
  
    formatNumber(num) {
      if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
      if (num >= 1_000)    return (num / 1_000).toFixed(1) + 'K';
      return (num ?? 0).toString();
    }
  
    formatTime(ts) {
      const date = new Date(ts);
      const now = new Date();
      const diff = now - date;
      if (diff < 60000) return 'Just now';
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
      return date.toLocaleDateString();
    }
  }
  
  // Initialize dashboard when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    const instance = new StreamTrackerDashboard();
    // Make globally available for onclick handlers
    window.dashboard = instance;
  });
  