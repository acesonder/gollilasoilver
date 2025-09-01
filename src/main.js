const { app, BrowserWindow, ipcMain, systemPreferences, dialog } = require('electron');
const path = require('path');
const MessageReader = require('./shared/messageReader');
const AIResponseGenerator = require('./shared/aiResponseGenerator');
const Database = require('./shared/database');
const isDev = process.argv.includes('--dev');

class MessageAssistant {
  constructor() {
    this.mainWindow = null;
    this.messageReader = new MessageReader();
    this.aiGenerator = new AIResponseGenerator();
    this.database = new Database();
    this.setupApp();
  }

  setupApp() {
    app.whenReady().then(() => {
      this.createMainWindow();
      this.setupIPC();
      this.requestAccessibilityPermissions();
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      }
    });
  }

  createMainWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'renderer', 'preload.js')
      },
      titleBarStyle: 'hiddenInset',
      show: false
    });

    this.mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
    
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
    });

    if (isDev) {
      this.mainWindow.webContents.openDevTools();
    }
  }

  async requestAccessibilityPermissions() {
    // Request accessibility permissions for reading messages
    const hasPermission = systemPreferences.isTrustedAccessibilityClient(false);
    if (!hasPermission) {
      systemPreferences.isTrustedAccessibilityClient(true);
    }
  }

  setupIPC() {
    ipcMain.handle('get-accessibility-status', () => {
      return systemPreferences.isTrustedAccessibilityClient(false);
    });

    ipcMain.handle('request-accessibility', () => {
      return systemPreferences.isTrustedAccessibilityClient(true);
    });

    ipcMain.handle('read-messages', async (event, source) => {
      // This will be implemented to read from Messenger/iMessage
      return this.readMessages(source);
    });

    ipcMain.handle('generate-replies', async (event, context) => {
      // This will generate AI-powered replies
      return this.generateReplies(context);
    });

    ipcMain.handle('send-message', async (event, message, target) => {
      // This will send the selected message
      return this.sendMessage(message, target);
    });
  }

  async readMessages(source) {
    try {
      console.log(`Reading messages from ${source}`);
      
      let result;
      if (source === 'messenger') {
        result = await this.messageReader.readMessengerMessages();
      } else if (source === 'imessage') {
        result = await this.messageReader.readIMessages();
      } else {
        throw new Error(`Unsupported source: ${source}`);
      }

      return result;
    } catch (error) {
      console.error('Error in readMessages:', error);
      return {
        success: false,
        messages: [],
        error: error.message
      };
    }
  }

  async generateReplies(context) {
    try {
      console.log('Generating replies for context:', context);
      
      const result = await this.aiGenerator.generateReplies(context);
      
      // Check if the message should be elevated to user attention
      if (this.aiGenerator.shouldElevateToUser(context.analysis, context)) {
        // Show dialog for elevation
        const response = await dialog.showMessageBox(this.mainWindow, {
          type: 'question',
          buttons: ['Handle Automatically', 'Let Me Respond'],
          defaultId: 1,
          title: 'Important Message Detected',
          message: 'This message might need your personal attention.',
          detail: `From: ${context.conversation?.name}\nMessage: ${context.recentMessages?.slice(-1)[0]?.text}`
        });
        
        result.requiresElevation = response.response === 1;
      }
      
      return result;
    } catch (error) {
      console.error('Error generating replies:', error);
      return {
        replies: [
          "Sounds good!",
          "Let me think about it",
          "I'll get back to you soon",
          "Thanks for letting me know"
        ],
        error: error.message
      };
    }
  }

  async sendMessage(message, target) {
    try {
      console.log(`Sending message "${message}" to ${target.name}`);
      
      const result = await this.messageReader.sendMessage(
        message, 
        target.id, 
        target.source || 'messenger'
      );
      
      // Learn from user's response choice
      if (target.context) {
        this.aiGenerator.learnFromUserResponse(message, target.suggestedReplies, target.context);
      }
      
      return result;
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  }
}

new MessageAssistant();