import { currencyEquals, Trade } from '@uniswap/sdk';
import React, { useCallback, useMemo } from 'react';
import {
  TransactionConfirmationModal,
  TransactionErrorContent,
  ConfirmationModalContent,
} from 'components';
import { formatTokenAmount } from 'utils';
import 'components/styles/ConfirmSwapModal.scss';
import { useTranslation } from 'react-i18next';
import ModalContent from './ModalContent';

interface ConfirmTwapModalProps {
  isOpen: boolean;
  originalTrade: Trade | undefined;
  attemptingTxn: boolean;
  txPending?: boolean;
  txHash: string | undefined;
  recipient: string | null;
  allowedSlippage: number;
  onAcceptChanges: () => void;
  onConfirm: () => void;
  swapErrorMessage: string | undefined;
  onDismiss: () => void;
}

const ConfirmTwapModal: React.FC<ConfirmTwapModalProps> = ({
  onConfirm,
  onDismiss,
  swapErrorMessage,
  isOpen,
  attemptingTxn,
  txHash,
  txPending,
}) => {
  const { t } = useTranslation();

  const modalContent = useCallback(() => {
    return <ModalContent onConfirm={onConfirm} />;
  }, [onConfirm]);

  // text to show while loading
  const pendingText = '';

  const confirmationContent = useCallback(
    () =>
      swapErrorMessage ? (
        <TransactionErrorContent
          onDismiss={onDismiss}
          message={swapErrorMessage}
        />
      ) : (
        <ConfirmationModalContent
          title={t('confirmTx')}
          onDismiss={onDismiss}
          content={modalContent}
        />
      ),
    [t, onDismiss, modalContent, swapErrorMessage],
  );

  return (
    <TransactionConfirmationModal
      style={{ maxHeight: '90vh', overflow: 'auto' }}
      isOpen={isOpen}
      onDismiss={onDismiss}
      attemptingTxn={attemptingTxn}
      hash={txHash}
      txPending={txPending}
      content={confirmationContent}
      pendingText={pendingText}
      modalContent={txPending ? t('submittedTxSwap') : t('swapSuccess')}
    />
  );
};

export default ConfirmTwapModal;
