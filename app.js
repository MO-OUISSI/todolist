// Focus Timer App - Main JavaScript File

class FocusTimer {
    constructor() {
        this.currentMode = 'focus';
        this.isRunning = false;
        this.isPaused = false;
        this.timeLeft = 25 * 60; // 25 minutes in seconds
        this.totalTime = 25 * 60;
        this.sessionCount = 0;
        this.sessionsBeforeLongBreak = 4;
        this.timerInterval = null;
        
        // Settings
        this.settings = {
            focusTime: 25,
            shortBreakTime: 5,
            longBreakTime: 15,
            sessionsBeforeLongBreak: 4,
            soundEnabled: true,
            autoStartBreaks: false
        };
        
        // Statistics
        this.stats = {
            totalSessions: 0,
            totalFocusTime: 0,
            todaySessions: 0,
            streak: 0,
            weeklyData: []
        };
        
        this.init();
    }
    
    init() {
        this.loadSettings();
        this.loadStats();
        this.setupEventListeners();
        this.updateDisplay();
        this.updateStats();
        this.setupNavigation();
    }
    
    setupEventListeners() {
        // Timer controls
        document.getElementById('start-btn').addEventListener('click', () => this.startTimer());
        document.getElementById('pause-btn').addEventListener('click', () => this.pauseTimer());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetTimer());
        
        // Mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setMode(e.target.dataset.mode));
        });
        
        // Settings
        document.getElementById('save-settings').addEventListener('click', () => this.saveSettings());
        
        // Navigation
        document.getElementById('nav-toggle').addEventListener('click', () => this.toggleNav());
        
        // Notification close
        document.getElementById('notification-close').addEventListener('click', () => this.hideNotification());
        
        // Page navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToPage(e.target.dataset.page);
            });
        });
        
        // Auto-save settings on change
        document.querySelectorAll('#settings-page input').forEach(input => {
            input.addEventListener('change', () => this.saveSettings());
        });
    }
    
    setupNavigation() {
        // Mobile navigation toggle
        this.toggleNav = () => {
            const navMenu = document.getElementById('nav-menu');
            const navToggle = document.getElementById('nav-toggle');
            
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        };
        
        // Close nav when clicking outside
        document.addEventListener('click', (e) => {
            const navMenu = document.getElementById('nav-menu');
            const navToggle = document.getElementById('nav-toggle');
            
            if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            }
        });
    }
    
    navigateToPage(page) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        
        // Show selected page
        document.getElementById(`${page}-page`).classList.add('active');
        
        // Update nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`).classList.add('active');
        
        // Close mobile nav
        document.getElementById('nav-menu').classList.remove('active');
        document.getElementById('nav-toggle').classList.remove('active');
        
        // Update stats if on stats page
        if (page === 'stats') {
            this.updateStats();
        }
    }
    
    setMode(mode) {
        if (this.isRunning) return;
        
        this.currentMode = mode;
        
        // Update mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
        
        // Update timer container class
        const timerContainer = document.querySelector('.timer-container');
        timerContainer.className = `timer-container ${mode}-mode`;
        
        // Set time based on mode
        switch (mode) {
            case 'focus':
                this.totalTime = this.settings.focusTime * 60;
                break;
            case 'short-break':
                this.totalTime = this.settings.shortBreakTime * 60;
                break;
            case 'long-break':
                this.totalTime = this.settings.longBreakTime * 60;
                break;
        }
        
        this.timeLeft = this.totalTime;
        this.updateDisplay();
    }
    
    startTimer() {
        if (this.isPaused) {
            this.resumeTimer();
            return;
        }
        
        this.isRunning = true;
        this.isPaused = false;
        
        // Update UI
        document.getElementById('start-btn').style.display = 'none';
        document.getElementById('pause-btn').style.display = 'flex';
        document.getElementById('timer-status').textContent = this.currentMode === 'focus' ? 'Focusing...' : 'Break time!';
        
        // Start interval
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            
            if (this.timeLeft <= 0) {
                this.completeSession();
            }
        }, 1000);
    }
    
    pauseTimer() {
        this.isRunning = false;
        this.isPaused = true;
        
        clearInterval(this.timerInterval);
        
        // Update UI
        document.getElementById('start-btn').style.display = 'flex';
        document.getElementById('pause-btn').style.display = 'none';
        document.getElementById('timer-status').textContent = 'Paused';
    }
    
    resumeTimer() {
        this.isRunning = true;
        this.isPaused = false;
        
        // Update UI
        document.getElementById('start-btn').style.display = 'none';
        document.getElementById('pause-btn').style.display = 'flex';
        document.getElementById('timer-status').textContent = this.currentMode === 'focus' ? 'Focusing...' : 'Break time!';
        
        // Start interval
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            
            if (this.timeLeft <= 0) {
                this.completeSession();
            }
        }, 1000);
    }
    
    resetTimer() {
        this.isRunning = false;
        this.isPaused = false;
        
        clearInterval(this.timerInterval);
        
        this.timeLeft = this.totalTime;
        
        // Update UI
        document.getElementById('start-btn').style.display = 'flex';
        document.getElementById('pause-btn').style.display = 'none';
        document.getElementById('timer-status').textContent = 'Ready to focus';
        
        this.updateDisplay();
    }
    
    completeSession() {
        this.isRunning = false;
        this.isPaused = false;
        
        clearInterval(this.timerInterval);
        
        // Add completion animation
        document.querySelector('.timer-circle').classList.add('completed');
        setTimeout(() => {
            document.querySelector('.timer-circle').classList.remove('completed');
        }, 1000);
        
        // Play notification sound
        if (this.settings.soundEnabled) {
            this.playNotificationSound();
        }
        
        // Show notification
        this.showNotification(
            this.currentMode === 'focus' 
                ? 'Focus session completed! Time for a break.' 
                : 'Break completed! Ready to focus again.'
        );
        
        // Update statistics
        if (this.currentMode === 'focus') {
            this.sessionCount++;
            this.stats.totalSessions++;
            this.stats.totalFocusTime += this.settings.focusTime;
            this.stats.todaySessions++;
            this.stats.streak++;
        }
        
        // Auto-advance to next mode
        this.autoAdvanceMode();
        
        this.updateDisplay();
        this.updateStats();
        this.saveStats();
    }
    
    autoAdvanceMode() {
        if (this.currentMode === 'focus') {
            // Check if it's time for a long break
            if (this.sessionCount % this.settings.sessionsBeforeLongBreak === 0) {
                this.setMode('long-break');
            } else {
                this.setMode('short-break');
            }
        } else {
            // Break completed, go back to focus
            this.setMode('focus');
        }
        
        // Auto-start if enabled
        if (this.settings.autoStartBreaks && this.currentMode !== 'focus') {
            setTimeout(() => this.startTimer(), 1000);
        }
    }
    
    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('timer-display').textContent = timeString;
        document.getElementById('session-count').textContent = this.sessionCount;
        
        // Update progress circle
        const progress = ((this.totalTime - this.timeLeft) / this.totalTime) * 283;
        document.getElementById('progress-circle').style.strokeDashoffset = 283 - progress;
    }
    
    playNotificationSound() {
        // Create a simple beep sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }
    
    showNotification(message) {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notification-text');
        
        notificationText.textContent = message;
        notification.classList.add('show');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideNotification();
        }, 5000);
    }
    
    hideNotification() {
        document.getElementById('notification').classList.remove('show');
    }
    
    saveSettings() {
        this.settings.focusTime = parseInt(document.getElementById('focus-time').value);
        this.settings.shortBreakTime = parseInt(document.getElementById('short-break-time').value);
        this.settings.longBreakTime = parseInt(document.getElementById('long-break-time').value);
        this.settings.sessionsBeforeLongBreak = parseInt(document.getElementById('sessions-before-long-break').value);
        this.settings.soundEnabled = document.getElementById('sound-enabled').checked;
        this.settings.autoStartBreaks = document.getElementById('auto-start-breaks').checked;
        
        localStorage.setItem('focusTimerSettings', JSON.stringify(this.settings));
        
        // Update current timer if not running
        if (!this.isRunning) {
            this.setMode(this.currentMode);
        }
        
        this.showNotification('Settings saved successfully!');
    }
    
    loadSettings() {
        const saved = localStorage.getItem('focusTimerSettings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
        
        // Update settings form
        document.getElementById('focus-time').value = this.settings.focusTime;
        document.getElementById('short-break-time').value = this.settings.shortBreakTime;
        document.getElementById('long-break-time').value = this.settings.longBreakTime;
        document.getElementById('sessions-before-long-break').value = this.settings.sessionsBeforeLongBreak;
        document.getElementById('sound-enabled').checked = this.settings.soundEnabled;
        document.getElementById('auto-start-breaks').checked = this.settings.autoStartBreaks;
    }
    
    saveStats() {
        localStorage.setItem('focusTimerStats', JSON.stringify(this.stats));
    }
    
    loadStats() {
        const saved = localStorage.getItem('focusTimerStats');
        if (saved) {
            this.stats = { ...this.stats, ...JSON.parse(saved) };
        }
        
        // Reset daily stats if new day
        const today = new Date().toDateString();
        const lastReset = localStorage.getItem('focusTimerLastReset');
        if (lastReset !== today) {
            this.stats.todaySessions = 0;
            localStorage.setItem('focusTimerLastReset', today);
        }
    }
    
    updateStats() {
        document.getElementById('total-sessions').textContent = this.stats.totalSessions;
        
        const hours = Math.floor(this.stats.totalFocusTime / 60);
        const minutes = this.stats.totalFocusTime % 60;
        document.getElementById('total-focus-time').textContent = `${hours}h ${minutes}m`;
        
        document.getElementById('today-sessions').textContent = this.stats.todaySessions;
        document.getElementById('streak').textContent = this.stats.streak;
        
        // Update weekly chart (simple implementation)
        this.updateWeeklyChart();
    }
    
    updateWeeklyChart() {
        const chart = document.getElementById('weekly-chart');
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const today = new Date().getDay();
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - today + 1);
        
        let chartHTML = '<div class="chart-bars">';
        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(startOfWeek);
            dayDate.setDate(dayDate.getDate() + i);
            const isToday = dayDate.toDateString() === new Date().toDateString();
            const sessions = isToday ? this.stats.todaySessions : Math.floor(Math.random() * 8); // Mock data for demo
            
            chartHTML += `
                <div class="chart-bar">
                    <div class="bar" style="height: ${(sessions / 8) * 100}%"></div>
                    <div class="bar-label">${days[i]}</div>
                    <div class="bar-value">${sessions}</div>
                </div>
            `;
        }
        chartHTML += '</div>';
        
        chart.innerHTML = chartHTML;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.focusTimer = new FocusTimer();
});

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
