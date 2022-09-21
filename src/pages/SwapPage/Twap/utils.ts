import { TimeSelectFormat, TwapTimeSelect } from 'state/twap/reducer';
import { TransactionDataType, TxStatus } from './types';

export const timeToMilliseconds = (
  type: TimeSelectFormat,
  value?: string,
): number | undefined => {
  if (!value) {
    return undefined;
  }

  const parsed = parseFloat(value);

  let result;
  switch (type) {
    case TimeSelectFormat.MINUTES:
      result = parsed * 60000;
      break;
    case TimeSelectFormat.HOURS:
      result = parsed * 60 * 60 * 1000;
      break;
    case TimeSelectFormat.DAYS:
      result = parsed * 60 * 60 * 1000 * 24;
      break;
    default:
      return undefined;
  }

  return result;
};

export const getFormatTypeFromMilliseconds = (milliseconds: number) => {
  const MAX_MINUTES = 3.54e6;
  const MAX_NOURS = 86400000;

  if (milliseconds <= MAX_MINUTES) {
    return TimeSelectFormat.MINUTES;
  }
  if (milliseconds > MAX_MINUTES && milliseconds < MAX_NOURS) {
    return TimeSelectFormat.HOURS;
  }
  return TimeSelectFormat.DAYS;
};

export const millisecondsToTime = (
  type: TimeSelectFormat,
  value?: number,
): string | undefined => {
  if (!value) {
    return;
  }
  let result;
  switch (type) {
    case TimeSelectFormat.MINUTES:
      result = value / 60000;
      break;
    case TimeSelectFormat.HOURS:
      result = value / 60 / 60 / 1000;
      break;
    case TimeSelectFormat.DAYS:
      result = value / 60 / 60 / 1000 / 24;
      break;

    default:
      return;
  }
  return parseFloat(result.toFixed(2)).toString();
};

const mod = function(n: number, m: number) {
  const remain = n % m;
  return Math.floor(remain >= 0 ? remain : remain + m);
};

export const createTxData = (): TransactionDataType[] => {
  const status = [
    TxStatus.OPEN,
    TxStatus.CANCELED,
    TxStatus.EXECUTED,
    TxStatus.EXPIRED,
  ];

  return Array.from({ length: 10 }).map((_, i) => {
    return {
      fromTokenId: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
      toTokenId: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      operationType: 'sell',
      fromTokenAmount: 10,
      toTokenAmount: 0.005,
      currencyPrice: 2000,
      executionPrice: 1990,
      minimumReceived: 500,
      expiryDate: new Date().getTime() - 1000,
      status: status[mod(i, status.length)],
      totalChunks: 10,
      finishedChunks: 2,
      lastFilled: 10,
      interval: 20,
    };
  });
};

export const mapTxData = (
  data: TransactionDataType[],
): { [key: string]: TransactionDataType[] } => {
  const obj: { [key: string]: TransactionDataType[] } = {
    [TxStatus.OPEN]: [],
    [TxStatus.CANCELED]: [],
    [TxStatus.EXPIRED]: [],
    [TxStatus.EXECUTED]: [],
  };
  for (const element of data) {
    const statuses = obj[element.status];
    if (statuses) {
      obj[element.status] = [...statuses, element];
    }
  }
  return obj;
};

export const emptyOrdersText = {
  [TxStatus.OPEN]: 'No open orders',
  [TxStatus.CANCELED]: 'No canceled orders',
  [TxStatus.EXECUTED]: 'No executed orders',
  [TxStatus.EXPIRED]: 'No expired orders',
};
