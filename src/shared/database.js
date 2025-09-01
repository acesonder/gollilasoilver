const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        this.dbPath = path.join(__dirname, '..', 'data', 'message_assistant.db');
        this.db = null;
        this.init();
    }

    async init() {
        try {
            // Ensure data directory exists
            const dataDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            // Connect to database
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                } else {
                    console.log('Connected to SQLite database');
                    this.createTables();
                }
            });
        } catch (error) {
            console.error('Error initializing database:', error);
        }
    }

    createTables() {
        const tables = [
            // Conversations table
            `CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                source TEXT NOT NULL,
                last_message TEXT,
                last_timestamp DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Messages table
            `CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                conversation_id TEXT,
                text TEXT NOT NULL,
                sender TEXT NOT NULL,
                is_from_me BOOLEAN,
                timestamp DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES conversations (id)
            )`,

            // User patterns table
            `CREATE TABLE IF NOT EXISTS user_patterns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                conversation_id TEXT,
                selected_reply TEXT,
                suggested_replies TEXT, -- JSON array
                context TEXT, -- JSON object
                confidence REAL,
                timestamp DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // User preferences table
            `CREATE TABLE IF NOT EXISTS user_preferences (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                preference_key TEXT,
                preference_value TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, preference_key)
            )`,

            // Response analytics table
            `CREATE TABLE IF NOT EXISTS response_analytics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id TEXT,
                message_text TEXT,
                generated_replies TEXT, -- JSON array
                selected_reply TEXT,
                user_modified BOOLEAN,
                response_time INTEGER, -- milliseconds
                sentiment_score REAL,
                confidence_score REAL,
                timestamp DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
        ];

        tables.forEach(tableSQL => {
            this.db.run(tableSQL, (err) => {
                if (err) {
                    console.error('Error creating table:', err);
                }
            });
        });
    }

    // Conversation methods
    async saveConversation(conversation) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT OR REPLACE INTO conversations 
                        (id, name, source, last_message, last_timestamp, updated_at) 
                        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;
            
            this.db.run(sql, [
                conversation.id,
                conversation.name,
                conversation.source,
                conversation.lastMessage,
                conversation.timestamp
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    async getConversations(source = null) {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT * FROM conversations';
            let params = [];
            
            if (source) {
                sql += ' WHERE source = ?';
                params.push(source);
            }
            
            sql += ' ORDER BY last_timestamp DESC';
            
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Message methods
    async saveMessage(message) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO messages 
                        (id, conversation_id, text, sender, is_from_me, timestamp) 
                        VALUES (?, ?, ?, ?, ?, ?)`;
            
            this.db.run(sql, [
                message.id,
                message.conversationId,
                message.text,
                message.sender,
                message.isFromMe,
                message.timestamp
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    async getMessages(conversationId, limit = 50) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM messages 
                        WHERE conversation_id = ? 
                        ORDER BY timestamp DESC 
                        LIMIT ?`;
            
            this.db.all(sql, [conversationId, limit], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows.reverse()); // Reverse to get chronological order
                }
            });
        });
    }

    // User pattern methods
    async saveUserPattern(pattern) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO user_patterns 
                        (user_id, conversation_id, selected_reply, suggested_replies, context, confidence, timestamp) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)`;
            
            this.db.run(sql, [
                pattern.userId || 'default',
                pattern.conversationId,
                pattern.selectedReply,
                JSON.stringify(pattern.suggestedReplies),
                JSON.stringify(pattern.context),
                pattern.confidence,
                pattern.timestamp
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    async getUserPatterns(userId = 'default', conversationId = null) {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT * FROM user_patterns WHERE user_id = ?';
            let params = [userId];
            
            if (conversationId) {
                sql += ' AND conversation_id = ?';
                params.push(conversationId);
            }
            
            sql += ' ORDER BY timestamp DESC LIMIT 100';
            
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const patterns = rows.map(row => ({
                        ...row,
                        suggested_replies: JSON.parse(row.suggested_replies),
                        context: JSON.parse(row.context)
                    }));
                    resolve(patterns);
                }
            });
        });
    }

    // User preferences methods
    async setUserPreference(userId, key, value) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT OR REPLACE INTO user_preferences 
                        (user_id, preference_key, preference_value, updated_at) 
                        VALUES (?, ?, ?, CURRENT_TIMESTAMP)`;
            
            this.db.run(sql, [userId, key, value], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    async getUserPreference(userId, key) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT preference_value FROM user_preferences WHERE user_id = ? AND preference_key = ?';
            
            this.db.get(sql, [userId, key], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row ? row.preference_value : null);
                }
            });
        });
    }

    async getUserPreferences(userId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT preference_key, preference_value FROM user_preferences WHERE user_id = ?';
            
            this.db.all(sql, [userId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const preferences = {};
                    rows.forEach(row => {
                        preferences[row.preference_key] = row.preference_value;
                    });
                    resolve(preferences);
                }
            });
        });
    }

    // Analytics methods
    async saveResponseAnalytics(analytics) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO response_analytics 
                        (conversation_id, message_text, generated_replies, selected_reply, 
                         user_modified, response_time, sentiment_score, confidence_score, timestamp) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            
            this.db.run(sql, [
                analytics.conversationId,
                analytics.messageText,
                JSON.stringify(analytics.generatedReplies),
                analytics.selectedReply,
                analytics.userModified,
                analytics.responseTime,
                analytics.sentimentScore,
                analytics.confidenceScore,
                analytics.timestamp
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    async getResponseAnalytics(conversationId = null, limit = 100) {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT * FROM response_analytics';
            let params = [];
            
            if (conversationId) {
                sql += ' WHERE conversation_id = ?';
                params.push(conversationId);
            }
            
            sql += ' ORDER BY timestamp DESC LIMIT ?';
            params.push(limit);
            
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const analytics = rows.map(row => ({
                        ...row,
                        generated_replies: JSON.parse(row.generated_replies)
                    }));
                    resolve(analytics);
                }
            });
        });
    }

    // Utility methods
    async clearOldData(daysOld = 30) {
        return new Promise((resolve, reject) => {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            
            const tables = ['messages', 'user_patterns', 'response_analytics'];
            let completed = 0;
            
            tables.forEach(table => {
                const sql = `DELETE FROM ${table} WHERE created_at < ?`;
                this.db.run(sql, [cutoffDate.toISOString()], (err) => {
                    if (err) {
                        console.error(`Error clearing old data from ${table}:`, err);
                    }
                    completed++;
                    if (completed === tables.length) {
                        resolve();
                    }
                });
            });
        });
    }

    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err);
                } else {
                    console.log('Database connection closed');
                }
            });
        }
    }
}

module.exports = Database;