import { Box, IconButton, Typography } from '@material-ui/core';
import { styled } from '@material-ui/styles';
import { Trade } from '@uniswap/sdk';
import { CurrencyLogo, NumericalInput, ToggleSwitch } from 'components';
import React, { useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import {
  Field,
  setAllowLimitPrice,
  setInvertLimitPriceValue,
  setPrice,
} from 'state/twap/actions';
import {
  tryParseAmount,
  useDerivedTwapInfo,
  useTwapState,
} from 'state/twap/hooks';
import InfoTooltip from './InfoTooltip';
import { ReactComponent as PriceExchangeIcon } from 'assets/images/PriceExchangeIcon.svg';
import { useTranslation } from 'react-i18next';

function LimitPriceInput() {
  const { currencies, marketPrice } = useDerivedTwapInfo();
  const allowLimitPrice = useTwapState().allowLimitPrice;
  const invertLimitPriceValue = useTwapState().invertLimitPriceValue;
  const price = useTwapState().price;
  const outputCurrencyId = useTwapState().OUTPUT.currencyId;

  const { t } = useTranslation();

  const dispatch = useDispatch();

  const onChange = (value: string) => {
    const currency = currencies[Field.INPUT];
    if (currency) {
      dispatch(
        setPrice({
          price: value,
          formattedPrice: value ? tryParseAmount(value, currency) : undefined,
        }),
      );
    }
  };

  useEffect(() => {
    if (!outputCurrencyId) {
      return;
    }
    console.log('test');

    if (invertLimitPriceValue) {
      onChange(marketPrice?.toSignificant(6) || '');
    } else {
      onChange(marketPrice?.invert().toSignificant(6) || '');
    }
  }, [outputCurrencyId]);

  const onToggle = () => {
    dispatch(setAllowLimitPrice(!allowLimitPrice));
    if (invertLimitPriceValue) {
      dispatch(setInvertLimitPriceValue(false));
      onChange('');
    } else {
      onChange(marketPrice?.invert().toSignificant(6) || '');
    }
  };

  const toggleInvert = () => {
    dispatch(setInvertLimitPriceValue(!invertLimitPriceValue));
  };

  const currenciesMemoized = useMemo(() => {
    if (!invertLimitPriceValue) {
      return {
        inputCurrency: currencies[Field.INPUT],
        outputCurrency: currencies[Field.OUTPUT],
      };
    }
    return {
      inputCurrency: currencies[Field.OUTPUT],
      outputCurrency: currencies[Field.INPUT],
    };
  }, [currencies, invertLimitPriceValue]);

  const { inputCurrency, outputCurrency } = currenciesMemoized;

  return (
    <StyledContainer className={`swapBox bg-secondary2`}>
      <StyledTop>
        <StyledTitle>
          <ToggleSwitch toggled={!!allowLimitPrice} onToggle={onToggle} />
          <InfoTooltip
            text={allowLimitPrice ? t('limitPriceOn') : t('limitPriceOff')}
          >
            <Typography>Limit Price</Typography>
          </InfoTooltip>
        </StyledTitle>
        {!allowLimitPrice && <Typography>None</Typography>}
      </StyledTop>
      {allowLimitPrice && (
        <StyledInputContainer>
          <StyledCurrencyDetails style={{ marginRight: 5 }}>
            <Typography>1</Typography>

            <Typography>{inputCurrency?.symbol}</Typography>
            <CurrencyLogo currency={inputCurrency} size={'28px'} />
          </StyledCurrencyDetails>{' '}
          <Typography>=</Typography>
          <NumericalInput
            disabled={!allowLimitPrice}
            value={price || ''}
            align='center'
            placeholder={allowLimitPrice ? '0.00' : 'None'}
            onUserInput={(val) => {
              onChange(val);
            }}
          />
          <StyledCurrencyDetails>
            <Typography>{outputCurrency?.symbol}</Typography>
            <CurrencyLogo currency={outputCurrency} size={'28px'} />
          </StyledCurrencyDetails>
          <IconButton onClick={toggleInvert} style={{ marginLeft: 10 }}>
            <PriceExchangeIcon />
          </IconButton>
        </StyledInputContainer>
      )}
    </StyledContainer>
  );
}

export default LimitPriceInput;

const StyledInputContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  marginLeft: 'auto',
  '& .styledInput': {
    width: 150,
    borderBottom: '1px solid white',
    marginLeft: 10,
    marginRight: 10,
  },
});

const StyledCurrencyDetails = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 5,
});

const StyledContainer = styled(Box)({
  marginTop: 5,
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
});

const StyledTitle = styled(Box)({
  marginRight: 10,
  display: 'flex',
  alignItems: 'center',
  gap: 15,
});

const StyledTop = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});
