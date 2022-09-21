import { createReducer } from '@reduxjs/toolkit';
import { Currency, CurrencyAmount, Fraction } from '@uniswap/sdk';
import { BigNumber } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';
import moment from 'moment';
import { MINUTE } from 'pages/SwapPage/Twap/consts';
import {
  getFormatTypeFromMilliseconds,
  millisecondsToTime,
} from 'pages/SwapPage/Twap/utils';

import {
  Field,
  replaceTwapState,
  resetTwapData,
  selectCurrency,
  setAllowLimitPrice,
  setChunkSize,
  setDuration,
  setError,
  setInterval,
  setInvertLimitPriceCurrencies,
  setInvertLimitPriceValue,
  setPrice,
  setRecipient,
  setSelfEdit,
  setWrapDone,
  switchCurrencies,
  typeInput,
  updateDeadline,
} from './actions';
import { tryParseAmount } from './hooks';
import { ceilDiv, durationPlusChunkSize, durationPlusInterval } from './utils';

export enum TimeSelectFormat {
  DAYS,
  HOURS,
  MINUTES,
}

export enum TwapChunkTyped {
  DURATION,
  CHUNK,
  INTERVAL,
}

export type TwapTimeSelect = {
  type: TimeSelectFormat;
  milliseconds?: number;
  displayValue?: string;
};

export interface TwapState {
  readonly independentField: Field;
  readonly typedValue: string;
  readonly [Field.INPUT]: {
    readonly currencyId: string | undefined;
  };
  readonly [Field.OUTPUT]: {
    readonly currencyId: string | undefined;
  };
  // the typed recipient address or ENS name, or null if swap should go to sender
  readonly recipient: string | null;
  price: string | undefined;
  priceAsCurrencyAmount?: Fraction;
  typedPrice: boolean;
  duration: TwapTimeSelect;
  interval: TwapTimeSelect;
  chunkSize?: string;
  totalChunks?: string;
  error?: string;
  allowLimitPrice?: boolean;
  selfEdit?: boolean;
  invertLimitPriceValue?: boolean;
  inputCurrency?: Currency;
  deadline?: number;
}

const initialState: TwapState = {
  independentField: Field.INPUT,
  typedValue: '',
  [Field.INPUT]: {
    currencyId: '',
  },
  [Field.OUTPUT]: {
    currencyId: '',
  },
  recipient: null,
  price: undefined,
  typedPrice: false,
  duration: {
    type: TimeSelectFormat.MINUTES,
  },
  interval: {
    type: TimeSelectFormat.MINUTES,
  },
  allowLimitPrice: false,
};

export default createReducer<TwapState>(initialState, (builder) =>
  builder
    .addCase(setError, (state, { payload }) => {
      state.error = payload;
    })
    .addCase(
      replaceTwapState,
      (
        state,
        {
          payload: {
            typedValue,
            recipient,
            field,
            inputCurrencyId,
            outputCurrencyId,
          },
        },
      ) => {
        return {
          [Field.INPUT]: {
            currencyId: inputCurrencyId,
          },
          [Field.OUTPUT]: {
            currencyId: outputCurrencyId,
          },
          independentField: field,
          typedValue: typedValue,
          recipient,
          price: undefined,
          typedPrice: false,
          duration: {
            type: TimeSelectFormat.MINUTES,
          },
          interval: {
            type: TimeSelectFormat.MINUTES,
          },
        };
      },
    )
    .addCase(selectCurrency, (state, { payload: { currencyId, field } }) => {
      const otherField = field === Field.INPUT ? Field.OUTPUT : Field.INPUT;
      if (currencyId === state[otherField].currencyId) {
        // the case where we have to swap the order
        return {
          ...state,
          independentField:
            state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
          [field]: { currencyId: currencyId },
          [otherField]: { currencyId: state[field].currencyId },
        };
      } else {
        // the normal case
        return {
          ...state,
          [field]: { currencyId: currencyId },
        };
      }
    })
    .addCase(switchCurrencies, (state) => {
      return {
        ...state,
        independentField: Field.INPUT,
        [Field.INPUT]: { currencyId: state[Field.OUTPUT].currencyId },
        [Field.OUTPUT]: { currencyId: state[Field.INPUT].currencyId },
        totalChunks: undefined,
        chunkSize: undefined,
        duration: {
          type: TimeSelectFormat.MINUTES,
        },
        interval: {
          type: TimeSelectFormat.MINUTES,
        },
        price: undefined,
        allowLimitPrice: false,
        selfEdit: false,
        typedValue: '',
      };
    })
    .addCase(typeInput, (state, { payload: { inputCurrency, typedValue } }) => {
      state.chunkSize = undefined;
      state.totalChunks = undefined;
      state.interval = {
        type: TimeSelectFormat.MINUTES,
      };

      state.inputCurrency = inputCurrency;
      state.typedValue = typedValue;
      state.typedPrice = false;
    })

    .addCase(setPrice, (state, { payload }) => {
      return {
        ...state,
        price: payload.price,
        typedPrice: true,
        priceAsCurrencyAmount: payload.formattedPrice,
      };
    })

    .addCase(updateDeadline, (state) => {
      state.deadline = moment()
        .add(state.duration.milliseconds, 'milliseconds')
        .valueOf();
    })

    .addCase(setDuration, (state, { payload }) => {
      state.duration = payload;
      state.deadline = moment()
        .add(payload.milliseconds, 'milliseconds')
        .valueOf();

      if (!payload.milliseconds || !state.typedValue) {
        return;
      }

      if (state.selfEdit) {
        return;
      }

      if (!state.inputCurrency) {
        return;
      }

      if (state.chunkSize) {
        const { totalChunks, interval } = durationPlusChunkSize({
          durationMilliseconds: payload.milliseconds,
          decimals: state.inputCurrency?.decimals,
          inputValue: state.typedValue,
          chunkSize: state.chunkSize,
        });
        state.totalChunks = totalChunks;
        state.interval = interval;
      } else if (state.interval.milliseconds) {
        const { totalChunks, chunkSize } = durationPlusInterval({
          durationMilliseconds: payload.milliseconds,
          intervalMilliseconds: state.interval.milliseconds,
          inputValue: state.typedValue,
          decimals: state.inputCurrency?.decimals,
        });

        state.totalChunks = totalChunks;
        state.chunkSize = chunkSize;
      }

      // if(chunk size)  chunk size / duration,  else interval / duration
    })
    .addCase(setInterval, (state, { payload }) => {
      state.interval = payload;
      if (!payload.milliseconds) {
        if (!state.selfEdit) {
          state.chunkSize = undefined;
          state.totalChunks = undefined;
        }
        return;
      }

      if (!state.typedValue || !state.inputCurrency) {
        return;
      }

      if (state.duration.milliseconds && !state.selfEdit) {
        const { totalChunks, chunkSize } = durationPlusInterval({
          durationMilliseconds: state.duration.milliseconds,
          intervalMilliseconds: payload.milliseconds,
          inputValue: state.typedValue,
          decimals: state.inputCurrency.decimals,
        });
        state.totalChunks = totalChunks;
        state.chunkSize = chunkSize;
      }
      // interval + duration
    })
    .addCase(setChunkSize, (state, { payload }) => {
      state.chunkSize = payload;

      if (!state.typedValue || !state.inputCurrency) {
        return;
      }

      if (!payload || Number(payload) === 0) {
        state.totalChunks = undefined;
        return;
      }

      const chunkSizeAsBN = parseUnits(payload, state.inputCurrency.decimals);
      const typedValueAsBN = parseUnits(
        state.typedValue,
        state.inputCurrency.decimals,
      );

      const totalChunks = ceilDiv(typedValueAsBN, chunkSizeAsBN);
      state.totalChunks = totalChunks.toString();

      if (state.duration.milliseconds && !state.selfEdit) {
        const result = BigNumber.from(state.duration.milliseconds)
          .div(totalChunks.toString())
          .toNumber();

        const milliseconds = result < MINUTE ? MINUTE : result;
        const type = getFormatTypeFromMilliseconds(milliseconds);
        state.interval = {
          milliseconds: milliseconds,
          displayValue: millisecondsToTime(type, milliseconds),
          type,
        };
      }
    })

    .addCase(setRecipient, (state, { payload: { recipient } }) => {
      state.recipient = recipient;
    })
    .addCase(setAllowLimitPrice, (state, { payload }) => {
      state.allowLimitPrice = payload;
      state.price = undefined;
    })
    .addCase(setInvertLimitPriceValue, (state, { payload }) => {
      state.invertLimitPriceValue = payload;

      state.price = state.priceAsCurrencyAmount?.invert().toSignificant(6);
      state.priceAsCurrencyAmount = state.priceAsCurrencyAmount?.invert();
    })
    .addCase(setWrapDone, (state) => {
      // state.chunkSize = undefined;
      // state.totalChunks = undefined;
      // state.totalChunks = undefined;
      state.OUTPUT = {
        currencyId: undefined,
      };
      state.typedValue = '';
      // state.duration = {
      //   type: TimeSelectFormat.MINUTES,
      // };
      // state.interval = {
      //   type: TimeSelectFormat.MINUTES,
      // };
      // state.allowLimitPrice = false;
      // state.price = undefined;
      // state.priceAsCurrencyAmount = undefined;
      // state.invertLimitPriceValue = false;
    })

    .addCase(resetTwapData, (state, { payload }) => {
      state.invertLimitPriceValue = false;
      state.price = undefined;
      state.priceAsCurrencyAmount = undefined;
      state.allowLimitPrice = false;
      state.duration = {
        type: TimeSelectFormat.MINUTES,
      };
      state.interval = {
        type: TimeSelectFormat.MINUTES,
      };

      state.chunkSize = undefined;
      state.totalChunks = undefined;
      state.totalChunks = undefined;
      state.OUTPUT = {
        currencyId: undefined,
      };
      state.typedValue = '';
    })

    .addCase(setSelfEdit, (state, { payload }) => {
      state.selfEdit = payload;
    }),
);
