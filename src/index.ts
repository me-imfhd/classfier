import { LLMService } from "./llm";
import { IntentClassification } from "./schema/IntentClassification.types";
import INTENT_CLASSIFICATION_SCHEMA from "./schema/IntentClassification.json";
import dotenv from "dotenv";
import { TokenIntentHandler } from "./tokenIntentHandlers";
import { Token } from "./schema/Token.types";
dotenv.config();

async function classifyMessage(
  message: string,
  llmService: LLMService
): Promise<IntentClassification> {
  const prompt = `
    Analyze the following message and extract intent and details:
    "${message}"
    
    Classify into one of these categories:
    1. Greeting
    2. Token-related query, with possible intents:
       - Price
       - Trade
       - TrendingTokens
       - Market
       - Info

    For token-related queries, always wrap token identifiers in $ signs.
    Examples:
    "What's the price of ETH?" -> { "intent_type": "TokenIntent", "token_intent": { "context": "User wants to know the price of $ETH$", "intent_type": "Price" }}
    "I want to swap 1 BTC for USDT" -> { "intent_type": "TokenIntent", "token_intent": { "context": "User wants to swap 1 $BTC$ for $USDT$", "intent_type": "Trade" }}
    "Tell me about DOGE" -> { "intent_type": "TokenIntent", "token_intent": { "context": "User wants to know about $DOGE$", "intent_type": "Info" }}
    "Show me trending coins" -> { "intent_type": "TokenIntent", "token_intent": { "context": "User wants to know about trending coins", "intent_type": "TrendingTokens" }}
    "How is the BNB market?" -> { "intent_type": "TokenIntent", "token_intent": { "context": "User wants to know about the market of $BNB$", "intent_type": "Market" }}
  `;
  return await llmService.getLLMResponse<IntentClassification>(
    prompt,
    JSON.stringify(INTENT_CLASSIFICATION_SCHEMA)
  );
}
// Usage example
async function example() {
  const llmService = new LLMService();

  const messages = [
    "Good morning!",
    "What's the price of SOL?",
    "I want to swap 1.5 SOL for USDC with 0.5% slippage",
    "Tell me more about the BONK token",
    "Explain me this transaction: 2BLotupGsWXw9mirXF5RaskzzDRT6wL72RPn2sr7bvQK7pgbrgGe4867Aqj29ZhBDXV8h7p9BWCuFUd7g7trk6xy",
  ];

  for (const message of messages) {
    console.log(`Message: "${message}"`);
    const classification = await classifyMessage(message, llmService);
    console.log("---");
    if (classification.intent_type === "TokenIntent") {
      const tokenIntentHandler = new TokenIntentHandler(
        llmService,
        allSupportedTokens,
        trendingTokens
      );
      const result = await tokenIntentHandler.handleTokenIntent(classification);
      console.log("Resolved Intent:", result);
    } else if (classification.intent_type === "Greeting") {
      console.log("Found Greeting:", classification.intent_type);
    } else if (classification.intent_type === "General") {
      console.log("Found General:", classification.intent_type);
    } else if (classification.intent_type === "ExplainTransactionIntent") {
      console.log("Found ExplainTransactionIntent:", classification.transaction_hash);
    } else {
      console.log("Found Unknown:", classification.intent_type);
    }
  }
}
const allSupportedTokens: Token[] = [
  {
    address: "So11111111111111111111111111111111111111112",
    name: "Wrapped SOL",
    symbol: "SOL",
  },
  {
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    name: "USD Coin",
    symbol: "USDC",
  },
  {
    address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    name: "BONK",
    symbol: "BONK",
  },
];
const trendingTokens: Token[] = [
  {
    address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    name: "BONK",
    symbol: "BONK",
  },
];
example();
