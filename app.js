// Personal Word Dictionary App
class WordDictionary {
    constructor() {
        this.words = this.loadWords();
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderWords();
        this.updateStats();
    }

    bindEvents() {
        // Add word button
        document.getElementById('addWordBtn').addEventListener('click', () => this.addWord());
        
        // Enter key support
        document.getElementById('word').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('translation').focus();
            }
        });
        
        document.getElementById('translation').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addWord();
            }
        });

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.renderWords();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.renderWords();
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('searchInput').focus();
            }
        });
    }

    addWord() {
        const word = document.getElementById('word').value.trim();
        const translation = document.getElementById('translation').value.trim();
        const language = document.getElementById('language').value;

        if (!word || !translation) {
            this.showToast('Please fill in both word and translation', 'error');
            return;
        }

        const newWord = {
            id: Date.now(),
            word: word,
            translation: translation,
            language: language,
            dateAdded: new Date().toISOString(),
            reviewCount: 0,
            lastReviewed: null,
            difficulty: 'medium'
        };

        this.words.unshift(newWord);
        this.saveWords();
        this.renderWords();
        this.updateStats();

        // Clear form
        document.getElementById('word').value = '';
        document.getElementById('translation').value = '';
        document.getElementById('word').focus();

        this.showToast('Word added successfully!', 'success');
    }

    renderWords() {
        const wordsList = document.getElementById('wordsList');
        const emptyState = document.getElementById('emptyState');
        
        let filteredWords = this.getFilteredWords();

        if (filteredWords.length === 0) {
            wordsList.style.display = 'none';
            emptyState.style.display = 'block';
            this.updateEmptyState();
        } else {
            wordsList.style.display = 'block';
            emptyState.style.display = 'none';
        }

        wordsList.innerHTML = filteredWords.map(word => this.createWordCard(word)).join('');
        this.bindWordCardEvents();
    }

    getFilteredWords() {
        let filtered = this.words;

        // Apply search filter
        if (this.searchQuery) {
            filtered = filtered.filter(word => 
                word.word.toLowerCase().includes(this.searchQuery) ||
                word.translation.toLowerCase().includes(this.searchQuery)
            );
        }

        // Apply category filter
        if (this.currentFilter !== 'all') {
            if (this.currentFilter === 'review') {
                filtered = filtered.filter(word => 
                    word.reviewCount === 0 || 
                    (word.lastReviewed && this.isOldReview(word.lastReviewed))
                );
            } else {
                filtered = filtered.filter(word => word.language === this.currentFilter);
            }
        }

        return filtered;
    }

    createWordCard(word) {
        const daysSinceAdded = this.getDaysSince(new Date(word.dateAdded));
        const needsReview = word.reviewCount === 0 || (word.lastReviewed && this.isOldReview(word.lastReviewed));
        
        return `
            <div class="word-card ${needsReview ? 'needs-review' : ''}" data-id="${word.id}">
                <div class="word-header">
                    <div class="word-text">${this.escapeHtml(word.word)}</div>
                    <div class="language-badge">${word.language}</div>
                </div>
                <div class="translation-text">${this.escapeHtml(word.translation)}</div>
                <div class="word-meta">
                    <span class="word-date">Added ${daysSinceAdded === 0 ? 'today' : `${daysSinceAdded} day${daysSinceAdded === 1 ? '' : 's'} ago`}</span>
                    ${word.reviewCount > 0 ? `<span class="review-count">Reviewed ${word.reviewCount} time${word.reviewCount === 1 ? '' : 's'}</span>` : ''}
                </div>
                <div class="word-actions">
                    <button class="action-btn review ${needsReview ? 'active' : ''}" data-action="review" data-id="${word.id}">
                        ${needsReview ? 'Mark as Reviewed' : 'Reviewed'}
                    </button>
                    <button class="action-btn delete" data-action="delete" data-id="${word.id}">
                        Delete
                    </button>
                </div>
            </div>
        `;
    }

    bindWordCardEvents() {
        document.querySelectorAll('.word-card .action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                const wordId = parseInt(e.target.dataset.id);
                
                if (action === 'review') {
                    this.toggleReview(wordId);
                } else if (action === 'delete') {
                    this.deleteWord(wordId);
                }
            });
        });
    }

    toggleReview(wordId) {
        const word = this.words.find(w => w.id === wordId);
        if (!word) return;

        if (word.reviewCount === 0 || (word.lastReviewed && this.isOldReview(word.lastReviewed))) {
            word.reviewCount++;
            word.lastReviewed = new Date().toISOString();
            this.showToast('Word marked as reviewed!', 'success');
        } else {
            word.reviewCount = 0;
            word.lastReviewed = null;
            this.showToast('Word marked for review', 'info');
        }

        this.saveWords();
        this.renderWords();
        this.updateStats();
    }

    deleteWord(wordId) {
        if (confirm('Are you sure you want to delete this word?')) {
            this.words = this.words.filter(w => w.id !== wordId);
            this.saveWords();
            this.renderWords();
            this.updateStats();
            this.showToast('Word deleted', 'info');
        }
    }

    updateEmptyState() {
        const emptyState = document.getElementById('emptyState');
        const p = emptyState.querySelector('p');
        
        let message = '';
        if (this.searchQuery) {
            message = `No words found for "${this.searchQuery}"`;
        } else if (this.currentFilter === 'french') {
            message = 'No French words yet';
        } else if (this.currentFilter === 'english') {
            message = 'No English words yet';
        } else if (this.currentFilter === 'review') {
            message = 'No words need review';
        } else {
            message = 'Start building your dictionary by adding your first word!';
        }
        
        p.textContent = message;
    }

    updateStats() {
        const total = this.words.length;
        const french = this.words.filter(w => w.language === 'french').length;
        const english = this.words.filter(w => w.language === 'english').length;
        const review = this.words.filter(w => 
            w.reviewCount === 0 || (w.lastReviewed && this.isOldReview(w.lastReviewed))
        ).length;

        document.getElementById('totalWords').textContent = total;
        document.getElementById('frenchWords').textContent = french;
        document.getElementById('englishWords').textContent = english;
        document.getElementById('reviewWords').textContent = review;
    }

    isOldReview(lastReviewed) {
        const daysSinceReview = this.getDaysSince(new Date(lastReviewed));
        return daysSinceReview >= 7;
    }

    getDaysSince(date) {
        return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = this.getToastIcon(type);
        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    getToastIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    loadWords() {
        try {
            const stored = localStorage.getItem('wordDictionary');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading words:', error);
            return [];
        }
    }

    saveWords() {
        try {
            localStorage.setItem('wordDictionary', JSON.stringify(this.words));
        } catch (error) {
            console.error('Error saving words:', error);
            this.showToast('Error saving words', 'error');
        }
    }

    // Export functionality
    exportWords() {
        const dataStr = JSON.stringify(this.words, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'my-word-dictionary.json';
        link.click();
        URL.revokeObjectURL(url);
        this.showToast('Words exported successfully!', 'success');
    }

    // Import functionality
    importWords(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedWords = JSON.parse(e.target.result);
                if (Array.isArray(importedWords)) {
                    this.words = [...this.words, ...importedWords];
                    this.saveWords();
                    this.renderWords();
                    this.updateStats();
                    this.showToast('Words imported successfully!', 'success');
                } else {
                    this.showToast('Invalid file format', 'error');
                }
            } catch (error) {
                this.showToast('Error reading file', 'error');
            }
        };
        reader.readAsText(file);
    }

    // Clear all words
    clearAllWords() {
        if (confirm('Are you sure you want to delete all words? This action cannot be undone.')) {
            this.words = [];
            this.saveWords();
            this.renderWords();
            this.updateStats();
            this.showToast('All words deleted', 'info');
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.wordDictionary = new WordDictionary();
    
    // Add global functions for external access
    window.exportWords = () => window.wordDictionary.exportWords();
    window.importWords = (file) => window.wordDictionary.importWords(file);
    window.clearAllWords = () => window.wordDictionary.clearAllWords();
});

// Service Worker registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
                console.log('Service Worker registered successfully:', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    });
}
