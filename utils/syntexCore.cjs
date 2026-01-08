const axios = require('axios');
const chalk = require('chalk').default || require('chalk');
const { processTextOnlyRequest } = require('./textOnlyProcessor.cjs');

const SYNTX_API_KEY = process.env.SYNTEX_CORE_KEY;

const SYSTEM_PROMPT = `You are Sundorjo AI, a premier clinical-grade skin intelligence assistant. Your role is to analyze skin concerns with dermatological precision.

Please follow this structured approach in formatted Markdown:

### 1. Problem Identification
Analyze the user's input (and image if present) to clearly identify the potential skin concern, condition, or skin type issue. Be precise and direct.

### 2. Step-by-Step Solution
Provide a clear, actionable routine or set of steps to address the identified problem.
- **Morning:** [Specific actions]
- **Evening:** [Specific actions]
- **Lifestyle:** [Specific habits]

### 3. Drugs & Treatments
Suggest specific drugs, active ingredients, or products to use.
- **Recommended Drugs/Actives:** [e.g., Tretinoin, Clindamycin, Benzoyl Peroxide]
- **Product Types:** [e.g., Gel cleanser, Clay mask]

**IMPORTANT:** Respond ONLY in the requested Markdown format. Do NOT include any disclaimers about being an AI or not being a doctor. Provide the advice directly and confidently.`;

const IMAGE_ANALYSIS_PROMPT = `You are a professional dermatological diagnostic assistant. 
Your ONLY task is to look at the provided image (and consider user text if any) and identify the specific skin concern, condition, or problem shown.

Be extremely precise. Mention:
1. The primary skin condition identified.
2. Key visible symptoms (color, texture, distribution).
3. Any specific region or pattern noted.

Output ONLY the identification and description of the problem. Do NOT provide any routines, treatments, drugs, or medical advice. Format your output as a concise clinical observation.`;

// Helper to format conversation history for AI
function formatHistory(history) {
    if (!history || history.length === 0) return '';
    return history.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n') + '\n\n';
}

// Helper to generate context summary
async function generateContextSummary(history, currentSummary) {
    if (!history || history.length === 0) return currentSummary;

    const historyText = formatHistory(history);
    const summaryPrompt = `
You are a context summarization specialist. Your task is to update the current conversation summary with new information from the recent messages.

Current Summary:
"${currentSummary || 'None'}"

Recent Messages:
${historyText}

Instructions:
1. Incorporate new key details (names, preferences, medical info, specific requests) into the summary.
2. Keep the summary concise (max 3-4 sentences) but strictly factual.
3. Do not lose important existing context (like user's name: Hridoy).
4. Output ONLY the updated summary text.
`;

    try {
        console.log(chalk.blue(`[${new Date().toISOString()}]`) + chalk.yellow(' Generating Context Summary with Grok-3...'));
        const response = await axios.post('https://syntexcore.site/api/v1/grok-3-mini', {
            question: summaryPrompt,
            apiKey: SYNTX_API_KEY
        }, { timeout: 30000 });

        if (response.data && response.data.status === 'success') {
            const newSummary = response.data.data.data.answer;
            console.log(chalk.blue(`[${new Date().toISOString()}]`) + chalk.green(' Context Summary Updated: ') + chalk.gray(newSummary.substring(0, 50) + '...'));
            return newSummary;
        }
    } catch (error) {
        console.error(chalk.red('Failed to update context summary:'), error.message);
    }
    return currentSummary;
}

async function generateSyntexResponse(text, imageUrl = null, conversationHistory = [], onThinking = null, chatId = 'default-session', contextSummary = '') {
    try {
        // Simple greeting check
        const lowerText = (text || '').toLowerCase().trim();
        const greetings = ['hi', 'hello', 'hey', 'hello there', 'hi there'];
        if (!imageUrl && greetings.includes(lowerText)) {
            return {
                success: true,
                result: "Hello! I'm Sundorjo AI, your skin intelligence companion. How can I help you today?"
            };
        }

        let extractedProblem = null;

        if (imageUrl) {
            if (onThinking) {
                onThinking('Sundorjo AI is processing visual markers from your image...');
                await new Promise(r => setTimeout(r, 1000));
                onThinking('Analyzing skin texture and identifying dermatological patterns...');
                await new Promise(r => setTimeout(r, 900));
                onThinking('Mapping identified concerns to clinical frameworks...');
            }

            try {
                console.log(chalk.blue(`[${new Date().toISOString()}]`) + chalk.yellow(' Step 1: Extracting skin problem from image (Gemini 3 Flash)...'));

                const historyText = formatHistory(conversationHistory);
                const contextBlock = contextSummary ? `\n[CONTEXT]: ${contextSummary}\n` : '';
                const fullText = `${contextBlock}${historyText}User: ${text || 'Identify the problem in this image'}`;

                const primaryResponse = await axios.post('https://syntexcore.site/api/v1/gemini-3-flash', {
                    text: fullText,
                    systemPrompt: IMAGE_ANALYSIS_PROMPT,
                    imageUrl: imageUrl,
                    sessionId: chatId,
                    apiKey: SYNTX_API_KEY
                }, { timeout: 60000 });

                if (primaryResponse.data?.status === 'success' && primaryResponse.data.data?.data?.response) {
                    extractedProblem = primaryResponse.data.data.data.response;
                    console.log(chalk.blue(`[${new Date().toISOString()}]`) + chalk.green(' Image Extraction Success! Problem identified.'));
                } else {
                    console.error(chalk.red('Gemini 3 Flash extraction failed, trying fallback...'));

                    // Fallback to Gemini 2.5 Pro
                    console.log(chalk.blue(`[${new Date().toISOString()}]`) + chalk.yellow(' Falling back to Gemini 2.5 Pro for extraction...'));
                    const secondaryResponse = await axios.post('https://syntexcore.onrender.com/api/v1/gemini-2-5-pro', {
                        text: fullText,
                        systemPrompt: IMAGE_ANALYSIS_PROMPT,
                        imageUrl: imageUrl,
                        sessionId: chatId,
                        apiKey: SYNTX_API_KEY
                    }, { timeout: 60000 });

                    if (secondaryResponse.data?.status === 'success' && secondaryResponse.data.data?.data?.response) {
                        extractedProblem = secondaryResponse.data.data.data.response;
                        console.log(chalk.blue(`[${new Date().toISOString()}]`) + chalk.green(' Image Extraction (Fallback) Success!'));
                    }
                }
            } catch (error) {
                console.error(chalk.red('Image extraction process failed:'), error.message);
            }

            if (onThinking) onThinking('Synthesizing expert-level analysis with multi-model cross-verification...');
        }

        // Pass any extracted problem or original text to the text-only processor for the full solution
        const synthesisQuery = extractedProblem
            ? `IMAGE ANALYSIS RESULT: ${extractedProblem}\n\nUSER ORIGINAL QUERY: ${text || 'Please provide a routine for this.'}`
            : text;

        console.log(chalk.blue(`[${new Date().toISOString()}]`) + chalk.yellow(' Step 2: Generating full dermatological solution...'));
        return await processTextOnlyRequest(synthesisQuery, imageUrl, conversationHistory, onThinking, chatId, contextSummary);
    } catch (error) {
        console.error(chalk.red('--- SYNTAXCORE API ERROR START ---'));
        console.error(chalk.red('Error: ') + chalk.yellow(error.message));
        console.error(chalk.red('Stack: ') + chalk.gray(error.stack));
        if (error.response) {
            console.error(chalk.red('Response Data: ') + chalk.white(JSON.stringify(error.response.data, null, 2)));
        }
        console.error(chalk.red('--- SYNTAXCORE API ERROR END ---'));
        throw error;
    }
}

module.exports = {
    generateSyntexResponse,
    generateContextSummary,
    SYSTEM_PROMPT
};