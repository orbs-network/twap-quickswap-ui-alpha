import React, { ReactNode, useCallback, useState } from 'react';
import { Currency } from '@uniswap/sdk';
import { Box } from '@material-ui/core';
import { useCurrencyBalance } from 'state/wallet/hooks';
import { CurrencySearchModal, CurrencyLogo, NumericalInput } from 'components';
import { useActiveWeb3React } from 'hooks';
import useUSDCPrice from 'utils/useUSDCPrice';
import { formatTokenAmount } from 'utils';
import 'components/styles/CurrencyInput.scss';
import { useTranslation } from 'react-i18next';
import { useTwapState } from 'state/twap/hooks';
import InfoTooltip from 'pages/SwapPage/Twap/InfoTooltip';

interface CurrencyInputProps {
  title?: string;
  handleCurrencySelect: (currency: Currency) => void;
  currency: Currency | undefined;
  otherCurrency?: Currency | undefined;
  amount: string;
  setAmount: (value: string) => void;
  onMax?: () => void;
  onHalf?: () => void;
  showHalfButton?: boolean;
  showMaxButton?: boolean;
  showPrice?: boolean;
  bgClass?: string;
  id?: string;
  disabled?: boolean;
  tooltip?: string | ReactNode;
  prefix?: string;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({
  handleCurrencySelect,
  currency,
  otherCurrency,
  amount,
  setAmount,
  onMax,
  onHalf,
  showMaxButton,
  showHalfButton,
  title,
  showPrice,
  bgClass,
  id,
  disabled,
  tooltip,
  prefix,
}) => {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const { account } = useActiveWeb3React();
  const selectedCurrencyBalance = useCurrencyBalance(
    account ?? undefined,
    currency,
  );

  const usdPrice = Number(useUSDCPrice(currency)?.toSignificant() ?? 0);

  const handleOpenModal = useCallback(() => {
    setModalOpen(true);
  }, [setModalOpen]);

  return (
    <Box
      id={id}
      className={`swapBox${showPrice ? ' priceShowBox' : ''} ${bgClass ??
        'bg-secondary2'}`}
    >
      <Box className='flex justify-between' mb={2}>
        {tooltip ? (
          <InfoTooltip text={tooltip}>
            <p>{title || `${t('youPay')}:`}</p>
          </InfoTooltip>
        ) : (
          <p>{title || `${t('youPay')}:`}</p>
        )}
        <Box display='flex'>
          {account && currency && showHalfButton && (
            <Box className='maxWrapper' onClick={onHalf}>
              <small>50%</small>
            </Box>
          )}
          {account && currency && showMaxButton && (
            <Box className='maxWrapper' marginLeft='20px' onClick={onMax}>
              <small>{t('max')}</small>
            </Box>
          )}
        </Box>
      </Box>
      <Box mb={2}>
        <Box
          className={`currencyButton ${
            currency ? 'currencySelected' : 'noCurrency'
          }`}
          onClick={handleOpenModal}
        >
          {currency ? (
            <>
              <CurrencyLogo currency={currency} size={'28px'} />
              <p className='token-symbol-container'>{currency?.symbol}</p>
            </>
          ) : (
            <p>{t('selectToken')}</p>
          )}
        </Box>
        <Box className='inputWrapper'>
          <NumericalInput
            disabled={disabled}
            value={amount}
            align='right'
            placeholder='0.00'
            prefix={amount ? prefix : undefined}
            onUserInput={(val) => {
              setAmount(val);
            }}
          />
        </Box>
      </Box>
      <Box className='flex justify-between'>
        <small className='text-secondary'>
          {t('balance')}: {formatTokenAmount(selectedCurrencyBalance)}
        </small>
        <small className='text-secondary'>
          ${(usdPrice * Number(amount)).toLocaleString()}
        </small>
      </Box>
      {modalOpen && (
        <CurrencySearchModal
          isOpen={modalOpen}
          onDismiss={() => {
            setModalOpen(false);
          }}
          onCurrencySelect={handleCurrencySelect}
          selectedCurrency={currency}
          showCommonBases={true}
          otherSelectedCurrency={otherCurrency}
        />
      )}
    </Box>
  );
};

export default CurrencyInput;
