import { Currency, ETHER, WETH } from '@uniswap/sdk';
import { useMemo } from 'react';
import { tryParseAmount } from 'state/swap/hooks';
import { useTransactionAdder } from 'state/transactions/hooks';
import { useCurrencyBalance } from 'state/wallet/hooks';
import { useActiveWeb3React } from 'hooks';
import { formatTokenAmount } from 'utils';
import { useWETHContract } from 'hooks/useContract';

export enum WrapType {
  NOT_APPLICABLE,
  WRAP,
  UNWRAP,
}

const NOT_APPLICABLE = { wrapType: WrapType.NOT_APPLICABLE };
/**
 * Given the selected input and output currency, return a wrap callback
 * @param inputCurrency the selected input currency
 * @param outputCurrency the selected output currency
 * @param typedValue the user input value
 */
export default function useTwapWrapCallback(
  inputCurrency: Currency | undefined,
  outputCurrency: Currency | undefined,
  typedValue: string | undefined,
): {
  wrapType: WrapType;
  execute?: undefined | (() => Promise<void>);
  inputError?: string;
} {
  const { chainId, account } = useActiveWeb3React();
  const wethContract = useWETHContract();
  const balance = useCurrencyBalance(account ?? undefined, inputCurrency);
  // we can always parse the amount typed as the input currency, since wrapping is 1:1
  const inputAmount = useMemo(() => tryParseAmount(typedValue, inputCurrency), [
    inputCurrency,
    typedValue,
  ]);
  const addTransaction = useTransactionAdder();

  return useMemo(() => {
    if (!wethContract || !chainId || !inputCurrency || !outputCurrency) {
      return NOT_APPLICABLE;
    }

    const sufficientBalance =
      inputAmount && balance && !balance.lessThan(inputAmount);

    if (inputCurrency === ETHER) {
      return {
        wrapType: WrapType.WRAP,
        execute:
          sufficientBalance && inputAmount
            ? async () => {
                const txReceipt = await wethContract.deposit({
                  value: `0x${inputAmount.raw.toString(16)}`,
                });

                addTransaction(txReceipt, {
                  summary: `Wrap ${formatTokenAmount(
                    inputAmount,
                  )} MATIC to WMATIC`,
                });
                await txReceipt.wait();
              }
            : undefined,
        inputError: sufficientBalance ? undefined : 'Insufficient ETH balance',
      };
    } else {
      return NOT_APPLICABLE;
    }
  }, [
    wethContract,
    chainId,
    inputCurrency,
    outputCurrency,
    inputAmount,
    balance,
    addTransaction,
  ]);
}
