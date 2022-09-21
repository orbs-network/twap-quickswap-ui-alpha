import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { CurrencyAmount, Token, Trade } from '@uniswap/sdk';
import { Box, Button, CircularProgress, styled } from '@material-ui/core';
import { useWalletModalToggle } from 'state/application/hooks';
import {
  useDerivedTwapInfo,
  useTwapActionHandlers,
  useTwapState,
} from 'state/twap/hooks';
import { useUserSlippageTolerance } from 'state/user/hooks';
import { Field } from 'state/swap/actions';
import { useToken } from 'hooks/Tokens';
import { CurrencyInput } from 'components';
import { useActiveWeb3React } from 'hooks';
import { ApprovalState } from 'hooks/useApproveCallback';
import { useTransactionFinalizer } from 'state/transactions/hooks';
import { addMaticToMetamask, isSupportedNetwork, maxAmountSpend } from 'utils';
import { ReactComponent as ExchangeIcon } from 'assets/images/ExchangeIcon.svg';
import 'components/styles/Swap.scss';
import { useTranslation } from 'react-i18next';
import LimitPriceInput from './LimitPriceInput';
import Duration from './Duration';
import Interval from './Interval';
import ChunkSize from './ChunkSize';
import ErrorNotification from './ErrorNotification';
import { useTwapCallback } from './useTwapCallback';
import ConfirmTwapModal from './ConfirmTwapModal';
import PriceIndication from './PriceIndication';
import { parseUnits } from 'ethers/lib/utils';
import useTwapWrapCallback, { WrapType } from './useWrapCallback';
import {
  useInputsValidation,
  useMinimumAmountOutValidation,
} from './useValidation';
import { useTwapApproveCallbackFromTrade } from './useTwapApproveCallbackFromTrade';
import { MATIC_WRAPPED_ADDRESS } from './consts';
import { useDispatch } from 'react-redux';
import { updateDeadline } from 'state/twap/actions';
import Powered from './Powered';

const Twap: React.FC = () => {
  const { t } = useTranslation();
  const { account } = useActiveWeb3React();
  const { typedValue, recipient, allowLimitPrice } = useTwapState();

  const {
    currencyBalances,
    parsedAmount,
    currencies,
    inputError: swapInputError,
    typedPriceOutputValue,
    marketPrice,
  } = useDerivedTwapInfo();

  const isMinAmountValid = useMinimumAmountOutValidation();

  const finalizedTransaction = useTransactionFinalizer();
  const [wrapLoading, setWrapLoading] = useState(false);

  const {
    wrapType,
    execute: onWrap,
    inputError: wrapInputError,
  } = useTwapWrapCallback(
    currencies[Field.INPUT],
    currencies[Field.OUTPUT],
    typedValue,
  );

  const {
    onSwitchTokens,
    onCurrencySelection,
    onUserInput,
    onWrapDone,
    onTwapTxDone,
  } = useTwapActionHandlers();
  const searchToken = useToken(MATIC_WRAPPED_ADDRESS);

  const handleCurrencySelect = useCallback(
    (inputCurrency) => {
      setApprovalSubmitted(false); // reset 2 step UI for approvals
      onCurrencySelection(Field.INPUT, inputCurrency);
    },
    [onCurrencySelection],
  );

  const onWrapHandler = async () => {
    if (!onWrap) {
      return;
    }
    try {
      setWrapLoading(true);
      await onWrap();
      handleCurrencySelect(searchToken);
      onWrapDone();
    } catch (error) {
    } finally {
      setWrapLoading(false);
    }
  };

  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE;

  const [allowedSlippage] = useUserSlippageTolerance();
  const [approving, setApproving] = useState(false);
  const [approval, approveCallback] = useTwapApproveCallbackFromTrade(
    parsedAmount,
  );

  const inputsError = useInputsValidation();

  const parsedAmounts = useMemo(() => {
    return {
      [Field.INPUT]: parsedAmount,
      [Field.OUTPUT]: typedPriceOutputValue,
    };
  }, [parsedAmount, typedPriceOutputValue]);

  const formattedAmounts = useMemo(() => {
    return {
      [Field.INPUT]: typedValue || '',
      [Field.OUTPUT]: typedPriceOutputValue?.toSignificant(6) || '',
    };
  }, [typedValue, typedPriceOutputValue]);

  const userHasSpecifiedInputOutput = Boolean(
    currencies[Field.INPUT] &&
      currencyBalances[Field.INPUT] &&
      currencyBalances[Field.INPUT]?.toExact() &&
      typedValue &&
      parseUnits(typedValue, parsedAmounts[Field.INPUT]?.currency.decimals).gt(
        parseUnits(
          currencyBalances[Field.INPUT]?.toExact() || '0',
          parsedAmounts[Field.INPUT]?.currency.decimals,
        ),
      ),
  );

  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false);
  const { ethereum } = window as any;
  const isValid = !swapInputError;

  const showApproveFlow =
    approval === ApprovalState.NOT_APPROVED ||
    approval === ApprovalState.PENDING ||
    (approvalSubmitted && approval === ApprovalState.APPROVED);

  const toggleWalletModal = useWalletModalToggle();

  useEffect(() => {
    if (approval === ApprovalState.PENDING) {
      setApprovalSubmitted(true);
    }
  }, [approval, approvalSubmitted]);

  const connectWallet = () => {
    if (ethereum && !isSupportedNetwork(ethereum)) {
      addMaticToMetamask();
    } else {
      toggleWalletModal();
    }
  };

  const handleOtherCurrencySelect = useCallback(
    (outputCurrency) => {
      if (outputCurrency.symbol === 'MATIC' && searchToken) {
        setApprovalSubmitted(false);
        onCurrencySelection(Field.OUTPUT, searchToken);
      } else {
        setApprovalSubmitted(false);
        onCurrencySelection(Field.OUTPUT, outputCurrency);
      }
    },
    [onCurrencySelection, searchToken],
  );

  const swapButtonText = useMemo(() => {
    if (account) {
      if (!currencies[Field.INPUT] || !currencies[Field.OUTPUT]) {
        return t('selectToken');
      } else if (
        formattedAmounts[Field.INPUT] === '' &&
        formattedAmounts[Field.OUTPUT] === ''
      ) {
        return t('enterAmount');
      } else if (userHasSpecifiedInputOutput) {
        return t('insufficientLiquidityTrade');
      } else if (showWrap) {
        return wrapType === WrapType.WRAP
          ? t('wrap')
          : wrapType === WrapType.UNWRAP
          ? t('unWrap')
          : '';
      } else if (inputsError) {
        return inputsError;
      } else if (!isMinAmountValid) {
        return 'Trade size must be equal to at least 1 USD';
      } else {
        return swapInputError ?? 'Place order';
      }
    } else {
      return ethereum && !isSupportedNetwork(ethereum)
        ? t('switchPolygon')
        : t('connectWallet');
    }
  }, [
    t,
    formattedAmounts,
    currencies,
    account,
    ethereum,
    userHasSpecifiedInputOutput,
    showWrap,
    wrapType,
    swapInputError,
    inputsError,
    isMinAmountValid,
  ]);

  const twapButtonDisabled = useMemo(() => {
    if (account) {
      if (!isMinAmountValid) {
        return true;
      } else if (inputsError) {
        return Boolean(inputsError);
      } else if (showWrap) {
        return Boolean(wrapInputError);
      } else if (userHasSpecifiedInputOutput) {
        return true;
      } else if (showApproveFlow) {
        return !isValid || approval !== ApprovalState.APPROVED;
      } else {
        return !isValid;
      }
    } else {
      return false;
    }
  }, [
    account,
    showWrap,
    wrapInputError,
    userHasSpecifiedInputOutput,
    showApproveFlow,
    approval,
    isValid,
    inputsError,
    isMinAmountValid,
  ]);

  const [
    {
      showConfirm,
      txPending,
      tradeToConfirm,
      swapErrorMessage,
      attemptingTxn,
      txHash,
    },
    setTwapState,
  ] = useState<{
    showConfirm: boolean;
    txPending?: boolean;
    tradeToConfirm: Trade | undefined;
    attemptingTxn: boolean;
    swapErrorMessage: string | undefined;
    txHash: string | undefined;
  }>({
    showConfirm: false,
    txPending: false,
    tradeToConfirm: undefined,
    attemptingTxn: false,
    swapErrorMessage: undefined,
    txHash: undefined,
  });

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(value);
    },
    [onUserInput],
  );

  const maxAmountInput: CurrencyAmount | undefined = maxAmountSpend(
    currencyBalances[Field.INPUT],
  );

  const handleMaxInput = useCallback(() => {
    maxAmountInput && onUserInput(maxAmountInput.toExact());
  }, [maxAmountInput, onUserInput]);

  const handleHalfInput = useCallback(() => {
    maxAmountInput &&
      onUserInput((Number(maxAmountInput.toExact()) / 2).toString());
  }, [maxAmountInput, onUserInput]);

  const atMaxAmountInput = Boolean(
    maxAmountInput && parsedAmounts[Field.INPUT]?.equalTo(maxAmountInput),
  );
  const dispatch = useDispatch();
  const onSwap = () => {
    if (showWrap) {
      onWrapHandler();
    } else {
      dispatch(updateDeadline());
      setTwapState({
        tradeToConfirm: undefined,
        attemptingTxn: false,
        swapErrorMessage: undefined,
        showConfirm: true,
        txHash: undefined,
      });
    }
  };

  const twapCallback = useTwapCallback();

  const handleTwap = useCallback(async () => {
    if (!twapCallback) {
      return;
    }

    try {
      setTwapState({
        attemptingTxn: true,
        tradeToConfirm: undefined,
        showConfirm: true,
        swapErrorMessage: undefined,
        txHash: undefined,
        txPending: true,
      });

      const res = await twapCallback();
      const receipt = await res.wait();

      console.log({ receipt });

      setTwapState({
        attemptingTxn: false,
        tradeToConfirm: undefined,
        showConfirm: false,
        swapErrorMessage: undefined,
        txHash: undefined,
        txPending: false,
      });
      onTwapTxDone();
    } catch (error) {
      console.log(error);
      setTwapState({
        attemptingTxn: false,
        tradeToConfirm: undefined,
        showConfirm: true,
        swapErrorMessage: (error as any).message,
        txHash: undefined,
        txPending: false,
      });
    } finally {
    }
  }, [
    tradeToConfirm,
    account,
    recipient,
    showConfirm,
    twapCallback,
    finalizedTransaction,
    onTwapTxDone,
  ]);

  useEffect(() => {
    if (!currencies[Field.INPUT] && searchToken) {
      onCurrencySelection(Field.INPUT, searchToken);
    }
  }, [onCurrencySelection, currencies, searchToken]);

  const handleAcceptChanges = useCallback(() => {
    setTwapState({
      tradeToConfirm: undefined,
      swapErrorMessage,
      txHash,
      attemptingTxn,
      showConfirm,
    });
  }, [attemptingTxn, showConfirm, swapErrorMessage, txHash]);

  const handleConfirmDismiss = useCallback(() => {
    setTwapState({
      showConfirm: false,
      tradeToConfirm,
      attemptingTxn,
      swapErrorMessage,
      txHash,
    });
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput('');
    }
  }, [attemptingTxn, onUserInput, swapErrorMessage, tradeToConfirm, txHash]);

  return (
    <Box>
      <ErrorNotification />
      {showConfirm && (
        <ConfirmTwapModal
          isOpen={showConfirm}
          originalTrade={tradeToConfirm}
          onAcceptChanges={handleAcceptChanges}
          attemptingTxn={attemptingTxn}
          txPending={txPending}
          txHash={txHash}
          recipient={recipient}
          allowedSlippage={allowedSlippage}
          onConfirm={handleTwap}
          swapErrorMessage={swapErrorMessage}
          onDismiss={handleConfirmDismiss}
        />
      )}
      <CurrencyInput
        title={`${t('from')}:`}
        id='swap-currency-input'
        currency={currencies[Field.INPUT]}
        onHalf={handleHalfInput}
        onMax={handleMaxInput}
        showHalfButton={true}
        showMaxButton={!atMaxAmountInput}
        otherCurrency={currencies[Field.OUTPUT]}
        handleCurrencySelect={handleCurrencySelect}
        amount={formattedAmounts[Field.INPUT]}
        setAmount={handleTypeInput}
      />

      <Box className='exchangeSwap'>
        <ExchangeIcon onClick={onSwitchTokens} />
      </Box>
      <CurrencyInput
        title={`${t('toEstimate')}:`}
        id='swap-currency-output'
        currency={currencies[Field.OUTPUT]}
        showPrice={Boolean(marketPrice)}
        showMaxButton={false}
        otherCurrency={currencies[Field.INPUT]}
        handleCurrencySelect={handleOtherCurrencySelect}
        amount={formattedAmounts[Field.OUTPUT] || ''}
        setAmount={() => null}
        disabled
        prefix={allowLimitPrice ? '≥' : '~'}
        tooltip={
          allowLimitPrice ? t('twapToInputLimitOrder') : t('twapToInput')
        }
      />
      {marketPrice && (
        <PriceIndication
          executionPrice={marketPrice}
          title='Current Market Price'
        />
      )}
      <StyledFlex>
        <LimitPriceInput />
        <ChunkSize currency={currencies[Field.INPUT]} />
        <Duration />
        <Interval />
      </StyledFlex>

      <Box className='swapButtonWrapper'>
        {showApproveFlow && !showWrap && (
          <Box width='48%'>
            <Button
              fullWidth
              disabled={
                approving ||
                approval !== ApprovalState.NOT_APPROVED ||
                approvalSubmitted
              }
              onClick={async () => {
                setApproving(true);
                try {
                  await approveCallback();
                  setApproving(false);
                } catch (err) {
                  setApproving(false);
                }
              }}
            >
              {approval === ApprovalState.PENDING ? (
                <Box className='content'>
                  {t('approving')} <CircularProgress size={16} />
                </Box>
              ) : approvalSubmitted && approval === ApprovalState.APPROVED ? (
                t('approved')
              ) : (
                `${t('approve')} ${currencies[Field.INPUT]?.symbol}`
              )}
            </Button>
          </Box>
        )}
        <StyledButtonContainer
          width={showApproveFlow && !showWrap ? '48%' : '100%'}
        >
          <Button
            fullWidth
            disabled={(twapButtonDisabled as boolean) || wrapLoading}
            onClick={account ? onSwap : connectWallet}
          >
            {wrapLoading ? (
              <CircularProgress style={{ color: 'white', zoom: 0.8 }} />
            ) : (
              swapButtonText
            )}
          </Button>
        </StyledButtonContainer>
      </Box>
      <Box style={{ marginTop: 20 }}>
        <Powered />
      </Box>
    </Box>
  );
};

export default Twap;

const StyledButtonContainer = styled(Box)({
  '& .Mui-disabled': {
    backgroundImage: 'unset!important',
    color: 'white!important',
  },
});

const StyledFlex = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
});
