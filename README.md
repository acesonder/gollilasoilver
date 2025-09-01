# Message Assistant

An AI-powered message response assistant for Facebook Messenger and iMessage on macOS. The application reads your conversations, learns your communication patterns, and provides intelligent reply suggestions that match your writing style.

## Features

- **Multi-Platform Message Reading**: Supports both Facebook Messenger (Web/Standalone) and iMessage
- **AI-Powered Response Generation**: Uses advanced NLP to generate contextually appropriate replies
- **Personal Writing Style Learning**: Analyzes your past messages to match your unique communication style
- **Smart Context Awareness**: Understands conversation context and relationship dynamics
- **Elevation System**: Automatically detects important messages that may need your personal attention
- **Four Reply Options + Custom**: Provides 4 suggested replies plus custom message option
- **Keyboard Shortcuts**: Quick reply selection with Cmd+1-4
- **Privacy-Focused**: All data processing happens locally on your Mac

## Requirements

- macOS (required for message reading capabilities)
- Node.js 16+ 
- Accessibility permissions for reading messages

## Installation

1. Clone the repository:
```bash
git clone https://github.com/acesonder/gollilasoilver.git
cd gollilasoilver
```

2. Install dependencies:
```bash
npm install
```

3. Start the application:
```bash
npm start
```

## Usage

### First Launch

1. **Grant Accessibility Permissions**: The app will prompt you to grant accessibility permissions in System Preferences > Security & Privacy > Accessibility. This is required to read messages from Messenger and iMessage.

2. **Select Message Source**: Choose between Facebook Messenger and iMessage using the tabs in the sidebar.

3. **Select Conversation**: Click on any conversation to view messages and get reply suggestions.

### Replying to Messages

1. **View Suggestions**: The app automatically generates 4 contextually appropriate reply suggestions based on the conversation.

2. **Select a Reply**: 
   - Click any suggested reply button to send it
   - Use keyboard shortcuts: Cmd+1, Cmd+2, Cmd+3, Cmd+4
   - Write a custom message in the text area

3. **Learn Your Style**: The app learns from your selections to improve future suggestions.

### Features

- **Auto-Suggest**: Enable in settings to automatically generate replies for new messages
- **Style Learning**: The app continuously learns your communication patterns
- **Elevation Alerts**: Important messages are flagged for your attention
- **Conversation Context**: Replies are tailored to specific relationships and conversation history

## Architecture

### Core Components

- **Message Reader** (`src/shared/messageReader.js`): Handles reading messages from macOS apps using AppleScript
- **AI Response Generator** (`src/shared/aiResponseGenerator.js`): Generates intelligent replies using NLP and machine learning
- **Database** (`src/shared/database.js`): Stores conversation history and learning patterns
- **Main Process** (`src/main.js`): Electron main process handling app lifecycle and IPC
- **Renderer** (`src/renderer/`): Frontend UI for the application

### Technologies Used

- **Electron**: Cross-platform desktop app framework
- **Node NLP**: Natural language processing for intent recognition
- **Compromise**: Text analysis and linguistic processing
- **Sentiment**: Emotion analysis of messages
- **SQLite**: Local database for storing patterns and preferences
- **AppleScript**: macOS automation for reading messages

## Development

### Running in Development

```bash
npm run dev
```

### Running Tests

```bash
npm test
```

### Building for Distribution

```bash
npm run build
```

## Privacy & Security

- **Local Processing**: All AI analysis happens locally on your Mac
- **No Data Transmission**: Messages and patterns are never sent to external servers
- **Secure Storage**: Local SQLite database with encrypted sensitive data
- **Minimal Permissions**: Only requests necessary accessibility permissions

## Customization

### Response Styles

The app supports different communication styles:
- **Casual**: Relaxed, informal responses
- **Professional**: Formal, business-appropriate responses  
- **Friendly**: Warm, personable responses
- **Auto-detect**: Automatically matches the conversation tone

### Learning Settings

- **Pattern Learning**: Enable/disable learning from your message choices
- **Auto-suggestions**: Automatically suggest replies for new messages
- **Context Memory**: How many previous messages to consider for context

## Troubleshooting

### Accessibility Issues

If the app cannot read messages:

1. Go to System Preferences > Security & Privacy > Accessibility
2. Ensure "Message Assistant" is checked in the list
3. If not listed, click the "+" button and add the app
4. Restart the application

### Message Reading Issues

- **Messenger**: Ensure the Messenger app is running and logged in
- **iMessage**: Ensure iMessage is set up and working normally
- **Permissions**: Check that accessibility permissions are granted

### Performance Issues

- Clear old conversation data in settings if the app becomes slow
- Restart the app if AI responses become unresponsive
- Check available disk space for database storage

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with Electron for cross-platform compatibility
- NLP powered by Node NLP and Compromise libraries
- UI design inspired by modern messaging applications
- macOS integration using AppleScript automation