import React, { useEffect, useState } from 'react'
import { withRouter } from 'react-router-dom'
import { Box, Flex } from 'rebass'
import styled from 'styled-components'
import { Multicall } from 'ethereum-multicall'
import { ethers } from 'ethers'

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
import { DIVIDEND_ADDRESS, NEUTRO_HELPER_ABI, YIELD_BOOSTER_ADDRESS } from '../constants'

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

function GlobalPage() {
  // get data for lists and totals
  const allPairs = useAllPairData()
  const allTokens = useAllTokenData()
  const transactions = useGlobalTransactions()
  const { totalLiquidityUSD, oneDayVolumeUSD, volumeChangeUSD, liquidityChangeUSD } = useGlobalData()

  console.log('totalLiquidityUSD', totalLiquidityUSD)

  const [pluginsTvl, setPluginsTvl] = useState()

  useEffect(() => {
    async function fetchData() {
      // let provider = await new ethers.providers.JsonRpcProvider("https://api.evm.eosnetwork.com")
      // console.log("provider wtf r", provider)
      // you can use any ethers provider context here this example is
      // just shows passing in a default provider, ethers hold providers in
      // other context like wallet, signer etc all can be passed in as well.
      const multicall = new Multicall({
        nodeUrl: 'https://api.evm.eosnetwork.com',
        // ethersProvider: provider,
        tryAggregate: true,
        multicallCustomContractAddress: '0xD6d6D1CA4a2caF75B9E2F8e3DAc55e6fdAA07f35',
      })

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
          reference: 'yieldBoosterHelper',
          contractAddress: '0xC99646D191063276Db6c38F98487d166fa5ceF30',
          abi: NEUTRO_HELPER_ABI,
          calls: [
            {
              reference: 'allocatedToYieldBooster',
              methodName: 'totalAllocationAtPlugin',
              methodParameters: [YIELD_BOOSTER_ADDRESS],
            },
          ],
        },
        {
          reference: 'dividendHelper',
          contractAddress: '0xC99646D191063276Db6c38F98487d166fa5ceF30',
          abi: NEUTRO_HELPER_ABI,
          calls: [
            {
              reference: 'allocatedToDividend',
              methodName: 'totalAllocationAtPlugin',
              methodParameters: [DIVIDEND_ADDRESS],
            },
          ],
        },
      ]
      try {
        const results = await multicall.call(contractCallContext)
        console.log('results', results)
        let xneutroPriceRaw = new ethers.utils.BigNumber(
          results.results.neutroHelper.callsReturnContext[0].returnValues[0].hex
        )
        let xneutroPrice = Number(ethers.utils.formatEther(xneutroPriceRaw)).toFixed(6)
        let allocatedToDividend = new ethers.utils.BigNumber(
          results.results.dividendHelper.callsReturnContext[0].returnValues[0].hex
        )
          .div(ethers.utils.parseEther('1'))
          .toString()
        let allocatedToYieldBooster = new ethers.utils.BigNumber(
          results.results.yieldBoosterHelper.callsReturnContext[0].returnValues[0].hex
        )
          .div(ethers.utils.parseEther('1'))
          .toString()
        let pluginsTvl = (Number(allocatedToDividend) + Number(allocatedToYieldBooster)) * Number(xneutroPrice)
        console.log('pluginsTvl', pluginsTvl)
        setPluginsTvl(pluginsTvl)
      } catch (err) {
        console.log('error ', err)
      }
    }
    fetchData()
  }, [])

  // breakpoints
  const below800 = useMedia('(max-width: 800px)')

  const totalTvl = pluginsTvl + totalLiquidityUSD

  // scrolling refs
  useEffect(() => {
    document.querySelector('body').scrollTo({
      behavior: 'smooth',
      top: 0,
    })
  }, [])

  // for tracked data on pairs
  const [useTracked, setUseTracked] = useState(true)

  return (
    <PageWrapper>
      <ThemedBackground backgroundColor={transparentize(0.6, '#FF5757')} />
      <ContentWrapper>
        <div>
          <AutoColumn gap="24px" style={{ paddingBottom: below800 ? '0' : '24px' }}>
            <TYPE.largeHeader>{below800 ? 'Neutroswap Analytics' : 'Neutroswap Analytics'}</TYPE.largeHeader>
            <Search />
            <GlobalStats />
          </AutoColumn>
          {below800 && ( // mobile card
            <Box mb={20}>
              <Panel>
                <Box>
                  <AutoColumn gap="36px">
                    <AutoColumn gap="20px">
                      <RowBetween>
                        <TYPE.main>Total Value Locked (Liquidity + xNEUTRO Plugins)</TYPE.main>
                        <div />
                      </RowBetween>
                      <RowBetween align="flex-end">
                        <TYPE.main fontSize={'1.5rem'} lineHeight={1} fontWeight={600}>
                          ${totalTvl ? totalTvl.toLocaleString() : '-'}
                        </TYPE.main>
                      </RowBetween>
                    </AutoColumn>
                    <AutoColumn gap="20px">
                      <RowBetween>
                        <TYPE.main>Volume (24hrs)</TYPE.main>
                        <div />
                      </RowBetween>
                      <RowBetween align="flex-end">
                        <TYPE.main fontSize={'1.5rem'} lineHeight={1} fontWeight={600}>
                          {oneDayVolumeUSD ? formattedNum(oneDayVolumeUSD, true) : '-'}
                        </TYPE.main>
                        <TYPE.main fontSize={12}>{volumeChangeUSD ? formattedPercent(volumeChangeUSD) : '-'}</TYPE.main>
                      </RowBetween>
                    </AutoColumn>
                    <AutoColumn gap="20px">
                      <RowBetween>
                        <TYPE.main>Total Liquidity</TYPE.main>
                        <div />
                      </RowBetween>
                      <RowBetween align="flex-end">
                        <TYPE.main fontSize={'1.5rem'} lineHeight={1} fontWeight={600}>
                          {totalLiquidityUSD ? formattedNum(totalLiquidityUSD, true) : '-'}
                        </TYPE.main>
                        <TYPE.main fontSize={12}>
                          {liquidityChangeUSD ? formattedPercent(liquidityChangeUSD) : '-'}
                        </TYPE.main>
                      </RowBetween>
                    </AutoColumn>
                  </AutoColumn>
                </Box>
              </Panel>
            </Box>
          )}
          {!below800 && (
            <>
              <Box style={{ marginBottom: '5px' }}>
                <Flex alignItems="center" justifyContent="center">
                  <Panel style={{ height: '100%' }}>
                    <Flex>
                      <TYPE.header>Total Value Locked (Liquidity + xNEUTRO Plugins)</TYPE.header>
                    </Flex>
                    <Flex style={{ margin: '2px' }}>
                      <TYPE.largeHeader>${totalTvl ? totalTvl.toLocaleString() : '-'}</TYPE.largeHeader>
                    </Flex>
                  </Panel>
                </Flex>
              </Box>
              <GridRow>
                <Panel style={{ height: '100%', minHeight: '300px' }}>
                  <GlobalChart display="liquidity" />
                </Panel>
                <Panel style={{ height: '100%' }}>
                  <GlobalChart display="volume" />
                </Panel>
              </GridRow>
            </>
          )}
          {below800 && (
            <AutoColumn style={{ marginTop: '6px' }} gap="24px">
              <Panel style={{ height: '100%', minHeight: '300px' }}>
                <GlobalChart display="liquidity" />
              </Panel>
            </AutoColumn>
          )}
          <ListOptions gap="10px" style={{ marginTop: '2rem', marginBottom: '.5rem' }}>
            <RowBetween>
              <TYPE.main fontSize={'1.125rem'} style={{ whiteSpace: 'nowrap' }}>
                Top Tokens
              </TYPE.main>
              <CustomLink to={'/tokens'}>See All</CustomLink>
            </RowBetween>
          </ListOptions>
          <Panel style={{ marginTop: '6px', padding: '1.125rem 0 ' }}>
            <TopTokenList tokens={allTokens} />
          </Panel>
          <ListOptions gap="10px" style={{ marginTop: '2rem', marginBottom: '.5rem' }}>
            <RowBetween>
              <TYPE.main fontSize={'1rem'} style={{ whiteSpace: 'nowrap' }}>
                Top Pairs
              </TYPE.main>
              <AutoRow gap="4px" width="100%" justifyContent="flex-end">
                <CheckBox
                  checked={useTracked}
                  setChecked={() => setUseTracked(!useTracked)}
                  text={'Hide untracked pairs'}
                />
                <QuestionHelper text="USD amounts may be inaccurate in low liquiidty pairs or pairs without EOS or stablecoins." />
                <CustomLink to={'/pairs'}>See All</CustomLink>
              </AutoRow>
            </RowBetween>
          </ListOptions>
          <Panel style={{ marginTop: '6px', padding: '1.125rem 0 ' }}>
            <PairList pairs={allPairs} useTracked={useTracked} />
          </Panel>
          <span>
            <TYPE.main fontSize={'1.125rem'} style={{ marginTop: '2rem' }}>
              Transactions
            </TYPE.main>
          </span>
          <Panel style={{ margin: '1rem 0' }}>
            <TxnList transactions={transactions} />
          </Panel>
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default withRouter(GlobalPage)
