import { useTransactionAdder } from 'state/transactions/hooks';
import { useActiveWeb3React } from 'hooks';
import { useTwapContract } from './contract/useContract';
import {
  tryParseAmount,
  useDerivedTwapInfo,
  useTwapState,
} from 'state/twap/hooks';
import moment from 'moment';
import { MINUTE } from './consts';

// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade

export function useTwapCallback() {
  const { account } = useActiveWeb3React();
  const { interval, INPUT, OUTPUT, chunkSize, deadline } = useTwapState();
  const { parsedAmount, minimumAmountOut } = useDerivedTwapInfo();

  const contract = useTwapContract();

  const addTransaction = useTransactionAdder();

  const callback = async () => {
    const srcAmount = parsedAmount?.raw.toString();
    const srcBidAmount =
      chunkSize &&
      tryParseAmount(chunkSize, parsedAmount?.currency)?.raw.toString();
    const dstMinAmount = minimumAmountOut?.toString();

    if (!INPUT.currencyId || !OUTPUT.currencyId) {
      throw new Error('currencies missing');
    }
    if (!contract) {
      throw new Error('Contract error');
    }
    if (!account) {
      throw new Error('account missing');
    }
    if (!deadline) {
      throw new Error('Deadline missing');
    }

    if (!interval.milliseconds) {
      throw new Error('Interval missing');
    }

    if (!srcBidAmount) {
      throw new Error('Source bid amount missing');
    }

    if (!srcAmount) {
      throw new Error('Source missing');
    }
    if (!dstMinAmount) {
      throw new Error('Dest min amount missing');
    }

    const delay = interval.milliseconds / 1000;

    return contract.ask(
      '0x1c5361ba8EFE172E6D809839B3EcE9eE8F47cf5D',
      INPUT.currencyId,
      OUTPUT.currencyId,
      srcAmount,
      srcBidAmount,
      dstMinAmount,
      moment(deadline)
        .add(MINUTE, 'milliseconds')
        .unix(),
      delay,
    );
  };

  return callback;
}
