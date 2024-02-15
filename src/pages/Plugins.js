import { ethers } from 'ethers'
import {
 Multicall,
 ContractCallResults,
 ContractCallContext,
} from 'ethereum-multicall';

import React, { useEffect, useState } from 'react'
import { withRouter } from 'react-router-dom'
import { Box } from 'rebass'
import styled from 'styled-components'

import { AutoRow, RowBetween } from '../components/Row'
import { AutoColumn } from '../components/Column'
import PairList from '../components/PairList'
import TopTokenList from '../components/TokenList'
import TxnList from '../components/TxnList'
import GlobalChart from '../components/GlobalChart'
import Search from '../components/Search'
import GlobalStats from '../components/GlobalStats'

import { useGlobalData, useGlobalTransactions } from '../contexts/GlobalData'
import { useAllPairData } from '../contexts/PairData'
import { useMedia } from 'react-use'
import Panel from '../components/Panel'
import { useAllTokenData } from '../contexts/TokenData'
import { formattedNum, formattedPercent } from '../utils'
import { TYPE, ThemedBackground } from '../Theme'
import { transparentize } from 'polished'
import { CustomLink } from '../components/Link'

import { PageWrapper, ContentWrapper } from '../components'
import CheckBox from '../components/Checkbox'
import QuestionHelper from '../components/QuestionHelper'
import { DIVIDEND_ADDRESS, NEUTRO_HELPER_ABI, YIELD_BOOSTER_ADDRESS } from '../constants';



const ListOptions = styled(AutoRow)`
  height: 40px;
  width: 100%;
  font-size: 1.25rem;
  font-weight: 600;

  @media screen and (max-width: 640px) {
    font-size: 1rem;
  }
`

const GridRow = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: 1fr 1fr;
  column-gap: 6px;
  align-items: start;
  justify-content: space-between;
`

function Plugins () {
 const below800 = useMedia('(max-width: 800px)')


 useEffect(() => {
  async function fetchData () {
   // let provider = await new ethers.providers.JsonRpcProvider("https://api.evm.eosnetwork.com")
   // console.log("provider wtf r", provider)
    // you can use any ethers provider context here this example is
    // just shows passing in a default provider, ethers hold providers in
    // other context like wallet, signer etc all can be passed in as well.
    const multicall = new Multicall({ 
     nodeUrl: "https://api.evm.eosnetwork.com",
     // ethersProvider: provider, 
     tryAggregate: true,
     multicallCustomContractAddress: '0xD6d6D1CA4a2caF75B9E2F8e3DAc55e6fdAA07f35'
    });

    // this is showing you having the same context for all `ContractCallContext` but you can also make this have
    // different context for each `ContractCallContext`, as `ContractCallContext<TContext>` takes generic `TContext`.
    const contractCallContext = [
        {
            reference: 'neutroHelper',
            contractAddress: '0xC99646D191063276Db6c38F98487d166fa5ceF30',
            abi: NEUTRO_HELPER_ABI,
            calls: [{ reference: 'neutroPrice', methodName: 'getNeutroPrice', methodParameters: [] }],
            // pass it in here!
            // context: {
            //   extraContext: 'extraContext',
            //   foo4: true
            // }
        },
        {
         reference: 'neutroHelper',
            contractAddress: '0xC99646D191063276Db6c38F98487d166fa5ceF30',
            abi: NEUTRO_HELPER_ABI,
            calls: [{ reference: 'allocatedToYieldBooster', methodName: 'totalAllocationAtPlugin', methodParameters: [YIELD_BOOSTER_ADDRESS] }],
        },
        {
         reference: 'neutroHelper',
            contractAddress: '0xC99646D191063276Db6c38F98487d166fa5ceF30',
            abi: NEUTRO_HELPER_ABI,
            calls: [{ reference: 'allocatedToDividend', methodName: 'totalAllocationAtPlugin', methodParameters: [DIVIDEND_ADDRESS] }],
        }
    ];
    console.log("trying ")
    try{
     const results = await multicall.call(contractCallContext);
     console.log("neutro price ? ", results.results.neutroHelper.callsReturnContext)
     console.log("neutro price ? ", results.results.neutroHelper.callsReturnContext[0].returnValues[0])
     console.log("resullttt ", results);
    }catch(err){
     console.log("error ", err)
    }
  }
  fetchData()
 }, [])

 return (
  <PageWrapper>
    <ThemedBackground backgroundColor={transparentize(0.6, '#FF5757')} />
    <ContentWrapper>
      <div>
        <AutoColumn gap='24px' style={{ paddingBottom: below800 ? '0' : '24px' }}>
          <TYPE.largeHeader>{below800 ? 'Neutroswap V2' : 'Neutroswap Analytics'}</TYPE.largeHeader>
          <Search />
          <GlobalStats />
        </AutoColumn>
        {below800 && ( // mobile card
          <Box mb={20}>
            <Panel>
              <Box>
                <AutoColumn gap='36px'>
                  <AutoColumn gap='20px'>
                    <RowBetween>
                      <TYPE.main>Volume (24hrs)</TYPE.main>
                      <div />
                    </RowBetween>
                    <RowBetween align='flex-end'>
                      {/* <TYPE.main fontSize={'1.5rem'} lineHeight={1} fontWeight={600}>
                        {oneDayVolumeUSD ? formattedNum(oneDayVolumeUSD, true) : '-'}
                      </TYPE.main> */}
                      {/* <TYPE.main fontSize={12}>{volumeChangeUSD ? formattedPercent(volumeChangeUSD) : '-'}</TYPE.main> */}
                    </RowBetween>
                  </AutoColumn>
                  <AutoColumn gap='20px'>
                    <RowBetween>
                      <TYPE.main>Total Liquidity</TYPE.main>
                      <div />
                    </RowBetween>
                    <RowBetween align='flex-end'>
                      <TYPE.main fontSize={'1.5rem'} lineHeight={1} fontWeight={600}>
                        {/* {totalLiquidityUSD ? formattedNum(totalLiquidityUSD, true) : '-'} */}
                      </TYPE.main>
                      <TYPE.main fontSize={12}>
                       1212
                        {/* {liquidityChangeUSD ? formattedPercent(liquidityChangeUSD) : '-'} */}
                      </TYPE.main>
                    </RowBetween>
                  </AutoColumn>
                </AutoColumn>
              </Box>
            </Panel>
          </Box>
        )}
        {!below800 && (
          <GridRow>
            <Panel style={{ height: '100%', minHeight: '300px' }}>
              <GlobalChart display='liquidity' />
            </Panel>
            <Panel style={{ height: '100%' }}>
              <GlobalChart display='volume' />
            </Panel>
          </GridRow>
        )}
        {below800 && (
          <AutoColumn style={{ marginTop: '6px' }} gap='24px'>
            <Panel style={{ height: '100%', minHeight: '300px' }}>
              <GlobalChart display='liquidity' />
            </Panel>
          </AutoColumn>
        )}
      </div>
    </ContentWrapper>
  </PageWrapper>
 )
}


export default withRouter(Plugins)