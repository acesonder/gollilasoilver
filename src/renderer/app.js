class MessageAssistantApp {
    constructor() {
        this.currentSource = 'messenger';
        this.currentConversation = null;
        this.conversations = new Map();
        this.userPatterns = new Map();
        this.isAccessibilityEnabled = false;
        
        this.init();
    }

    async init() {
        await this.checkAccessibilityStatus();
        this.setupEventListeners();
        this.loadConversations();
        this.setupNotificationSystem();
    }

    async checkAccessibilityStatus() {
        try {
            this.isAccessibilityEnabled = await window.electronAPI.getAccessibilityStatus();
            this.updateAccessibilityStatus();
            
            if (!this.isAccessibilityEnabled) {
                this.showNotification('Accessibility permission required to read messages', 'error');
            }
        } catch (error) {
            console.error('Error checking accessibility status:', error);
        }
    }

    updateAccessibilityStatus() {
        const statusElement = document.getElementById('accessibility-status');
        if (this.isAccessibilityEnabled) {
            statusElement.classList.add('active');
        } else {
            statusElement.classList.remove('active');
        }
    }

    setupEventListeners() {
        // Source tabs
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchSource(e.target.dataset.source);
            });
        });

        // Refresh button
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.refreshMessages();
        });

        // Reply buttons
        document.querySelectorAll('.reply-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.sendReply(e.target.textContent, parseInt(e.target.dataset.index));
            });
        });

        // Custom message
        document.getElementById('send-custom').addEventListener('click', () => {
            const customMessage = document.getElementById('custom-message').value.trim();
            if (customMessage) {
                this.sendReply(customMessage, -1);
            }
        });

        // Action buttons
        document.getElementById('generate-more').addEventListener('click', () => {
            this.generateMoreReplies();
        });

        document.getElementById('learn-style').addEventListener('click', () => {
            this.learnUserStyle();
        });

        // Accessibility status click
        document.getElementById('accessibility-status').addEventListener('click', async () => {
            if (!this.isAccessibilityEnabled) {
                await window.electronAPI.requestAccessibility();
                setTimeout(() => this.checkAccessibilityStatus(), 1000);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.metaKey || e.ctrlKey) {
                switch (e.key) {
                    case '1':
                    case '2':
                    case '3':
                    case '4':
                        e.preventDefault();
                        const index = parseInt(e.key) - 1;
                        const replyButton = document.querySelector(`[data-index="${index}"]`);
                        if (replyButton && replyButton.textContent) {
                            this.sendReply(replyButton.textContent, index);
                        }
                        break;
                    case 'Enter':
                        if (document.getElementById('custom-message') === document.activeElement) {
                            e.preventDefault();
                            document.getElementById('send-custom').click();
                        }
                        break;
                }
            }
        });
    }

    switchSource(source) {
        this.currentSource = source;
        
        // Update tab appearance
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-source="${source}"]`).classList.add('active');
        
        // Load conversations for this source
        this.loadConversations();
    }

    async loadConversations() {
        try {
            const result = await window.electronAPI.readMessages(this.currentSource);
            
            if (result.success) {
                this.displayConversations(result.conversations || this.getMockConversations());
            } else {
                this.showNotification(`Failed to load ${this.currentSource} conversations`, 'error');
                this.displayConversations(this.getMockConversations());
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
            this.displayConversations(this.getMockConversations());
        }
    }

    getMockConversations() {
        return [
            {
                id: '1',
                name: 'John Doe',
                lastMessage: 'Hey, are we still on for lunch tomorrow?',
                timestamp: new Date(Date.now() - 1000 * 60 * 30),
                source: this.currentSource,
                unread: true
            },
            {
                id: '2',
                name: 'Sarah Wilson',
                lastMessage: 'Thanks for the help with the project!',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
                source: this.currentSource,
                unread: false
            },
            {
                id: '3',
                name: 'Team Chat',
                lastMessage: 'Meeting moved to 3 PM',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
                source: this.currentSource,
                unread: true
            }
        ];
    }

    displayConversations(conversations) {
        const conversationsContainer = document.getElementById('conversations');
        conversationsContainer.innerHTML = '';

        conversations.forEach(conv => {
            const convElement = document.createElement('div');
            convElement.className = 'conversation-item';
            convElement.dataset.conversationId = conv.id;
            
            convElement.innerHTML = `
                <div class="conversation-name">${conv.name}</div>
                <div class="conversation-preview">${conv.lastMessage}</div>
            `;

            convElement.addEventListener('click', () => {
                this.selectConversation(conv);
            });

            conversationsContainer.appendChild(convElement);
        });
    }

    async selectConversation(conversation) {
        this.currentConversation = conversation;

        // Update UI
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-conversation-id="${conversation.id}"]`).classList.add('active');
        
        document.getElementById('chat-title').textContent = conversation.name;

        // Load and display messages
        await this.loadMessages(conversation);
        
        // Generate reply suggestions
        await this.generateReplySuggestions();
    }

    async loadMessages(conversation) {
        const messagesContainer = document.getElementById('messages-container');
        
        // Mock messages for demonstration
        const messages = this.getMockMessages(conversation.id);
        
        messagesContainer.innerHTML = '';
        
        messages.forEach(message => {
            const messageElement = this.createMessageElement(message);
            messagesContainer.appendChild(messageElement);
        });

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Show reply section
        document.getElementById('reply-section').style.display = 'block';
    }

    getMockMessages(conversationId) {
        const messageTemplates = {
            '1': [
                { text: 'Hey, are we still on for lunch tomorrow?', sender: 'them', timestamp: new Date(Date.now() - 1000 * 60 * 30) },
                { text: 'Yes! Looking forward to it', sender: 'me', timestamp: new Date(Date.now() - 1000 * 60 * 25) },
                { text: 'Great! Should we meet at the usual place?', sender: 'them', timestamp: new Date(Date.now() - 1000 * 60 * 5) }
            ],
            '2': [
                { text: 'Thanks for the help with the project!', sender: 'them', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) },
                { text: 'No problem! Happy to help', sender: 'me', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 60 * 5) },
                { text: 'Let me know if you need anything else', sender: 'me', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 60 * 6) }
            ],
            '3': [
                { text: 'Meeting moved to 3 PM', sender: 'them', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5) },
                { text: 'Got it, thanks for the update', sender: 'me', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5 + 1000 * 60 * 2) }
            ]
        };

        return messageTemplates[conversationId] || [];
    }

    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.sender === 'me' ? 'sent' : 'received'}`;
        
        const avatar = message.sender === 'me' ? 'Me' : (this.currentConversation?.name?.charAt(0) || 'U');
        
        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                ${message.text}
                <div class="message-time">${this.formatTime(message.timestamp)}</div>
            </div>
        `;

        return messageDiv;
    }

    formatTime(timestamp) {
        return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    async generateReplySuggestions() {
        if (!this.currentConversation) return;

        try {
            const context = {
                conversation: this.currentConversation,
                recentMessages: this.getMockMessages(this.currentConversation.id),
                userStyle: this.getUserStyle(),
                source: this.currentSource
            };

            const result = await window.electronAPI.generateReplies(context);
            this.displayReplySuggestions(result.replies);
        } catch (error) {
            console.error('Error generating replies:', error);
            this.displayReplySuggestions(this.getDefaultReplies());
        }
    }

    getDefaultReplies() {
        const replies = [
            "Sounds good!",
            "Let me think about it",
            "I'll get back to you soon",
            "Thanks for letting me know"
        ];

        // Personalize based on conversation context
        const lastMessage = this.getMockMessages(this.currentConversation?.id).pop();
        if (lastMessage) {
            const text = lastMessage.text.toLowerCase();
            if (text.includes('meeting') || text.includes('appointment')) {
                replies[0] = "I'll be there";
                replies[1] = "What time works best?";
            } else if (text.includes('lunch') || text.includes('dinner')) {
                replies[0] = "Absolutely!";
                replies[1] = "Where should we meet?";
            } else if (text.includes('thank') || text.includes('thanks')) {
                replies[0] = "You're welcome!";
                replies[1] = "Happy to help";
            }
        }

        return replies;
    }

    displayReplySuggestions(replies) {
        const replyButtons = document.querySelectorAll('.reply-button');
        
        replies.forEach((reply, index) => {
            if (replyButtons[index]) {
                replyButtons[index].textContent = reply;
                replyButtons[index].style.display = 'block';
            }
        });

        // Hide unused buttons
        for (let i = replies.length; i < replyButtons.length; i++) {
            replyButtons[i].style.display = 'none';
        }
    }

    async sendReply(message, index) {
        if (!this.currentConversation || !message.trim()) return;

        try {
            const result = await window.electronAPI.sendMessage(message, this.currentConversation);
            
            if (result.success) {
                // Add message to chat
                const messageElement = this.createMessageElement({
                    text: message,
                    sender: 'me',
                    timestamp: new Date()
                });
                
                const messagesContainer = document.getElementById('messages-container');
                messagesContainer.appendChild(messageElement);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;

                // Clear custom message
                document.getElementById('custom-message').value = '';
                
                // Learn from this response
                this.learnFromResponse(message, index);
                
                this.showNotification('Message sent successfully', 'success');
            } else {
                this.showNotification('Failed to send message', 'error');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.showNotification('Error sending message', 'error');
        }
    }

    learnFromResponse(message, index) {
        if (!this.currentConversation) return;

        const pattern = {
            conversationId: this.currentConversation.id,
            source: this.currentSource,
            message: message,
            suggestedIndex: index,
            timestamp: new Date(),
            context: this.getMockMessages(this.currentConversation.id).slice(-3)
        };

        // Store pattern for learning
        const key = `${this.currentConversation.id}_${this.currentSource}`;
        if (!this.userPatterns.has(key)) {
            this.userPatterns.set(key, []);
        }
        this.userPatterns.get(key).push(pattern);

        // Keep only recent patterns
        const patterns = this.userPatterns.get(key);
        if (patterns.length > 50) {
            patterns.splice(0, patterns.length - 50);
        }
    }

    getUserStyle() {
        // Analyze user patterns to determine communication style
        const allPatterns = Array.from(this.userPatterns.values()).flat();
        
        if (allPatterns.length === 0) {
            return { style: 'casual', confidence: 0.5 };
        }

        // Simple analysis - in a real app, this would be more sophisticated
        const avgLength = allPatterns.reduce((sum, p) => sum + p.message.length, 0) / allPatterns.length;
        const punctuationRatio = allPatterns.filter(p => /[.!?]$/.test(p.message)).length / allPatterns.length;
        const casualWords = allPatterns.filter(p => /\b(yeah|yep|ok|cool|awesome|lol)\b/i.test(p.message)).length;
        
        let style = 'casual';
        if (punctuationRatio > 0.8 && avgLength > 20) {
            style = 'professional';
        } else if (casualWords / allPatterns.length > 0.3) {
            style = 'friendly';
        }

        return { style, confidence: Math.min(allPatterns.length / 20, 1) };
    }

    async generateMoreReplies() {
        await this.generateReplySuggestions();
        this.showNotification('Generated new reply suggestions', 'success');
    }

    async learnUserStyle() {
        // In a real implementation, this would trigger deeper analysis
        this.showNotification('Learning from your message patterns...', 'info');
        
        setTimeout(() => {
            this.generateReplySuggestions();
            this.showNotification('Style analysis updated', 'success');
        }, 2000);
    }

    async refreshMessages() {
        if (this.currentConversation) {
            await this.loadMessages(this.currentConversation);
            await this.generateReplySuggestions();
        }
        await this.loadConversations();
        this.showNotification('Messages refreshed', 'success');
    }

    setupNotificationSystem() {
        // Create notifications container if it doesn't exist
        if (!document.getElementById('notifications')) {
            const notificationsDiv = document.createElement('div');
            notificationsDiv.id = 'notifications';
            notificationsDiv.className = 'notifications';
            document.body.appendChild(notificationsDiv);
        }
    }

    showNotification(message, type = 'info', duration = 3000) {
        const notificationsContainer = document.getElementById('notifications');
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        notificationsContainer.appendChild(notification);
        
        // Auto-remove notification
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, duration);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MessageAssistantApp();
});