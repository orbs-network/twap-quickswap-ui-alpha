//import useENS from 'hooks/useENS';
import { parseUnits } from '@ethersproject/units';
import {
  Currency,
  CurrencyAmount,
  ETHER,
  Fraction,
  JSBI,
  Price,
  Token,
  TokenAmount,
  Trade,
} from '@uniswap/sdk';
import { ParsedQs } from 'qs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useActiveWeb3React } from 'hooks';
import { useCurrency } from 'hooks/Tokens';
import { useAllCommonPairs } from 'hooks/Trades';
import useParsedQueryString from 'hooks/useParsedQueryString';
import { isAddress } from 'utils';
import { AppDispatch, AppState } from 'state';
import { useCurrencyBalances } from 'state/wallet/hooks';
import {
  Field,
  replaceTwapState,
  resetTwapData,
  selectCurrency,
  setChunkSize,
  setDuration,
  setInterval,
  setRecipient,
  setWrapDone,
  switchCurrencies,
  typeInput,
} from './actions';
import { TwapTimeSelect, TwapState, TimeSelectFormat } from './reducer';
import { computeSlippageAdjustedAmounts } from 'utils/prices';
import {
  calculateMarketPrice,
  calculateMinAmountOut,
  calculateOutputInput,
} from './utils';
import useUSDCPrice from 'utils/useUSDCPrice';
import { BigNumberish } from 'ethers';

export function useTwapState(): AppState['twap'] {
  return useSelector<AppState, AppState['twap']>((state) => state.twap);
}

export function useTwapActionHandlers(): {
  onCurrencySelection: (field: Field, currency: Currency) => void;
  onSwitchTokens: () => void;
  onUserInput: (typedValue: string) => void;
  onChangeRecipient: (recipient: string | null) => void;
  onChunkSize: (value?: string) => void;
  onDuration: (value: TwapTimeSelect) => void;
  onInterval: (value: TwapTimeSelect) => void;
  onWrapDone: () => void;
  onTwapTxDone: () => void;
} {
  const dispatch = useDispatch<AppDispatch>();
  const currencies = useDerivedTwapInfo().currencies;

  const onCurrencySelection = useCallback(
    (field: Field, currency: Currency) => {
      dispatch(
        selectCurrency({
          field,
          currencyId:
            currency instanceof Token
              ? currency.address
              : currency === ETHER
              ? 'ETH'
              : '',
        }),
      );
    },
    [dispatch],
  );

  const onSwitchTokens = useCallback(() => {
    dispatch(switchCurrencies());
  }, [dispatch]);

  const onUserInput = useCallback(
    (typedValue: string) => {
      dispatch(
        typeInput({ inputCurrency: currencies[Field.INPUT], typedValue }),
      );
    },
    [dispatch, currencies],
  );

  const onChunkSize = useCallback(
    (value?: string) => {
      dispatch(setChunkSize(value));
    },
    [dispatch],
  );

  const onWrapDone = useCallback(() => {
    dispatch(setWrapDone());
  }, [dispatch]);

  const onDuration = useCallback(
    (value: TwapTimeSelect) => {
      dispatch(setDuration(value));
    },
    [dispatch],
  );

  const onInterval = useCallback(
    (value: TwapTimeSelect) => {
      dispatch(setInterval(value));
    },
    [dispatch],
  );

  const onChangeRecipient = useCallback(
    (recipient: string | null) => {
      dispatch(setRecipient({ recipient }));
    },
    [dispatch],
  );

  const onTwapTxDone = useCallback(() => {
    dispatch(resetTwapData());
  }, [dispatch]);

  return {
    onSwitchTokens,
    onCurrencySelection,
    onUserInput,
    onChangeRecipient,
    onChunkSize,
    onDuration,
    onInterval,
    onWrapDone,
    onTwapTxDone,
  };
}

// try to parse a user entered amount for a given token
export function tryParseAmount(
  value?: string,
  currency?: Currency,
): CurrencyAmount | undefined {
  if (!value || !currency) {
    return undefined;
  }
  try {
    const typedValueParsed = parseUnits(value, currency.decimals).toString();
    if (typedValueParsed !== '0') {
      return currency instanceof Token
        ? new TokenAmount(currency, JSBI.BigInt(typedValueParsed))
        : CurrencyAmount.ether(JSBI.BigInt(typedValueParsed));
    }
  } catch (error) {
    // should fail if the user specifies too many decimal places of precision (or maybe exceed max uint?)
    console.debug(`Failed to parse input amount: "${value}"`, error);
  }
  // necessary for all paths to return a value
  return undefined;
}

const BAD_RECIPIENT_ADDRESSES: string[] = [
  '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f', // v2 factory
  '0xf164fC0Ec4E93095b804a4795bBe1e041497b92a', // v2 router 01
  '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // v2 router 02
];

/**
 * Returns true if any of the pairs or tokens in a trade have the given checksummed address
 * @param trade to check for the given address
 * @param checksummedAddress address to check in the pairs and tokens
 */
function involvesAddress(trade: Trade, checksummedAddress: string): boolean {
  return (
    trade.route.path.some((token) => token.address === checksummedAddress) ||
    trade.route.pairs.some(
      (pair) => pair.liquidityToken.address === checksummedAddress,
    )
  );
}

// from the current swap inputs, compute the best trade and return it.
export function useDerivedTwapInfo(): {
  currencies: { [field in Field]?: Currency };
  currencyBalances: { [field in Field]?: CurrencyAmount };
  parsedAmount: CurrencyAmount | undefined;
  inputError?: string;
  typedPriceOutputValue?: Fraction;
  marketPrice?: Fraction;
  minimumAmountOut?: BigNumberish;
  minimumAmountOutAsCurrencyAmount?: CurrencyAmount;
} {
  const { account } = useActiveWeb3React();

  const {
    typedValue,
    [Field.INPUT]: { currencyId: inputCurrencyId },
    [Field.OUTPUT]: { currencyId: outputCurrencyId },
    recipient,
    typedPrice,
    price,
    allowLimitPrice,
    priceAsCurrencyAmount,
    invertLimitPriceValue,
    chunkSize,
  } = useTwapState();

  const inputCurrency = useCurrency(inputCurrencyId);
  const outputCurrency = useCurrency(outputCurrencyId);

  //const recipientLookup = useENS(recipient ?? undefined);
  const to: string | null = (recipient === null ? account : recipient) ?? null;

  const relevantTokenBalances = useCurrencyBalances(account ?? undefined, [
    inputCurrency ?? undefined,
    outputCurrency ?? undefined,
  ]);

  const parsedAmount = tryParseAmount(typedValue, inputCurrency ?? undefined);

  const bestTradeExactIn = useTradeExactIn(
    parsedAmount,
    outputCurrency ?? undefined,
  );

  const v2Trade = bestTradeExactIn;

  const currencyBalances = {
    [Field.INPUT]: relevantTokenBalances[0],
    [Field.OUTPUT]: relevantTokenBalances[1],
  };

  const currencies: { [field in Field]?: Currency } = {
    [Field.INPUT]: inputCurrency ?? undefined,
    [Field.OUTPUT]: outputCurrency ?? undefined,
  };

  let inputError: string | undefined;
  if (!account) {
    inputError = 'Connect Wallet';
  }

  if (!parsedAmount) {
    inputError = inputError ?? 'Enter an amount';
  }

  if (!currencies[Field.INPUT] || !currencies[Field.OUTPUT]) {
    inputError = inputError ?? 'Select a token';
  }

  const slippageAdjustedAmounts =
    v2Trade && computeSlippageAdjustedAmounts(undefined, 0);

  // compare input balance to max input based on version
  const [balanceIn, amountIn] = [
    currencyBalances[Field.INPUT],
    slippageAdjustedAmounts ? slippageAdjustedAmounts[Field.INPUT] : null,
  ];

  if (balanceIn && amountIn && balanceIn.lessThan(amountIn)) {
    inputError = 'Insufficient ' + amountIn.currency.symbol + ' balance';
  }

  const {
    minimumAmountOut,
    minimumAmountOutAsCurrencyAmount,
  } = calculateMinAmountOut({
    allowLimitPrice,
    inputAsCurrencyAmount: parsedAmount,
    priceAsCurrencyAmount,
    invertLimitPriceValue,
    chunkSize,
    outputCurrency: currencies[Field.OUTPUT],
  });

  const typedPriceOutputValue = calculateOutputInput({
    price,
    typedPrice,
    typedValue,
    allowLimitPrice,
    outputAmount: v2Trade,
    inputAsCurrencyAmount: parsedAmount,
    priceAsCurrencyAmount,
    invertLimitPriceValue,
  });

  const marketPrice = calculateMarketPrice(parsedAmount, v2Trade);

  return {
    currencies,
    currencyBalances,
    parsedAmount,
    inputError,
    typedPriceOutputValue,
    marketPrice,
    minimumAmountOut,
    minimumAmountOutAsCurrencyAmount,
  };
}

function parseCurrencyFromURLParameter(urlParam: any): string {
  if (typeof urlParam === 'string') {
    const valid = isAddress(urlParam);
    if (valid) return valid;
    if (urlParam.toUpperCase() === 'ETH') return 'ETH';
    if (valid === false) return 'ETH';
  }
  return 'ETH' ?? '';
}

function parseTokenAmountURLParameter(urlParam: any): string {
  return typeof urlParam === 'string' && !isNaN(parseFloat(urlParam))
    ? urlParam
    : '';
}

function parseIndependentFieldURLParameter(urlParam: any): Field {
  return typeof urlParam === 'string' && urlParam.toLowerCase() === 'output'
    ? Field.OUTPUT
    : Field.INPUT;
}

const ENS_NAME_REGEX = /^[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)?$/;
const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
function validatedRecipient(recipient: any): string | null {
  if (typeof recipient !== 'string') return null;
  const address = isAddress(recipient);
  if (address) return address;
  if (ENS_NAME_REGEX.test(recipient)) return recipient;
  if (ADDRESS_REGEX.test(recipient)) return recipient;
  return null;
}

export function queryParametersToSwapState(parsedQs: ParsedQs): TwapState {
  let inputCurrency = parseCurrencyFromURLParameter(parsedQs.inputCurrency);
  let outputCurrency = parseCurrencyFromURLParameter(parsedQs.outputCurrency);
  if (inputCurrency === outputCurrency) {
    if (typeof parsedQs.outputCurrency === 'string') {
      inputCurrency = '';
    } else {
      outputCurrency = '';
    }
  }

  const recipient = validatedRecipient(parsedQs.recipient);

  return {
    [Field.INPUT]: {
      currencyId: inputCurrency,
    },
    [Field.OUTPUT]: {
      currencyId: outputCurrency,
    },
    typedValue: parseTokenAmountURLParameter(parsedQs.exactAmount),
    independentField: parseIndependentFieldURLParameter(parsedQs.exactField),
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
}

// updates the swap state to use the defaults for a given network
export function useDefaultsFromURLSearch():
  | {
      inputCurrencyId: string | undefined;
      outputCurrencyId: string | undefined;
    }
  | undefined {
  const { chainId } = useActiveWeb3React();
  const dispatch = useDispatch<AppDispatch>();
  const parsedQs = useParsedQueryString();
  const [result, setResult] = useState<
    | {
        inputCurrencyId: string | undefined;
        outputCurrencyId: string | undefined;
      }
    | undefined
  >();

  useEffect(() => {
    if (!chainId) return;
    const parsed = queryParametersToSwapState(parsedQs);

    dispatch(
      replaceTwapState({
        typedValue: parsed.typedValue,
        field: parsed.independentField,
        inputCurrencyId: parsed[Field.INPUT].currencyId,
        outputCurrencyId: parsed[Field.OUTPUT].currencyId,
        recipient: parsed.recipient,
        price: undefined,
      }),
    );

    setResult({
      inputCurrencyId: parsed[Field.INPUT].currencyId,
      outputCurrencyId: parsed[Field.OUTPUT].currencyId,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, chainId]);

  return result;
}

export function useTradeExactIn(
  currencyAmountIn?: CurrencyAmount,
  currencyOut?: Currency,
): Fraction | undefined {
  const allowedPairs = useAllCommonPairs(
    currencyAmountIn?.currency,
    currencyOut,
  );

  const inputTokenPrice = useUSDCPrice(currencyAmountIn?.currency);
  const outputTokenPrice = useUSDCPrice(currencyOut);

  return useMemo(() => {
    if (currencyAmountIn && currencyOut && allowedPairs.length > 0) {
      if (!inputTokenPrice || !outputTokenPrice) {
        return;
      }

      return inputTokenPrice
        .quote(currencyAmountIn)
        .divide(outputTokenPrice.adjusted);
    }
    return;
  }, [
    allowedPairs,
    currencyAmountIn,
    currencyOut,
    inputTokenPrice,
    outputTokenPrice,
  ]);
}
