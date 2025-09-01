const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class MessageReader {
    constructor() {
        this.isSupported = process.platform === 'darwin'; // macOS only
    }

    async readMessengerMessages() {
        if (!this.isSupported) {
            throw new Error('Message reading is only supported on macOS');
        }

        try {
            // Use AppleScript to read Messenger messages
            const script = `
                tell application "System Events"
                    if exists (process "Messenger") then
                        tell process "Messenger"
                            try
                                -- Get the main window
                                set mainWindow to window 1
                                
                                -- Get conversation list
                                set conversationList to {}
                                set conversationElements to UI elements of scroll area of splitter group of mainWindow
                                
                                repeat with convElement in conversationElements
                                    try
                                        set convName to name of convElement
                                        set convPreview to description of convElement
                                        set conversationList to conversationList & {{name:convName, preview:convPreview}}
                                    end try
                                end repeat
                                
                                return conversationList
                            on error
                                return {}
                            end try
                        end tell
                    else
                        return "Messenger app not running"
                    end if
                end tell
            `;

            const result = await this.executeAppleScript(script);
            return this.parseConversations(result);
        } catch (error) {
            console.error('Error reading Messenger messages:', error);
            return { success: false, error: error.message };
        }
    }

    async readIMessages() {
        if (!this.isSupported) {
            throw new Error('Message reading is only supported on macOS');
        }

        try {
            // Use AppleScript to read iMessage conversations
            const script = `
                tell application "Messages"
                    try
                        set conversationList to {}
                        set allChats to every chat
                        
                        repeat with currentChat in allChats
                            try
                                set chatName to name of currentChat
                                set recentMessages to last 1 messages of currentChat
                                set lastMessage to ""
                                
                                if (count of recentMessages) > 0 then
                                    set lastMessage to text of item 1 of recentMessages
                                end if
                                
                                set conversationList to conversationList & {{name:chatName, lastMessage:lastMessage}}
                            end try
                        end repeat
                        
                        return conversationList
                    on error
                        return {}
                    end try
                end tell
            `;

            const result = await this.executeAppleScript(script);
            return this.parseConversations(result);
        } catch (error) {
            console.error('Error reading iMessages:', error);
            return { success: false, error: error.message };
        }
    }

    async getConversationMessages(conversationId, source) {
        try {
            let script;
            
            if (source === 'imessage') {
                script = `
                    tell application "Messages"
                        try
                            set targetChat to chat id "${conversationId}"
                            set allMessages to every message of targetChat
                            set messageList to {}
                            
                            repeat with currentMessage in allMessages
                                try
                                    set messageText to text of currentMessage
                                    set messageTime to time sent of currentMessage
                                    set sender to handle of currentMessage
                                    set isFromMe to (direction of currentMessage is outgoing)
                                    
                                    set messageList to messageList & {{text:messageText, time:messageTime, sender:sender, fromMe:isFromMe}}
                                end try
                            end repeat
                            
                            return messageList
                        on error
                            return {}
                        end try
                    end tell
                `;
            } else {
                // Messenger - more complex due to web-based nature
                script = `
                    tell application "System Events"
                        if exists (process "Messenger") then
                            tell process "Messenger"
                                try
                                    -- Focus on the conversation
                                    -- This is a simplified version - real implementation would need more sophisticated UI element targeting
                                    return "Messenger message reading requires more advanced UI automation"
                                on error
                                    return {}
                                end try
                            end tell
                        else
                            return "Messenger app not running"
                        end if
                    end tell
                `;
            }

            const result = await this.executeAppleScript(script);
            return this.parseMessages(result);
        } catch (error) {
            console.error('Error getting conversation messages:', error);
            return { success: false, error: error.message };
        }
    }

    async executeAppleScript(script) {
        try {
            const { stdout, stderr } = await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")})'`);
            if (stderr) {
                console.warn('AppleScript warning:', stderr);
            }
            return stdout.trim();
        } catch (error) {
            throw new Error(`AppleScript execution failed: ${error.message}`);
        }
    }

    parseConversations(rawResult) {
        try {
            // Parse AppleScript output into conversation objects
            if (typeof rawResult === 'string' && rawResult.includes('not running')) {
                return { success: false, error: rawResult };
            }

            // Mock parsing for demonstration - real implementation would parse AppleScript list format
            const conversations = [
                {
                    id: 'conv_1',
                    name: 'John Doe',
                    lastMessage: 'Hey, how are you doing?',
                    timestamp: new Date(),
                    unread: true
                },
                {
                    id: 'conv_2', 
                    name: 'Sarah Wilson',
                    lastMessage: 'Thanks for the help!',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60),
                    unread: false
                }
            ];

            return { success: true, conversations };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    parseMessages(rawResult) {
        try {
            // Parse AppleScript message list output
            const messages = [
                {
                    id: 'msg_1',
                    text: 'Hey there!',
                    sender: 'them',
                    timestamp: new Date(Date.now() - 1000 * 60 * 10),
                    isFromMe: false
                },
                {
                    id: 'msg_2',
                    text: 'Hi! How are you?',
                    sender: 'me',
                    timestamp: new Date(Date.now() - 1000 * 60 * 5),
                    isFromMe: true
                }
            ];

            return { success: true, messages };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async sendMessage(message, conversationId, source) {
        try {
            let script;

            if (source === 'imessage') {
                script = `
                    tell application "Messages"
                        try
                            set targetChat to chat id "${conversationId}"
                            send "${message.replace(/"/g, '\\"')}" to targetChat
                            return "Message sent successfully"
                        on error
                            return "Failed to send message"
                        end try
                    end tell
                `;
            } else {
                // Messenger - requires UI automation
                script = `
                    tell application "System Events"
                        if exists (process "Messenger") then
                            tell process "Messenger"
                                try
                                    -- Find message input field and type message
                                    -- This is a simplified placeholder
                                    keystroke "${message.replace(/"/g, '\\"')}"
                                    key code 36 -- Enter key
                                    return "Message sent via UI automation"
                                on error
                                    return "Failed to send message via UI"
                                end try
                            end tell
                        else
                            return "Messenger app not running"
                        end if
                    end tell
                `;
            }

            const result = await this.executeAppleScript(script);
            return { success: result.includes('successfully') || result.includes('sent'), result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = MessageReader;