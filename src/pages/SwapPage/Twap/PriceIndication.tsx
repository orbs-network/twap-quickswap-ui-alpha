import React, { ReactNode, useState } from 'react';
import { ReactComponent as PriceExchangeIcon } from 'assets/images/PriceExchangeIcon.svg';
import { Box, styled } from '@material-ui/core';
import { Fraction, Price, Trade } from '@uniswap/sdk';
import { Field } from 'state/twap/actions';
import { useDerivedTwapInfo } from 'state/twap/hooks';
import { useTranslation } from 'react-i18next';
import InfoTooltip from './InfoTooltip';
import { CurrencyLogo } from 'components';

interface Props {
  executionPrice?: Fraction;
  title?: string;
  customText?: string;
  tooltip?: string | ReactNode;
}

function PriceIndication({
  executionPrice,
  title,
  customText,
  tooltip,
}: Props) {
  const [mainPrice, setMainPrice] = useState(true);
  const { currencies } = useDerivedTwapInfo();

  const inputCurrency = currencies[Field.INPUT];
  const outputCurrency = currencies[Field.OUTPUT];

  return (
    <Box className='swapPrice'>
      {tooltip ? (
        <InfoTooltip text={tooltip}>
          <small>{title}:</small>
        </InfoTooltip>
      ) : (
        <small>{title}</small>
      )}
      {customText ? (
        <small>{customText}</small>
      ) : (
        <>
          <StyledCurrency>
            1 {(mainPrice ? inputCurrency : outputCurrency)?.symbol}
            <CurrencyLogo
              size='20px'
              currency={mainPrice ? inputCurrency : outputCurrency}
            />
            ={' '}
            {executionPrice ? (
              <>
                {(mainPrice
                  ? executionPrice.invert()
                  : executionPrice
                ).toSignificant(6)}{' '}
                {(mainPrice ? outputCurrency : inputCurrency)?.symbol}{' '}
                <CurrencyLogo
                  size='20px'
                  currency={mainPrice ? outputCurrency : inputCurrency}
                />
              </>
            ) : (
              'Market price '
            )}
            <PriceExchangeIcon
              onClick={() => {
                setMainPrice(!mainPrice);
              }}
            />
          </StyledCurrency>
        </>
      )}
    </Box>
  );
}

export default PriceIndication;

const StyledCurrency = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  fontSize: 13,
});
