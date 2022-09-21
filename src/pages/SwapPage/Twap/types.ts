export type TransactionDataType = {
  fromTokenId: string;
  toTokenId: string;
  operationType: string;
  fromTokenAmount: number;
  toTokenAmount: number;
  currencyPrice: number;
  executionPrice: number;
  minimumReceived: number;
  expiryDate: number;
  status: TxStatus;
  totalChunks: number;
  finishedChunks: number;
  lastFilled: number;
  interval: number;
};

export enum TxStatus {
  OPEN = 'open',
  CANCELED = 'canceled',
  EXECUTED = 'excuted',
  EXPIRED = 'expired',
}
