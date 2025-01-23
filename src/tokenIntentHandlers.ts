import { LLMService } from "./llm";
import {
  IntentClassification,
  TokenIntent,
} from "./schema/IntentClassification.types";
import TOKEN_SCHEMA from "./schema/Token.json";
import { Token } from "./schema/Token.types";
import { stringSimilarity } from "string-similarity-js";
import { Trade } from "./schema/Trade.types";
import TRADE_SCHEMA from "./schema/Trade.json";
export class TokenIntentHandler {
  private llmService: LLMService;
  private allSupportedTokens: Token[];
  private trendingTokens: Token[];
  constructor(llmService: LLMService, allSupportedTokens: Token[], trendingTokens: Token[]) {
    this.llmService = llmService;
    this.allSupportedTokens = allSupportedTokens;
    this.trendingTokens = trendingTokens;
  }
  public async handleTokenIntent(classification: IntentClassification) {
    if (
      !classification.intent_type ||
      classification.intent_type !== "TokenIntent" ||
      !classification.token_intent
    ) {
      throw new Error("Classification is not a token intent");
    }
    switch (classification.token_intent?.intent_type) {
      case "Price":
        console.log("Found Price Request:", classification.token_intent);
        return await this.handlePriceIntent(classification.token_intent);
      case "Market":
        console.log("Found Market Request:", classification.token_intent);
        return await this.handleMarketIntent(classification.token_intent);
      case "Info":
        console.log("Found Info Request:", classification.token_intent);
        return await this.handleInfoIntent(classification.token_intent);
      case "Trade":
        console.log("Found Trade Request:", classification.token_intent);
        return await this.handleTradeIntent(classification.token_intent);
      case "TrendingTokens":
        console.log("Found Trending Tokens Request:", classification.token_intent);
        return await this.handleTrendingTokensIntent(classification.token_intent);
      default:
        throw new Error("Invalid intent type");
    }
  }
  public async resolveToken(
    context: string,
  ): Promise<Token | null> {
    const matches = context.match(/\$([^$]+)\$/);
    if (!matches) {
      throw new Error("No token identifier found between $ signs");
    }
    const tokenIdentifier = matches[1];

    // Find matching tokens with similarity score above 0.9
    const tokenMatches = this.allSupportedTokens
      .map((token) => {
        const nameScore = stringSimilarity(tokenIdentifier, token.name);
        const symbolScore = stringSimilarity(tokenIdentifier, token.symbol);
        return {
          token,
          score: Math.max(nameScore, symbolScore),
        };
      })
      .filter((match) => match.score > 0.9)
      .map((match) => match.token);

    if (tokenMatches.length === 0) {
      return null;
    }

    const prompt = `
      Resolve the token for the following context:
      "${context}"
      
      Here are the most similar tokens from our database:
      ${JSON.stringify(tokenMatches, null, 2)}

      Choose the best matching token from these options.
    `;

    return await this.llmService.getLLMResponse<Token>(
      prompt,
      JSON.stringify(TOKEN_SCHEMA)
    );
  }
  private async handlePriceIntent(tokenIntent: TokenIntent): Promise<{token: Token | null, price: number | null}> {
    const token = await this.resolveToken(tokenIntent.context);
    return {
      token,
      price: null,
    }
  }

  private async handleMarketIntent(tokenIntent: TokenIntent): Promise<{token: Token | null, marketData: string | null}> {
    const token = await this.resolveToken(tokenIntent.context);
    return {
      token,
      marketData: null,
    }
  }

  private async handleTrendingTokensIntent(tokenIntent: TokenIntent): Promise<{ trendingTokens: Token[] | null}> {
    return {
      trendingTokens: this.trendingTokens,
    }
  }

  private async handleInfoIntent(tokenIntent: TokenIntent): Promise<{token: Token | null, info: string | null}> {
    const token = await this.resolveToken(tokenIntent.context);
    return {
      token,
      info: null,
    }
  }
  private async resolveTradeDetails(tokenIntent: TokenIntent): Promise<Trade> {
    const matches = tokenIntent.context.match(/\$([^$]+)\$/g);
    if (!matches) {
      throw new Error("No token identifier found between $ signs");
    }
    
    // Get all token identifiers without the $ signs
    const tokenIdentifiers = matches.map(match => match.replace(/\$/g, ''));

    // Find matching tokens with similarity score above 0.9 for each identifier
    const tokenMatches = tokenIdentifiers.flatMap(tokenIdentifier => 
        this.allSupportedTokens
        .map((token) => {
          const nameScore = stringSimilarity(tokenIdentifier, token.name);
          const symbolScore = stringSimilarity(tokenIdentifier, token.symbol);
          return {
            token,
            score: Math.max(nameScore, symbolScore),
          };
        })
        .filter((match) => match.score > 0.9)
          .map((match) => match.token)
    );
    const prompt = `
      Resolve the trade details for the following context:
      "${tokenIntent.context}"

      We only support trading Solana (SOL) and tokens on the Solana blockchain.
      Only tokens from our supported token list are valid.

      Extract the following details:
      - Input token (the token being sold) (Default to SOL or USDC if not specified)
      - Output token (the token being bought) (Default to SOL or USDC if not specified)
      - Amount (Default to 1 if not specified)
      - Slippage (default to 0.25% if not specified)
      - Swap intention (SpendInput if amount is for input token, ReceiveOutput if amount is for output token)

      Example contexts:
      "I want to swap 1.5 SOL for USDC" -> {
        inputToken: {symbol: "SOL", ...},
        outputToken: {symbol: "USDC", ...},
        tradeDetails: {
          amount: 1.5,
          slippage: 0.25,
          swapIntetion: "SpendInput"
        }
      }

      "I want to get 500 USDC for SOL with 0.5% slippage" -> {
        inputToken: {symbol: "SOL", ...},
        outputToken: {symbol: "USDC", ...}, 
        tradeDetails: {
          amount: 500,
          slippage: 0.5,
          swapIntetion: "ReceiveOutput"
        }
      }

      Here are the most similar tokens and supported tokens from our database:
      ${JSON.stringify(tokenMatches, null, 2)}
    `;
    return await this.llmService.getLLMResponse<Trade>(prompt, JSON.stringify(TRADE_SCHEMA));
  }
  private async handleTradeIntent(tokenIntent: TokenIntent): Promise<Trade> {
    const trade = await this.resolveTradeDetails(tokenIntent);
    return trade;
  }
}
