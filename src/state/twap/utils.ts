import { Currency, CurrencyAmount, Fraction, JSBI, Price } from '@uniswap/sdk';
import { BigNumber, BigNumberish, FixedNumber } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';
import { MINUTE } from 'pages/SwapPage/Twap/consts';
import {
  getFormatTypeFromMilliseconds,
  millisecondsToTime,
} from 'pages/SwapPage/Twap/utils';
import { tryParseAmount } from './hooks';

export const ceilDiv = (a: BigNumber, b: BigNumber) =>
  a
    .mul(BigNumber.from(10).pow(18))
    .div(b)
    .add(
      BigNumber.from(10)
        .pow(18)
        .sub(BigNumber.from(1)),
    )
    .div(BigNumber.from(10).pow(18));

type DurationPlusIntervalArgs = {
  durationMilliseconds: number;
  intervalMilliseconds: number;
  inputValue: string;
  decimals: number;
};

export const durationPlusInterval = ({
  durationMilliseconds,
  intervalMilliseconds,
  inputValue,
  decimals,
}: DurationPlusIntervalArgs) => {
  const totalChunks = Math.ceil(durationMilliseconds / intervalMilliseconds);
  const inputValueAsBN = parseUnits(inputValue, decimals);
  return {
    totalChunks: totalChunks.toString(),
    chunkSize: ceilDiv(
      inputValueAsBN,
      parseUnits(totalChunks.toString(), decimals),
    ).toString(),
  };
};

type DurationPlusChunksSizeArgs = {
  chunkSize: string;
  decimals: number;
  inputValue: string;
  durationMilliseconds: number;
};

export const durationPlusChunkSize = ({
  chunkSize,
  durationMilliseconds,
  inputValue,
  decimals,
}: DurationPlusChunksSizeArgs) => {
  const chunkSizeAsBN = parseUnits(chunkSize, decimals);
  const inputValueAsBN = parseUnits(inputValue, decimals);
  const totalChunks = ceilDiv(inputValueAsBN, chunkSizeAsBN);

  const result = BigNumber.from(durationMilliseconds)
    .div(totalChunks.toString())
    .toNumber();
  const milliseconds = result < MINUTE ? MINUTE : result;
  const type = getFormatTypeFromMilliseconds(milliseconds);

  return {
    totalChunks: totalChunks.toString(),
    interval: {
      milliseconds,
      displayValue: millisecondsToTime(type, milliseconds),
      type,
    },
  };
};

export const invalidChunkSize = (
  input?: CurrencyAmount,
  chunkSize?: string,
) => {
  if (!chunkSize || !input) {
    return false;
  }

  return parseUnits(chunkSize, input.currency.decimals).gt(
    parseUnits(input.toExact(), input.currency.decimals),
  );
};

export const togglePriceAmount = (toggle: boolean, price?: string) => {
  if (!price) {
    return '';
  }
  if (!toggle) {
    return price;
  }
  return CurrencyAmount.ether(
    JSBI.BigInt(
      BigNumber.from(parseUnits('1', 18))
        .mul(BigNumber.from(10).pow(18))
        .div(parseUnits(price, 18)),
    ),
  ).toSignificant(6);
};

export const getTokenValue = (usdPrice: Price, amount: CurrencyAmount) => {
  return CurrencyAmount.ether(
    JSBI.BigInt(
      BigNumber.from(parseUnits(usdPrice.toSignificant(), 18))
        .mul(parseUnits(amount.toExact(), 18))
        .div(BigNumber.from(10).pow(18)),
    ),
  ).toSignificant(5);
};

//////

type calculateOutputInputArgs = {
  typedPrice?: boolean;
  typedValue?: string;
  price?: string;
  outputAmount?: Fraction;
  allowLimitPrice?: boolean;
  inputAsCurrencyAmount?: CurrencyAmount;
  priceAsCurrencyAmount?: Fraction;
  invertLimitPriceValue?: boolean;
};

export const calculateOutputInput = ({
  price,
  typedPrice,
  typedValue,
  allowLimitPrice,
  outputAmount,
  inputAsCurrencyAmount,
  priceAsCurrencyAmount,
  invertLimitPriceValue,
}: calculateOutputInputArgs): Fraction | undefined => {
  let typedPriceOutputValue = outputAmount;

  //if removed price

  if (
    typedPrice &&
    Number(price) === 0 &&
    (!price || price === '0' || price.startsWith('0.')) &&
    allowLimitPrice
  ) {
  }
  // if typing price
  else if (typedValue && price && Number(price) > 0 && allowLimitPrice) {
    if (inputAsCurrencyAmount && priceAsCurrencyAmount) {
      typedPriceOutputValue = invertLimitPriceValue
        ? inputAsCurrencyAmount.divide(priceAsCurrencyAmount)
        : inputAsCurrencyAmount.multiply(priceAsCurrencyAmount);

      typedPriceOutputValue;
    }
  }

  return typedPriceOutputValue;
};

export const calculateMarketPrice = (
  inputAsCurrencyAmount?: CurrencyAmount,
  outputAmount?: Fraction,
) => {
  if (outputAmount) {
    return inputAsCurrencyAmount?.divide(outputAmount);
  }
};

type calculateMinAmountOutArgs = {
  allowLimitPrice?: boolean;
  inputAsCurrencyAmount?: CurrencyAmount;
  priceAsCurrencyAmount?: Fraction;
  invertLimitPriceValue?: boolean;
  chunkSize?: string;
  outputCurrency?: Currency;
};

export const calculateMinAmountOut = ({
  allowLimitPrice,
  inputAsCurrencyAmount,
  priceAsCurrencyAmount,
  invertLimitPriceValue,
  chunkSize,
  outputCurrency,
}: calculateMinAmountOutArgs): {
  minimumAmountOut?: BigNumberish;
  minimumAmountOutAsCurrencyAmount?: CurrencyAmount;
} => {
  let minimumAmountOut;
  let minimumAmountOutAsCurrencyAmount;

  if (!allowLimitPrice) {
    minimumAmountOut = '1';
  } else {
    const chunkSizeAsBN =
      Number(chunkSize) > 0 &&
      tryParseAmount(chunkSize, inputAsCurrencyAmount?.currency);

    if (priceAsCurrencyAmount && chunkSizeAsBN) {
      try {
        minimumAmountOut = parseUnits(
          invertLimitPriceValue
            ? chunkSizeAsBN?.divide(priceAsCurrencyAmount).toSignificant(18)
            : chunkSizeAsBN?.multiply(priceAsCurrencyAmount).toSignificant(18),
          outputCurrency?.decimals,
        );

        minimumAmountOutAsCurrencyAmount = tryParseAmount(
          invertLimitPriceValue
            ? chunkSizeAsBN?.divide(priceAsCurrencyAmount).toSignificant(18)
            : chunkSizeAsBN?.multiply(priceAsCurrencyAmount).toSignificant(18),
          outputCurrency,
        );
      } catch (error) {
        minimumAmountOut = parseUnits(
          invertLimitPriceValue
            ? chunkSizeAsBN?.divide(priceAsCurrencyAmount).toFixed(6)
            : chunkSizeAsBN?.multiply(priceAsCurrencyAmount).toFixed(6),
          outputCurrency?.decimals,
        );

        minimumAmountOutAsCurrencyAmount = tryParseAmount(
          invertLimitPriceValue
            ? chunkSizeAsBN?.divide(priceAsCurrencyAmount).toFixed(6)
            : chunkSizeAsBN?.multiply(priceAsCurrencyAmount).toFixed(6),
          outputCurrency,
        );
      }
    }
  }

  return {
    minimumAmountOut,
    minimumAmountOutAsCurrencyAmount,
  };
};
