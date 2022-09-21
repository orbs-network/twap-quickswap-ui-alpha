import { useMemo } from 'react';
import { useActiveWeb3React } from 'hooks';
import { TWAP_CONTRACT_ADDRESS } from '../consts';
import twapAbi from './abi.json';
import Web3 from 'web3';
import { TWAP } from './TwapContract';
import { AbiItem, isAddress } from 'web3-utils';
import { useWeb3React } from '@web3-react/core';
import { Contract } from 'ethers';
import { getContract } from 'utils';

// export function getContract(
//   address: string,
//   ABI: AbiItem[],
//   library: any,
// ): any {
//   if (!address || !isAddress(address)) {
//     throw Error(`Invalid 'address' parameter '${address}'.`);
//   }
//   const web3 = new Web3(library);
//   return new web3.eth.Contract(ABI as AbiItem[], address);
// }

function useContract(
  address: string | undefined,
  ABI: any,
  withSignerIfPossible = true,
): Contract | null {
  const { library, account } = useActiveWeb3React();

  return useMemo(() => {
    if (!address || !ABI || !library) return null;
    try {
      return getContract(
        address,
        ABI,
        library,
        withSignerIfPossible && account ? account : undefined,
      );
    } catch (error) {
      console.error('Failed to get contract', error);
      return null;
    }
  }, [address, ABI, library, withSignerIfPossible, account]);
}

export function useTwapContract(): Contract | null {
  return useContract(TWAP_CONTRACT_ADDRESS, twapAbi);
}
