const { NlpManager } = require('node-nlp');
const Sentiment = require('sentiment');
const compromise = require('compromise');

class AIResponseGenerator {
    constructor() {
        this.nlpManager = new NlpManager({ languages: ['en'] });
        this.sentiment = new Sentiment();
        this.userPatterns = new Map();
        this.conversationContext = new Map();
        this.initialized = false;
        
        this.init();
    }

    async init() {
        try {
            // Train basic response patterns
            await this.trainBasicPatterns();
            this.initialized = true;
        } catch (error) {
            console.error('Error initializing AI response generator:', error);
        }
    }

    async trainBasicPatterns() {
        // Question responses
        this.nlpManager.addDocument('en', 'are you free', 'availability');
        this.nlpManager.addDocument('en', 'are you available', 'availability');
        this.nlpManager.addDocument('en', 'can you meet', 'availability');
        this.nlpManager.addDocument('en', 'what time', 'time_question');
        this.nlpManager.addDocument('en', 'when', 'time_question');
        this.nlpManager.addDocument('en', 'where', 'location_question');
        
        // Gratitude responses
        this.nlpManager.addDocument('en', 'thank you', 'gratitude');
        this.nlpManager.addDocument('en', 'thanks', 'gratitude');
        this.nlpManager.addDocument('en', 'appreciate it', 'gratitude');
        
        // Agreements
        this.nlpManager.addDocument('en', 'sounds good', 'agreement');
        this.nlpManager.addDocument('en', 'perfect', 'agreement');
        this.nlpManager.addDocument('en', 'great', 'agreement');
        
        // Responses
        this.nlpManager.addAnswer('en', 'availability', 'Let me check my schedule');
        this.nlpManager.addAnswer('en', 'availability', 'I should be free');
        this.nlpManager.addAnswer('en', 'availability', 'What time works for you?');
        
        this.nlpManager.addAnswer('en', 'time_question', 'How about 2 PM?');
        this.nlpManager.addAnswer('en', 'time_question', 'Whenever works for you');
        this.nlpManager.addAnswer('en', 'time_question', 'I\'m flexible on timing');
        
        this.nlpManager.addAnswer('en', 'location_question', 'The usual place?');
        this.nlpManager.addAnswer('en', 'location_question', 'Where would you prefer?');
        
        this.nlpManager.addAnswer('en', 'gratitude', 'You\'re welcome!');
        this.nlpManager.addAnswer('en', 'gratitude', 'Happy to help');
        this.nlpManager.addAnswer('en', 'gratitude', 'No problem at all');
        
        this.nlpManager.addAnswer('en', 'agreement', 'Awesome!');
        this.nlpManager.addAnswer('en', 'agreement', 'Looking forward to it');
        this.nlpManager.addAnswer('en', 'agreement', 'Perfect!');

        await this.nlpManager.train();
    }

    async generateReplies(context) {
        try {
            if (!this.initialized) {
                await this.init();
            }

            const { conversation, recentMessages, userStyle, source } = context;
            const lastMessage = recentMessages[recentMessages.length - 1];
            
            if (!lastMessage || lastMessage.sender === 'me') {
                return this.getDefaultReplies();
            }

            // Analyze the last message
            const analysis = await this.analyzeMessage(lastMessage.text);
            
            // Generate contextual replies
            const replies = await this.generateContextualReplies(analysis, context);
            
            // Personalize replies based on user style
            const personalizedReplies = this.personalizeReplies(replies, userStyle, conversation);
            
            return {
                replies: personalizedReplies,
                confidence: analysis.confidence,
                context: analysis.intent
            };
        } catch (error) {
            console.error('Error generating replies:', error);
            return this.getDefaultReplies();
        }
    }

    async analyzeMessage(messageText) {
        try {
            // NLP analysis
            const nlpResult = await this.nlpManager.process('en', messageText);
            
            // Sentiment analysis
            const sentimentResult = this.sentiment.analyze(messageText);
            
            // Linguistic analysis
            const doc = compromise(messageText);
            const questions = doc.questions().out('array');
            const isQuestion = questions.length > 0 || messageText.includes('?') || 
                             /\b(are|is|do|does|can|could|would|will|when|where|what|how|why|who)\b/i.test(messageText);
            
            // Extract entities
            const entities = this.extractEntities(messageText);
            
            return {
                intent: nlpResult.intent,
                confidence: nlpResult.score,
                sentiment: {
                    score: sentimentResult.score,
                    comparative: sentimentResult.comparative,
                    positive: sentimentResult.positive,
                    negative: sentimentResult.negative
                },
                isQuestion,
                entities,
                messageType: this.categorizeMessage(messageText, sentimentResult),
                urgency: this.assessUrgency(messageText)
            };
        } catch (error) {
            console.error('Error analyzing message:', error);
            
            // Fallback analysis with basic question detection
            const isQuestion = messageText.includes('?') || 
                             /\b(are|is|do|does|can|could|would|will|when|where|what|how|why|who)\b/i.test(messageText);
            
            return {
                intent: 'unknown',
                confidence: 0.5,
                sentiment: { score: 0 },
                isQuestion,
                entities: {},
                messageType: 'general',
                urgency: 'normal'
            };
        }
    }

    extractEntities(text) {
        const doc = compromise(text);
        
        return {
            times: doc.times().out('array'),
            places: doc.places().out('array'),
            people: doc.people().out('array'),
            dates: doc.dates().out('array'),
            money: doc.money().out('array')
        };
    }

    categorizeMessage(text, sentiment) {
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes('urgent') || lowerText.includes('asap') || lowerText.includes('emergency')) {
            return 'urgent';
        } else if (lowerText.includes('meeting') || lowerText.includes('appointment') || lowerText.includes('schedule')) {
            return 'scheduling';
        } else if (lowerText.includes('lunch') || lowerText.includes('dinner') || lowerText.includes('coffee')) {
            return 'social';
        } else if (lowerText.includes('work') || lowerText.includes('project') || lowerText.includes('deadline')) {
            return 'professional';
        } else if (sentiment.score > 2) {
            return 'positive';
        } else if (sentiment.score < -2) {
            return 'negative';
        } else {
            return 'general';
        }
    }

    assessUrgency(text) {
        const urgentKeywords = ['urgent', 'asap', 'emergency', 'immediately', 'now', 'quickly'];
        const lowerText = text.toLowerCase();
        
        for (const keyword of urgentKeywords) {
            if (lowerText.includes(keyword)) {
                return 'high';
            }
        }
        
        if (text.includes('?') || text.includes('when') || text.includes('what time')) {
            return 'medium';
        }
        
        return 'normal';
    }

    async generateContextualReplies(analysis, context) {
        const replies = [];
        
        // Intent-based replies
        if (analysis.intent && analysis.intent !== 'None') {
            const nlpReplies = await this.nlpManager.process('en', context.recentMessages[context.recentMessages.length - 1].text);
            if (nlpReplies.answer) {
                replies.push(nlpReplies.answer);
            }
        }
        
        // Context-aware replies based on message type
        switch (analysis.messageType) {
            case 'urgent':
                replies.push('I\'ll take care of this right away');
                replies.push('On it now!');
                break;
                
            case 'scheduling':
                replies.push('Let me check my calendar');
                replies.push('What time works best for you?');
                replies.push('I\'m free most of the day');
                break;
                
            case 'social':
                replies.push('Sounds great!');
                replies.push('I\'d love to');
                replies.push('Count me in');
                break;
                
            case 'professional':
                replies.push('I\'ll review this and get back to you');
                replies.push('Thanks for the update');
                replies.push('Let me know if you need anything else');
                break;
                
            case 'positive':
                replies.push('That\'s awesome!');
                replies.push('So happy to hear that');
                replies.push('Fantastic news!');
                break;
                
            case 'negative':
                replies.push('I\'m sorry to hear that');
                replies.push('Is there anything I can do to help?');
                replies.push('That sounds frustrating');
                break;
                
            default:
                if (analysis.isQuestion) {
                    replies.push('Good question, let me think about it');
                    replies.push('I\'ll get back to you on that');
                } else {
                    replies.push('Thanks for letting me know');
                    replies.push('Got it');
                }
        }
        
        // Sentiment-based replies
        if (analysis.sentiment.score > 0) {
            replies.push('Glad to hear it!');
        } else if (analysis.sentiment.score < 0) {
            replies.push('Hope things get better');
        }
        
        // Remove duplicates and limit to 6 options
        const uniqueReplies = [...new Set(replies)];
        return uniqueReplies.slice(0, 6);
    }

    personalizeReplies(replies, userStyle, conversation) {
        if (!userStyle) {
            return replies.slice(0, 4);
        }
        
        let personalizedReplies = replies.map(reply => {
            switch (userStyle.style) {
                case 'professional':
                    return this.makeProfessional(reply);
                case 'casual':
                    return this.makeCasual(reply);
                case 'friendly':
                    return this.makeFriendly(reply);
                default:
                    return reply;
            }
        });
        
        // Add relationship-specific personalization
        personalizedReplies = this.addRelationshipContext(personalizedReplies, conversation);
        
        return personalizedReplies.slice(0, 4);
    }

    makeProfessional(reply) {
        const professionalMappings = {
            'sounds great': 'That sounds excellent',
            'awesome': 'Perfect',
            'cool': 'Understood',
            'yeah': 'Yes',
            'yep': 'Certainly',
            'ok': 'Very well'
        };
        
        let professional = reply;
        for (const [casual, formal] of Object.entries(professionalMappings)) {
            professional = professional.replace(new RegExp(casual, 'gi'), formal);
        }
        
        // Ensure proper punctuation
        if (!professional.match(/[.!?]$/)) {
            professional += '.';
        }
        
        return professional;
    }

    makeCasual(reply) {
        const casualMappings = {
            'certainly': 'sure',
            'excellent': 'great',
            'perfect': 'awesome',
            'very well': 'ok'
        };
        
        let casual = reply;
        for (const [formal, relaxed] of Object.entries(casualMappings)) {
            casual = casual.replace(new RegExp(formal, 'gi'), relaxed);
        }
        
        // Remove excessive punctuation
        casual = casual.replace(/\.+$/, '');
        
        return casual;
    }

    makeFriendly(reply) {
        const friendlyAdditions = ['😊', '!', ' 😄'];
        const addition = friendlyAdditions[Math.floor(Math.random() * friendlyAdditions.length)];
        
        return reply + addition;
    }

    addRelationshipContext(replies, conversation) {
        // This would analyze conversation history to understand relationship dynamics
        // For now, just return the replies as-is
        return replies;
    }

    learnFromUserResponse(selectedReply, suggestedReplies, context) {
        const userId = context.conversation?.id || 'default';
        
        if (!this.userPatterns.has(userId)) {
            this.userPatterns.set(userId, {
                preferredStyle: null,
                commonPhrases: [],
                responsePatterns: [],
                selectedReplies: []
            });
        }
        
        const userPattern = this.userPatterns.get(userId);
        userPattern.selectedReplies.push({
            selected: selectedReply,
            options: suggestedReplies,
            context: context,
            timestamp: new Date()
        });
        
        // Analyze patterns
        this.analyzeUserPatterns(userId);
        
        // Store for future use
        this.userPatterns.set(userId, userPattern);
    }

    analyzeUserPatterns(userId) {
        const pattern = this.userPatterns.get(userId);
        if (!pattern || pattern.selectedReplies.length < 3) {
            return;
        }
        
        // Analyze style preferences
        const replyLengths = pattern.selectedReplies.map(r => r.selected.length);
        const avgLength = replyLengths.reduce((a, b) => a + b, 0) / replyLengths.length;
        
        const punctuationCount = pattern.selectedReplies.filter(r => 
            r.selected.match(/[.!?]$/)
        ).length;
        
        const casualWords = pattern.selectedReplies.filter(r =>
            r.selected.match(/\b(yeah|yep|ok|cool|awesome|lol)\b/i)
        ).length;
        
        // Determine preferred style
        if (punctuationCount / pattern.selectedReplies.length > 0.8 && avgLength > 20) {
            pattern.preferredStyle = 'professional';
        } else if (casualWords / pattern.selectedReplies.length > 0.3) {
            pattern.preferredStyle = 'casual';
        } else {
            pattern.preferredStyle = 'friendly';
        }
    }

    getDefaultReplies() {
        return {
            replies: [
                'Sounds good!',
                'Let me think about it',
                'I\'ll get back to you soon',
                'Thanks for letting me know'
            ],
            confidence: 0.5,
            context: 'default'
        };
    }

    shouldElevateToUser(analysis, context) {
        // Determine if the message requires user attention
        const elevationTriggers = [
            analysis.urgency === 'high',
            analysis.sentiment.score < -3, // Very negative sentiment
            analysis.messageType === 'urgent',
            context.conversation?.name?.toLowerCase().includes('boss'),
            context.conversation?.name?.toLowerCase().includes('manager')
        ];
        
        return elevationTriggers.some(trigger => trigger);
    }
}

module.exports = AIResponseGenerator;