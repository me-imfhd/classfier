import { Token } from "./Token.types";

export interface Trade {
    inputToken: Token;
    outputToken: Token;
    tradeDetails: TradeDetails;
}

interface TradeDetails {
    amount: number;
    slippage: number;
    swapIntetion: "SpendInput" | "ReceiveOutput";
}