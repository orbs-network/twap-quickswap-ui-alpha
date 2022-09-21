import { Box, Button, LinearProgress, Typography } from '@material-ui/core';
import { CurrencyLogo } from 'components';
import React from 'react';
import { TransactionDataType, TxStatus } from '../types';
import { styled } from '@material-ui/styles';
import { useCurrency } from 'hooks/Tokens';
import ArrowRightAltIcon from '@material-ui/icons/ArrowRightAlt';
import { Currency } from '@uniswap/sdk';
type TransactionProps = {
  tx: TransactionDataType;
  status: TxStatus;
};

const OrderTx = ({ tx, status }: TransactionProps) => {
  const {
    fromTokenId,
    toTokenId,
    fromTokenAmount,
    toTokenAmount,
    currencyPrice,
    executionPrice,
    minimumReceived,
    totalChunks,
    finishedChunks,
  } = tx;

  const fromCurrency = useCurrency(fromTokenId);
  const toCurrency = useCurrency(toTokenId);

  const showCancel = status === TxStatus.OPEN;

  const percent = (finishedChunks / totalChunks) * 100;

  return (
    <StyledOrder className='bg-secondary2'>
      <StyledOrderTop>
        <StyledOrderTopCurrency>
          <Token currency={fromCurrency} />

          <ArrowRightAltIcon />
          <Token currency={toCurrency} />
        </StyledOrderTopCurrency>
        {showCancel && <Button>Cancel</Button>}
      </StyledOrderTop>
      <StyledOrderText>
        Sell {fromTokenAmount} {fromCurrency?.symbol} for {toTokenAmount}{' '}
        {toCurrency?.symbol}
      </StyledOrderText>
      <StyledOrderRows>
        <TxRow
          name='Current price'
          text={`1 ${fromCurrency?.symbol} = ${currencyPrice} ${toCurrency?.symbol}`}
        />
        <TxRow
          name='Limit price'
          text={`1 ${fromCurrency?.symbol} = ${executionPrice} ${toCurrency?.symbol}`}
        />
        <TxRow
          name='Minimum Received'
          text={` 1 ${fromCurrency?.symbol} = ${minimumReceived} ${toCurrency?.symbol}`}
        />
        <TxRow
          name='Expiry Date'
          text={`1 ${fromCurrency?.symbol} = ${minimumReceived} ${toCurrency?.symbol}`}
        />
      </StyledOrderRows>
      <StyledProgressContainer>
        <StyledProgressLeft>
          <StyledLinearProgress
            variant='determinate'
            value={percent}
            color='primary'
          />
          <StyledProgressNumbers>
            <Typography>0%</Typography>
            <Typography>100%</Typography>
          </StyledProgressNumbers>
        </StyledProgressLeft>

        <Typography>
          {finishedChunks}/{totalChunks} Matic
        </Typography>
      </StyledProgressContainer>
    </StyledOrder>
  );
};

export default OrderTx;

const StyledProgressNumbers = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

const StyledLinearProgress = styled(LinearProgress)({
  height: 10,
  borderRadius: 10,
  width: '100%',
});

const StyledProgressLeft = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
});

const StyledProgressContainer = styled(Box)({
  marginTop: 20,
  display: 'flex',
  alignItems: 'flex-start',
  gap: 30,
  '& p': {
    fontSize: 14,
  },
});

type TokenProps = {
  currency?: Currency | null;
};

const Token = ({ currency }: TokenProps) => {
  if (!currency) {
    return null;
  }
  return (
    <StyledToken>
      {currency && <CurrencyLogo currency={currency} size={'28px'} />}
      <Typography>{currency?.symbol}</Typography>
    </StyledToken>
  );
};

const StyledToken = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  '& p': {
    fontSize: 15,
  },
});

type TxRowProps = {
  text: string;
  name: string;
};

const TxRow = ({ text, name }: TxRowProps) => {
  return (
    <StyledOrderRow>
      <small>{name}:</small>
      <Typography>{text}</Typography>
    </StyledOrderRow>
  );
};

const StyledOrder = styled(Box)({
  padding: 20,
  borderRadius: 10,
});

const StyledOrderRows = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 5,
  paddingTop: 10,
});

const StyledOrderRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  '& p': {
    fontSize: 14,
  },
});

const StyledOrderText = styled(Typography)({});

const StyledOrderTop = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: 40,
  marginBottom: 15,
});

const StyledOrderTopCurrency = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
});
