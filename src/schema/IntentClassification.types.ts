// Intent classification interfaces 
export interface IntentClassification {
  intent_type?: BasicIntent;
  token_intent?: TokenIntent;
  transaction_hash?: string;
}

// Basic intent types
type BasicIntent = 'Greeting' | 'General' | 'Unknown' | 'TokenIntent' | 'ExplainTransactionIntent';

// Intent classification interfaces
export interface TokenIntent {
  context: string;
  intent_type: TokenIntentType;
}

// Token-related intent types
type TokenIntentType = 'Price' | 'Trade' | 'TrendingTokens' | 'Market' | 'Info';