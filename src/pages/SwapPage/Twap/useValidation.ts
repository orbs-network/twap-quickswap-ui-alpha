import { BigNumber } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';
import React, { useMemo } from 'react';
import { useDerivedSwapInfo } from 'state/swap/hooks';
import { useDerivedTwapInfo, useTwapState } from 'state/twap/hooks';
import useUSDCPrice from 'utils/useUSDCPrice';

export const useInputsValidation = (): string | undefined => {
  const { duration, interval, totalChunks } = useTwapState();

  return useMemo(() => {
    if (!duration.milliseconds) {
      return 'Form Incomplete';
    }
    if (!totalChunks) {
      return 'Form Incomplete';
    }
    if (!interval.milliseconds) {
      return 'Form Incomplete';
    }

    return undefined;
  }, [duration, interval, totalChunks]);
};

export const usePartialFillWarning = (): boolean => {
  const { duration, interval, totalChunks } = useTwapState();

  return useMemo(() => {
    if (
      interval.milliseconds &&
      duration.milliseconds &&
      totalChunks &&
      interval.milliseconds * Number(totalChunks) > duration.milliseconds
    ) {
      return true;
    }
    return false;
  }, [interval, duration, totalChunks]);
};

export const useMinimumAmountOutValidation = () => {
  const { parsedAmount } = useDerivedTwapInfo();
  const { chunkSize, totalChunks } = useTwapState();

  const usdPrice = Number(
    useUSDCPrice(parsedAmount?.currency)?.toSignificant() ?? 0,
  );
  return useMemo(() => {
    if (!chunkSize) {
      return false;
    }

    const decimals = parsedAmount?.currency.decimals;
    const chunkSizeRaw = parseUnits(chunkSize, decimals);

    const remainderChunkSize = BigNumber.from(parsedAmount?.raw.toString()).mod(
      chunkSizeRaw,
    );

    const smallestChunk = remainderChunkSize.isZero()
      ? chunkSizeRaw
      : remainderChunkSize;

    const usdPriceRaw = parseUnits(usdPrice.toString(), decimals);
    const oneUnitInputAmount = BigNumber.from(10).pow(BigNumber.from(decimals));

    const result = smallestChunk.mul(usdPriceRaw).div(oneUnitInputAmount);

    return result.gte(oneUnitInputAmount);
  }, [usdPrice, chunkSize]);
};
