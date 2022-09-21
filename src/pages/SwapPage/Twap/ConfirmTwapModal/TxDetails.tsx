import { Box, styled, Typography } from '@material-ui/core';
import { Currency, CurrencyAmount, Fraction } from '@uniswap/sdk';
import { CurrencyLogo, CustomTooltip } from 'components';
import moment from 'moment';
import React, { ReactNode } from 'react';
import { useDerivedTwapInfo, useTwapState } from 'state/twap/hooks';
import { formatTokenAmount } from 'utils';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import { useTranslation } from 'react-i18next';
import { Field } from 'state/twap/actions';
import { parseUnits } from 'ethers/lib/utils';
import { BigNumber } from 'ethers';
import { MINUTE } from '../consts';
const calculateInterval = (value?: number) => {
  if (!value) {
    return '0';
  }
  const time = moment.duration(value);
  const days = time.days();
  const hours = time.hours();
  const minutes = time.minutes();

  let str = '';

  if (days) {
    str += `${days} Days `;
  }
  if (hours) {
    str += `${hours} Hours `;
  }
  if (minutes) {
    str += `${minutes} Minutes`;
  }
  return str;
};

function TxDetails() {
  const { totalChunks, interval, deadline, allowLimitPrice } = useTwapState();
  const { t } = useTranslation();
  const { currencies, minimumAmountOutAsCurrencyAmount } = useDerivedTwapInfo();

  const outputCurrency = currencies[Field.OUTPUT];

  return (
    <StyledDetails className='swapBox bg-secondary2'>
      <Row
        title='Expiration:'
        value={moment(deadline)
          .add(MINUTE, 'milliseconds')
          .format('DD/MM/YYYY HH:mm')}
        tooltip={t('confirmationExpiration')}
      />

      <Row
        title='Trade Size:'
        element={<TradeSize />}
        tooltip={t('confirmationTradeSize')}
      />

      <Row
        title='Total Trades:'
        value={totalChunks || 0}
        tooltip={t('confirmationTotalTrades')}
      />
      <Row
        title='Trade Interval:'
        value={calculateInterval(interval.milliseconds)}
        tooltip={t('confirmationTradeInterval')}
      />
      <Row
        title='Minimum Received Per Trade:'
        element={allowLimitPrice && <MinimumReceivedPerTrade />}
        value={!allowLimitPrice ? 'None' : undefined}
        tooltip={
          allowLimitPrice
            ? t('confirmationMinimumReceivedWithLimit')
            : t('confirmationMinimumReceivedNoLimit')
        }
      />
    </StyledDetails>
  );
}

export default TxDetails;

const TradeSize = () => {
  const { chunkSize } = useTwapState();
  const { currencies } = useDerivedTwapInfo();

  const outputCurrency = currencies[Field.INPUT];

  return <CurrencyDisplay currency={outputCurrency} value={chunkSize} />;
};

const MinimumReceivedPerTrade = () => {
  const { currencies, minimumAmountOutAsCurrencyAmount } = useDerivedTwapInfo();

  const outputCurrency = currencies[Field.OUTPUT];

  return (
    <CurrencyDisplay
      currency={outputCurrency}
      value={minimumAmountOutAsCurrencyAmount?.toExact()}
    />
  );
};

const CurrencyDisplay = ({
  currency,
  value,
}: {
  currency?: Currency;
  value?: string;
}) => {
  if (!currency) {
    return null;
  }
  return (
    <StyledCurrency>
      <Typography>
        <span>{value}</span>
      </Typography>
      <Typography>
        <span style={{ fontSize: 12 }}>{currency?.symbol}</span>
      </Typography>

      <CurrencyLogo currency={currency} size='20px' />
    </StyledCurrency>
  );
};

const StyledDetails = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  '& p': {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    fontSize: 13,
    '& span': {
      fontWeight: 600,
    },
  },
});

const StyledCurrency = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 5,
});

type RowProps = {
  title: string;
  value?: string | number;
  tooltip?: string;
  element?: ReactNode;
};

const Row = ({ title, value, tooltip, element }: RowProps) => {
  return (
    <StyledRow>
      {tooltip ? (
        <CustomTooltip title={tooltip} placement='right'>
          <Typography>
            {title} <HelpOutlineIcon style={{ width: 15 }} />
          </Typography>
        </CustomTooltip>
      ) : (
        <Typography>{title}</Typography>
      )}
      {value && (
        <Typography>
          <span>{value}</span>
        </Typography>
      )}
      {element}
    </StyledRow>
  );
};

const StyledRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});
