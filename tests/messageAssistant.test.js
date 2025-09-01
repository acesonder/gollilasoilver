const AIResponseGenerator = require('../src/shared/aiResponseGenerator');
const MessageReader = require('../src/shared/messageReader');

describe('Message Assistant', () => {
    let aiGenerator;
    let messageReader;

    beforeEach(() => {
        aiGenerator = new AIResponseGenerator();
        messageReader = new MessageReader();
    });

    test('AI Response Generator initializes', async () => {
        expect(aiGenerator).toBeDefined();
        expect(aiGenerator.initialized).toBe(false);
        
        await aiGenerator.init();
        expect(aiGenerator.initialized).toBe(true);
    });

    test('Message Reader is supported on macOS', () => {
        expect(messageReader).toBeDefined();
        // Note: This test will only pass on macOS
        if (process.platform === 'darwin') {
            expect(messageReader.isSupported).toBe(true);
        } else {
            expect(messageReader.isSupported).toBe(false);
        }
    });

    test('AI generates replies for context', async () => {
        const context = {
            conversation: { id: 'test', name: 'Test User' },
            recentMessages: [
                {
                    text: 'Hey, are we still on for lunch tomorrow?',
                    sender: 'them',
                    timestamp: new Date()
                }
            ],
            userStyle: { style: 'casual' },
            source: 'messenger'
        };

        const result = await aiGenerator.generateReplies(context);
        
        expect(result).toBeDefined();
        expect(result.replies).toBeDefined();
        expect(Array.isArray(result.replies)).toBe(true);
        expect(result.replies.length).toBeGreaterThan(0);
    });

    test('AI analyzes message correctly', async () => {
        const message = 'Hey, are we still on for lunch tomorrow?';
        const analysis = await aiGenerator.analyzeMessage(message);
        
        expect(analysis).toBeDefined();
        expect(analysis.intent).toBeDefined();
        expect(analysis.sentiment).toBeDefined();
        expect(analysis.messageType).toBeDefined();
        
        // The message contains "are" and "?" so should be detected as a question
        expect(analysis.isQuestion).toBe(true);
    });

    test('Default replies are generated when no context', async () => {
        const result = aiGenerator.getDefaultReplies();
        
        expect(result).toBeDefined();
        expect(result.replies).toBeDefined();
        expect(result.replies.length).toBe(4);
        expect(result.confidence).toBe(0.5);
    });
});