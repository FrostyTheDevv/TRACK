// Dashboard Application
class StreamTrackerDashboard {
    constructor() {
        this.currentPage = 'dashboard';
        this.apiBaseUrl = CONFIG.API_BASE_URL;
        this.socketUrl = CONFIG.SOCKET_URL;
        this.socket = null;
        
        // Debug logging
        console.log('Dashboard initialized with:', {
            apiBaseUrl: this.apiBaseUrl,
            socketUrl: this.socketUrl,
            dataSource: CONFIG.DATA_SOURCE,
            demoMode: CONFIG.DEMO_MODE
        });
        
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
        // Set demo mode indicator if in demo mode
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
                
                // Close sidebar on mobile after navigation
                if (window.innerWidth <= 768) {
                    this.closeSidebar();
                }
            });
        });

        // Sidebar toggle for mobile
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        const sidebarClose = document.querySelector('.sidebar-close');
        const sidebar = document.querySelector('.sidebar');
        const sidebarBackdrop = document.getElementById('sidebar-backdrop');
        
        if (sidebarToggle && sidebar && sidebarBackdrop) {
            // Toggle sidebar when button is clicked
            sidebarToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
            
            // Close sidebar when close button is clicked
            if (sidebarClose) {
                sidebarClose.addEventListener('click', () => {
                    this.closeSidebar();
                });
            }
            
            // Close sidebar when backdrop is clicked
            sidebarBackdrop.addEventListener('click', () => {
                this.closeSidebar();
            });
            
            // Close sidebar with ESC key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && sidebar.classList.contains('open')) {
                    this.closeSidebar();
                }
            });
        }

        // Refresh button
        document.querySelector('.refresh-btn').addEventListener('click', () => {
            this.refreshData();
        });

        // Modal controls
        this.setupModalControls();

        // Form submissions
        this.setupFormHandlers();
    }

    setupModalControls() {
        // Add streamer modal
        document.getElementById('add-streamer-btn').addEventListener('click', () => {
            this.openModal('add-streamer-modal');
            this.loadChannelsForSelect();
        });

        // Add channel modal
        document.getElementById('add-channel-btn').addEventListener('click', () => {
            this.openModal('add-channel-modal');
        });

        // Close modals
        document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeAllModals();
            });
        });

        // Close modal on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeAllModals();
                }
            });
        });
    }

    setupFormHandlers() {
        // Add streamer form
        document.getElementById('add-streamer-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addStreamer();
        });

        // Add channel form
        document.getElementById('add-channel-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addChannel();
        });

        // Settings form
        document.getElementById('settings-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSettings();
        });

        // Log controls
        document.getElementById('log-level').addEventListener('change', () => {
            this.filterLogs();
        });

        document.getElementById('clear-logs').addEventListener('click', () => {
            this.clearLogs();
        });
    }

    setupSocket() {
        // Skip socket setup in demo mode
        if (CONFIG.DEMO_MODE) {
            console.log('Demo mode: Skipping WebSocket connection');
            this.updateBotStatus(true); // Show as connected for demo
            this.simulateRealTimeUpdates(); // Add some demo real-time updates
            return;
        }

        // Initialize Socket.IO connection for real-time updates
        try {
            // Check if Socket.IO is available
            if (typeof io !== 'undefined') {
                this.socket = io(this.socketUrl);
                
                this.socket.on('connect', () => {
                    console.log('Connected to server');
                    this.updateBotStatus(true);
                });

                this.socket.on('disconnect', () => {
                    console.log('Disconnected from server');
                    this.updateBotStatus(false);
                });

                this.socket.on('streamUpdate', (data) => {
                    this.handleStreamUpdate(data);
                });

                this.socket.on('statsUpdate', (stats) => {
                    this.updateStats(stats);
                });

                this.socket.on('activityUpdate', (activity) => {
                    this.addActivity(activity);
                });
            } else {
                console.warn('Socket.IO not available, falling back to polling');
                this.updateBotStatus(false);
            }
        } catch (error) {
            console.warn('Socket.IO connection failed, falling back to polling:', error);
            this.updateBotStatus(false);
        }
    }

    async loadInitialData() {
        // Check if we're in demo mode
        if (CONFIG.DEMO_MODE) {
            console.log('Running in demo mode - using mock data');
            this.showNotification('Running in demo mode with sample data', 'info');
            this.loadDemoData();
            return;
        }

        // Check if we should load from JSON files (GitHub Pages mode)
        if (CONFIG.DATA_SOURCE === 'json-files') {
            console.log('Loading real data from JSON files');
            await this.loadDataFromJsonFiles();
            return;
        }

        // Try to load from API (local development)
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
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.message) {
                this.showNotification(data.message, 'info');
            }
            
            // Transform data to match dashboard format
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

            // Update last updated time
            const lastUpdated = new Date(data.timestamp);
            const timeDiff = Math.floor((Date.now() - lastUpdated.getTime()) / 1000 / 60); // minutes
            this.showNotification(`Data updated ${timeDiff} minutes ago`, 'success');

            // Set up periodic refresh
            this.setupPeriodicJsonRefresh();
            
            this.renderAllData();
            
        } catch (error) {
            console.error('Failed to load JSON data:', error);
            this.showNotification('Failed to load real data. Using demo data.', 'error');
            this.loadDemoData();
        }
    }

    transformSubscriptionsToChannels(subscriptions) {
        return subscriptions.map(sub => ({
            id: sub.channelId,
            channelId: sub.channelId,
            name: `Channel ${sub.channelId.slice(-4)}`, // Show last 4 digits
            guildName: `Guild ${sub.guildId.slice(-4)}`,
            streamerId: sub.streamerId,
            isActive: sub.isActive
        }));
    }

    transformStreamersToLiveStreams(streamers) {
        return streamers
            .filter(s => s.isLive)
            .map(s => ({
                id: s.id,
                streamer: s.displayName,
                platform: s.platform,
                title: s.streamTitle || 'No title',
                game: 'Unknown Game',
                viewers: s.viewerCount || 0,
                thumbnail: s.avatarUrl,
                url: s.lastStreamUrl || `https://${s.platform}.tv/${s.username}`
            }));
    }

    transformEventsToActivity(events) {
        return events
            .slice(0, 10) // Show only recent 10 events
            .map(e => ({
                id: e.id,
                type: e.eventType === 'live' ? 'stream_started' : 'stream_ended',
                message: `Streamer ${e.eventType === 'live' ? 'went live' : 'ended stream'}: ${e.streamTitle || 'No title'}`,
                timestamp: e.timestamp
            }));
    }

    setupPeriodicJsonRefresh() {
        // Refresh data every 5 minutes to match GitHub Actions schedule
        setInterval(async () => {
            console.log('Refreshing data from JSON files...');
            await this.loadDataFromJsonFiles();
        }, 5 * 60 * 1000); // 5 minutes
    }

    loadMockData() {
        // Load mock data for demo purposes
        this.data.streamers = [
            {
                id: '1',
                platform: 'twitch',
                username: 'ninja',
                displayName: 'Ninja',
                isLive: true,
                lastSeen: new Date().toISOString(),
                channelId: '1'
            },
            {
                id: '2',
                platform: 'youtube',
                username: 'mrbeast',
                displayName: 'MrBeast',
                isLive: false,
                lastSeen: new Date(Date.now() - 3600000).toISOString(),
                channelId: '1'
            }
        ];

        this.data.channels = [
            {
                id: '1',
                channelId: '123456789',
                name: 'stream-notifications',
                guildName: 'Gaming Server'
            }
        ];

        this.data.liveStreams = [
            {
                id: '1',
                streamer: 'Ninja',
                platform: 'twitch',
                title: 'Fortnite Battle Royale',
                game: 'Fortnite',
                viewers: 25000,
                thumbnail: '',
                url: 'https://twitch.tv/ninja'
            }
        ];

        this.data.activity = [
            {
                id: '1',
                type: 'stream_started',
                message: 'Ninja went live on Twitch',
                timestamp: new Date().toISOString()
            },
            {
                id: '2',
                type: 'stream_ended',
                message: 'MrBeast ended their YouTube stream',
                timestamp: new Date(Date.now() - 1800000).toISOString()
            }
        ];

        this.data.stats = {
            totalStreamers: 2,
            liveStreamers: 1,
            notificationsSent: 15,
            activeChannels: 1
        };

        this.renderAllData();
    }

    loadDemoData() {
        // Load comprehensive demo data from demo-data.js
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

        // Set bot status to online for demo
        this.updateBotStatus(true);
        
        this.renderAllData();
    }

    async apiRequest(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API request failed: ${endpoint}`, error);
            throw error;
        }
    }

    async loadStreamers() {
        try {
            const response = await this.apiRequest('/streamers');
            this.data.streamers = response.data || [];
        } catch (error) {
            console.error('Failed to load streamers:', error);
        }
    }

    async loadChannels() {
        try {
            const response = await this.apiRequest('/channels');
            this.data.channels = response.data || [];
        } catch (error) {
            console.error('Failed to load channels:', error);
        }
    }

    async loadLiveStreams() {
        try {
            const response = await this.apiRequest('/streams/live');
            this.data.liveStreams = response.data || [];
        } catch (error) {
            console.error('Failed to load live streams:', error);
        }
    }

    async loadActivity() {
        try {
            const response = await this.apiRequest('/activity');
            this.data.activity = response.data || [];
        } catch (error) {
            console.error('Failed to load activity:', error);
        }
    }

    async loadStats() {
        try {
            const response = await this.apiRequest('/stats');
            this.data.stats = response.data || this.data.stats;
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    }

    async loadSettings() {
        try {
            const response = await this.apiRequest('/settings');
            const settings = response.data || {};
            
            document.getElementById('check-interval').value = settings.checkInterval || 5;
            document.getElementById('notification-template').value = settings.notificationTemplate || '';
            document.getElementById('mention-everyone').checked = settings.mentionEveryone || false;
            document.getElementById('delete-offline').checked = settings.deleteOffline || false;
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    async loadLogs() {
        try {
            const response = await this.apiRequest('/logs');
            this.renderLogs(response.data || []);
        } catch (error) {
            console.error('Failed to load logs:', error);
        }
    }

    navigateToPage(page) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`).classList.add('active');

        // Update page content
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });
        document.getElementById(page).classList.add('active');

        // Update page title
        const pageTitle = document.querySelector('.page-title');
        pageTitle.textContent = page.charAt(0).toUpperCase() + page.slice(1);

        this.currentPage = page;

        // Load page-specific data
        this.renderCurrentPageData();
    }

    renderCurrentPageData() {
        switch (this.currentPage) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'streamers':
                this.renderStreamers();
                break;
            case 'channels':
                this.renderChannels();
                break;
            case 'logs':
                this.loadLogs();
                break;
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
        document.getElementById('total-streamers').textContent = stats.totalStreamers || 0;
        document.getElementById('live-streamers').textContent = stats.liveStreamers || 0;
        document.getElementById('notifications-sent').textContent = stats.notificationsSent || 0;
        document.getElementById('active-channels').textContent = stats.activeChannels || 0;
    }

    renderLiveStreams() {
        const container = document.getElementById('live-streams-list');
        
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
                    <div class="platform-icon ${stream.platform}">
                        ${this.getPlatformIcon(stream.platform)}
                    </div>
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
                <div class="activity-icon">
                    <i class="fas ${this.getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-message">${activity.message}</div>
                    <div class="activity-time">${this.formatTime(activity.timestamp)}</div>
                </div>
            </div>
        `).join('');
    }

    renderStreamers() {
        const container = document.getElementById('streamers-grid');
        
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
                    <div class="platform-icon ${streamer.platform}">
                        ${this.getPlatformIcon(streamer.platform)}
                    </div>
                    <div class="streamer-info">
                        <h3>${streamer.displayName || streamer.username}</h3>
                        <p>@${streamer.username}</p>
                    </div>
                    <div class="status-indicator">
                        <span class="status-dot ${streamer.isLive ? 'online' : ''}"></span>
                    </div>
                </div>
                <div class="streamer-meta">
                    <div class="last-seen">
                        Last seen: ${this.formatTime(streamer.lastSeen)}
                    </div>
                </div>
                <div class="streamer-actions">
                    <button class="btn btn-secondary btn-sm" onclick="dashboard.editStreamer('${streamer.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="dashboard.removeStreamer('${streamer.id}')">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderChannels() {
        const container = document.getElementById('channels-list');
        
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
                    <h3>#${channel.name}</h3>
                    <p>${channel.guildName}</p>
                    <code>${channel.channelId}</code>
                </div>
                <div class="channel-actions">
                    <button class="btn btn-secondary btn-sm" onclick="dashboard.editChannel('${channel.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="dashboard.removeChannel('${channel.id}')">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderLogs(logs) {
        const container = document.getElementById('logs-content');
        
        if (logs.length === 0) {
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

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    async addStreamer() {
        const platform = document.getElementById('platform-select').value;
        const username = document.getElementById('username-input').value;
        const displayName = document.getElementById('display-name-input').value;
        const channelId = document.getElementById('channel-select').value;

        try {
            await this.apiRequest('/streamers', {
                method: 'POST',
                body: JSON.stringify({
                    platform,
                    username,
                    displayName,
                    channelId
                })
            });

            this.showNotification('Streamer added successfully!', 'success');
            this.closeAllModals();
            this.loadStreamers();
            this.renderStreamers();
        } catch (error) {
            this.showNotification('Failed to add streamer', 'error');
        }
    }

    async addChannel() {
        const channelId = document.getElementById('channel-id-input').value;
        const name = document.getElementById('channel-name-input').value;

        try {
            await this.apiRequest('/channels', {
                method: 'POST',
                body: JSON.stringify({
                    channelId,
                    name
                })
            });

            this.showNotification('Channel added successfully!', 'success');
            this.closeAllModals();
            this.loadChannels();
            this.renderChannels();
        } catch (error) {
            this.showNotification('Failed to add channel', 'error');
        }
    }

    async saveSettings() {
        const settings = {
            checkInterval: parseInt(document.getElementById('check-interval').value),
            notificationTemplate: document.getElementById('notification-template').value,
            mentionEveryone: document.getElementById('mention-everyone').checked,
            deleteOffline: document.getElementById('delete-offline').checked
        };

        try {
            await this.apiRequest('/settings', {
                method: 'PUT',
                body: JSON.stringify(settings)
            });

            this.showNotification('Settings saved successfully!', 'success');
        } catch (error) {
            this.showNotification('Failed to save settings', 'error');
        }
    }

    async removeStreamer(id) {
        if (!confirm('Are you sure you want to remove this streamer?')) return;

        try {
            await this.apiRequest(`/streamers/${id}`, {
                method: 'DELETE'
            });

            this.showNotification('Streamer removed successfully!', 'success');
            this.loadStreamers();
            this.renderStreamers();
        } catch (error) {
            this.showNotification('Failed to remove streamer', 'error');
        }
    }

    async removeChannel(id) {
        if (!confirm('Are you sure you want to remove this channel?')) return;

        try {
            await this.apiRequest(`/channels/${id}`, {
                method: 'DELETE'
            });

            this.showNotification('Channel removed successfully!', 'success');
            this.loadChannels();
            this.renderChannels();
        } catch (error) {
            this.showNotification('Failed to remove channel', 'error');
        }
    }

    loadChannelsForSelect() {
        const select = document.getElementById('channel-select');
        select.innerHTML = '<option value="">Select Channel</option>';
        
        this.data.channels.forEach(channel => {
            const option = document.createElement('option');
            option.value = channel.id;
            option.textContent = `#${channel.name} (${channel.guildName})`;
            select.appendChild(option);
        });
    }

    openModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        
        // Reset forms
        document.querySelectorAll('form').forEach(form => {
            form.reset();
        });
    }

    updateBotStatus(online) {
        const statusDot = document.querySelector('.status-dot');
        const statusText = statusDot.nextElementSibling;
        
        if (online) {
            statusDot.classList.add('online');
            statusText.textContent = 'Bot Online';
        } else {
            statusDot.classList.remove('online');
            statusText.textContent = 'Bot Offline';
        }
    }

    handleStreamUpdate(data) {
        // Handle real-time stream updates
        if (data.type === 'live') {
            this.addActivity({
                type: 'stream_started',
                message: `${data.streamer} went live on ${data.platform}`,
                timestamp: new Date().toISOString()
            });
        } else if (data.type === 'offline') {
            this.addActivity({
                type: 'stream_ended',
                message: `${data.streamer} ended their ${data.platform} stream`,
                timestamp: new Date().toISOString()
            });
        }

        this.loadLiveStreams();
        this.renderLiveStreams();
    }

    addActivity(activity) {
        this.data.activity.unshift(activity);
        if (this.data.activity.length > 50) {
            this.data.activity = this.data.activity.slice(0, 50);
        }
        
        if (this.currentPage === 'dashboard') {
            this.renderActivity();
        }
    }

    async refreshData() {
        const refreshBtn = document.querySelector('.refresh-btn');
        refreshBtn.innerHTML = '<div class="loading"></div>';
        
        try {
            await this.loadInitialData();
            this.renderAllData();
            this.showNotification('Data refreshed successfully!', 'success');
        } catch (error) {
            this.showNotification('Failed to refresh data', 'error');
        } finally {
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
        }
    }

    startPeriodicUpdates() {
        // Update data every 30 seconds
        setInterval(() => {
            if (this.socket && this.socket.connected) return; // Skip if real-time updates are working
            
            this.loadLiveStreams();
            this.loadStats();
            
            if (this.currentPage === 'dashboard') {
                this.renderLiveStreams();
                this.updateStats(this.data.stats);
            }
        }, 30000);
    }

    simulateRealTimeUpdates() {
        // Simulate real-time updates in demo mode
        setInterval(() => {
            if (!CONFIG.DEMO_MODE) return;

            // Randomly update viewer counts for live streamers
            this.data.liveStreams.forEach(stream => {
                const change = Math.floor(Math.random() * 200) - 100; // +/- 100 viewers
                stream.viewers = Math.max(0, stream.viewers + change);
            });

            // Update corresponding streamers data
            this.data.streamers.forEach(streamer => {
                if (streamer.isLive) {
                    const change = Math.floor(Math.random() * 200) - 100;
                    streamer.viewerCount = Math.max(0, streamer.viewerCount + change);
                }
            });

            // Sometimes add a new activity
            if (Math.random() < 0.1) { // 10% chance every update
                const activities = [
                    'Bot restarted successfully',
                    'Configuration updated',
                    'New viewer milestone reached',
                    'Stream quality check completed'
                ];
                const randomActivity = activities[Math.floor(Math.random() * activities.length)];
                
                this.data.activity.unshift({
                    id: Date.now().toString(),
                    type: 'system',
                    message: randomActivity,
                    timestamp: new Date().toISOString()
                });

                // Keep only last 10 activities
                if (this.data.activity.length > 10) {
                    this.data.activity = this.data.activity.slice(0, 10);
                }
            }

            // Re-render updated data
            this.renderLiveStreams();
            this.renderActivity();
            
        }, 5000); // Update every 5 seconds
    }

    filterLogs() {
        const level = document.getElementById('log-level').value;
        const entries = document.querySelectorAll('.log-entry');
        
        entries.forEach(entry => {
            if (level === 'all' || entry.dataset.level === level) {
                entry.style.display = 'flex';
            } else {
                entry.style.display = 'none';
            }
        });
    }

    clearLogs() {
        if (!confirm('Are you sure you want to clear all logs?')) return;
        
        document.getElementById('logs-content').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-alt"></i>
                <h3>No Logs</h3>
                <p>Logs will appear here</p>
            </div>
        `;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">&times;</button>
        `;

        // Add styles if not already added
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: var(--dark-gray);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: var(--border-radius);
                    padding: var(--spacing-md) var(--spacing-lg);
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-md);
                    z-index: 3000;
                    animation: slideInRight 0.3s ease;
                    max-width: 400px;
                }
                .notification-success { border-left: 4px solid var(--success); }
                .notification-error { border-left: 4px solid var(--error); }
                .notification-info { border-left: 4px solid var(--accent-blue); }
                .notification-content { display: flex; align-items: center; gap: var(--spacing-sm); flex: 1; }
                .notification-close { background: none; border: none; color: var(--light-gray); cursor: pointer; font-size: 18px; }
                @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);

        // Manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    // Sidebar management methods
    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');
        
        if (sidebar.classList.contains('open')) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    }
    
    openSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');
        
        sidebar.classList.add('open');
        backdrop.classList.add('show');
        
        // Prevent body scroll when sidebar is open
        document.body.style.overflow = 'hidden';
    }
    
    closeSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');
        
        sidebar.classList.remove('open');
        backdrop.classList.remove('show');
        
        // Restore body scroll
        document.body.style.overflow = '';
    }

    // Utility methods
    // Utility functions
    getPlatformIcon(platform) {
        const icons = {
            twitch: 'T',
            youtube: 'Y',
            tiktok: 'TT',
            kick: 'K'
        };
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
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) {
            return 'Just now';
        } else if (diff < 3600000) {
            return `${Math.floor(diff / 60000)}m ago`;
        } else if (diff < 86400000) {
            return `${Math.floor(diff / 3600000)}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    }
}

// Initialize dashboard when DOM is loaded
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new StreamTrackerDashboard();
});

// Make dashboard globally available for onclick handlers
window.dashboard = dashboard;
