import { CurrencyAmount, Trade } from '@uniswap/sdk';
import React, { useMemo, useState } from 'react';
import { Box, Button, styled, Typography } from '@material-ui/core';
import { CurrencyLogo } from 'components';
import useUSDCPrice from 'utils/useUSDCPrice';
import { formatTokenAmount, shortenAddress } from 'utils';
import { useTranslation } from 'react-i18next';
import { useDerivedTwapInfo, useTwapState } from 'state/twap/hooks';
import { tryParseAmount } from 'state/swap/hooks';
import { getTokenValue } from 'state/twap/utils';
import TxDetails from './TxDetails';
import Disclaimer from './Disclaimer';
import InfoTooltip from '../InfoTooltip';
import PriceIndication from '../PriceIndication';
import { Field } from 'state/twap/actions';
import Powered from '../Powered';
import Accept from './Accept';
import { useActiveWeb3React } from 'hooks';

interface ModalContentProps {
  onConfirm: () => void;
}

const ModalContent: React.FC<ModalContentProps> = ({ onConfirm }) => {
  const { t } = useTranslation();
  const { account } = useActiveWeb3React();
  const {
    typedPriceOutputValue,
    parsedAmount,
    marketPrice,
    currencies,
  } = useDerivedTwapInfo();
  const { allowLimitPrice, priceAsCurrencyAmount } = useTwapState();
  const [isAccepted, setIsAccepted] = useState(false);

  const outputAsCurrencyAmount = useMemo(() => {
    if (!typedPriceOutputValue) {
      return undefined;
    }
    const result =
      tryParseAmount(
        typedPriceOutputValue.toSignificant(6),
        currencies[Field.OUTPUT],
      ) ||
      tryParseAmount(
        typedPriceOutputValue.toFixed(6),
        currencies[Field.OUTPUT],
      );
    return result;
  }, [typedPriceOutputValue, currencies]);

  return (
    <StyledContainer>
      <StyledCards>
        {parsedAmount && <Card currencyAmount={parsedAmount} title='From' />}
        {outputAsCurrencyAmount && (
          <Card
            tooltip={t('confirmationToInputTooltip')}
            currencyAmount={outputAsCurrencyAmount}
            title='To'
            prefix={allowLimitPrice ? '≥' : '~'}
          />
        )}
      </StyledCards>
      {allowLimitPrice ? (
        <PriceIndication
          tooltip={t('confirmationLimitOrderTooltip')}
          executionPrice={priceAsCurrencyAmount}
          title='Limit Price'
        />
      ) : (
        <PriceIndication
          tooltip={t('confirmationLimitOrderTooltip')}
          executionPrice={marketPrice}
          title='Limit Price'
          customText='None'
        />
      )}
      <TxDetails />

      <Disclaimer />
      <Box style={{ marginTop: 10 }}>
        <Accept isAccepted={isAccepted} toggle={setIsAccepted} />
      </Box>

      {account && (
        <StyledText>
          Output will be sent to <strong>{shortenAddress(account)}</strong>
        </StyledText>
      )}

      <Box className='transactionText'>
        <Button
          disabled={!isAccepted}
          onClick={onConfirm}
          className='swapButton'
        >
          Confirm Order
        </Button>
      </Box>
      <Box style={{ marginTop: 10 }}>
        <Powered />
      </Box>
    </StyledContainer>
  );
};

export default ModalContent;

const StyledText = styled(Typography)({
  fontSize: 14,
  textAlign: 'center',
  marginTop: 10,
});

const StyledContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
});

const StyledCards = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
});

type CardProps = {
  currencyAmount: CurrencyAmount;
  title: string;
  tooltip?: string;
  prefix?: string;
};

const Card = ({ currencyAmount, title, tooltip, prefix }: CardProps) => {
  const usdPrice = useUSDCPrice(currencyAmount.currency);

  return (
    <StyledCard className='swapBox bg-secondary2'>
      <StyledCardTop>
        {tooltip ? (
          <InfoTooltip text={tooltip}>
            <Typography>{title}</Typography>
          </InfoTooltip>
        ) : (
          <Typography>{title}</Typography>
        )}
        <Typography>
          ~$
          {usdPrice && getTokenValue(usdPrice, currencyAmount)}
        </Typography>
      </StyledCardTop>
      <StyledCardBottom>
        <StyledCurrency>
          <CurrencyLogo currency={currencyAmount.currency} size={'24px'} />
          <Typography>{currencyAmount.currency?.symbol}</Typography>
        </StyledCurrency>
        {prefix ? (
          <Typography>
            {prefix} {formatTokenAmount(currencyAmount)}
          </Typography>
        ) : (
          <Typography>{formatTokenAmount(currencyAmount)}</Typography>
        )}
      </StyledCardBottom>
    </StyledCard>
  );
};

const StyledCard = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  flexDirection: 'column',
  gap: 10,
});

const StyledCardBottom = styled(Box)({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  '& p': {
    fontSize: 18,
  },
});

const StyledCurrency = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
});

const StyledCardTop = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
});
