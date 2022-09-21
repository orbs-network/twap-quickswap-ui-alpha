import { Avatar, Box, Typography } from '@material-ui/core';
import { styled } from '@material-ui/styles';
import { Currency } from '@uniswap/sdk';
import { CurrencyLogo, NumericalInput } from 'components';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useDerivedTwapInfo,
  useTwapActionHandlers,
  useTwapState,
} from 'state/twap/hooks';
import { invalidChunkSize } from 'state/twap/utils';
import useUSDCPrice from 'utils/useUSDCPrice';
import InfoTooltip from './InfoTooltip';

interface Props {
  currency: Currency | undefined;
}

function ChunkSize({ currency }: Props) {
  const { totalChunks, chunkSize } = useTwapState();
  const { parsedAmount } = useDerivedTwapInfo();
  const { onChunkSize } = useTwapActionHandlers();
  const { t } = useTranslation();
  const usdPrice = Number(useUSDCPrice(currency)?.toSignificant() ?? 0);

  const onChange = (value: string) => {
    onChunkSize(value);
  };

  useEffect(() => {
    if (
      parsedAmount &&
      invalidChunkSize(parsedAmount, chunkSize) &&
      chunkSize !== parsedAmount.toExact()
    ) {
      onChunkSize(parsedAmount.toExact());
    }
  }, [parsedAmount, chunkSize, onChunkSize]);

  return (
    <StyledContainer className={`swapBox bg-secondary2`}>
      <StyledTop>
        <InfoTooltip text={t('tradeSizeInput')}>
          <StyledTitle style={{ margin: 0 }}>Trade Size</StyledTitle>
        </InfoTooltip>
        <NumericalInput
          value={chunkSize || ''}
          align='right'
          placeholder='0.00'
          onUserInput={(val) => {
            onChange(val);
          }}
        />
        {currency && (
          <StyledCurrency style={{ marginBottom: 0 }}>
            <CurrencyLogo currency={currency} size={'24px'} />
            {currency?.symbol}
          </StyledCurrency>
        )}
      </StyledTop>
      <StyledBottom>
        <small className='text-secondary'>
          Total trades: {totalChunks?.toString() ?? 0}
        </small>
        <small className='text-secondary'>
          ${chunkSize ? (usdPrice * Number(chunkSize)).toLocaleString() : '0'}
        </small>
      </StyledBottom>
    </StyledContainer>
  );
}

export default ChunkSize;

const StyledTop = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
});

const StyledBottom = styled(Box)({
  width: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: 10,
});

const StyledContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  flexDirection: 'column',
});

const StyledTitle = styled(Typography)({
  marginRight: 10,
  whiteSpace: 'nowrap',
});

const StyledCurrency = styled(Typography)({
  marginLeft: 20,
  display: 'flex',
  gap: 10,
});
