import { createAction } from '@reduxjs/toolkit';
import { Currency, CurrencyAmount, Fraction } from '@uniswap/sdk';
import { TwapTimeSelect } from './reducer';

export enum Field {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT',
}

export const selectCurrency = createAction<{
  field: Field;
  currencyId: string;
}>('twap/selectCurrency');
export const switchCurrencies = createAction<void>('twap/switchCurrencies');
export const typeInput = createAction<{
  inputCurrency?: Currency;
  typedValue: string;
}>('twap/typeInput');
export const setError = createAction<string | undefined>('twap/setError');

export const setPrice = createAction<{
  price: string | undefined;
  formattedPrice?: Fraction;
}>('twap/setPrice');

export const setAllowLimitPrice = createAction<boolean | undefined>(
  'twap/setAllowLimitPrice',
);

export const setSelfEdit = createAction<boolean | undefined>(
  'twap/setSelfEdit',
);

export const setInvertLimitPriceValue = createAction<boolean | undefined>(
  'twap/setInvertLimitPriceValue',
);

export const setInvertLimitPriceCurrencies = createAction<boolean | undefined>(
  'twap/setInvertLimitPriceCurrencies',
);

export const setDuration = createAction<TwapTimeSelect>('twap/setDuration');

export const setInterval = createAction<TwapTimeSelect>('twap/setInterval');
export const setChunkSize = createAction<string | undefined>(
  'twap/setChunkSize',
);

export const setWrapDone = createAction('twap/setWrapDone');
export const resetTwapData = createAction('twap/resetTwapData');
export const updateDeadline = createAction('twap/updateDeadline');

export const reversePrice = createAction<boolean>('twap/reversePrice');

export const replaceTwapState = createAction<{
  field: Field;
  typedValue: string;
  inputCurrencyId?: string;
  outputCurrencyId?: string;
  recipient: string | null;
  price: string | undefined;
}>('twap/replaceTwapState');
export const setRecipient = createAction<{ recipient: string | null }>(
  'twap/setRecipient',
);
