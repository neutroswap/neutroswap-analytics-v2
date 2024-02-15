import { ethers } from 'ethers'
import { Multicall } from 'ethereum-multicall'
import React, { useEffect, useState } from 'react'
import { withRouter } from 'react-router-dom'
import { Flex, Box } from 'rebass'
import styled from 'styled-components'

import { RowFixed, RowBetween } from '../components/Row'
import { AutoColumn } from '../components/Column'
import Search from '../components/Search'

import { useMedia } from 'react-use'
import Panel from '../components/Panel'
import { TYPE, ThemedBackground } from '../Theme'
import { transparentize } from 'polished'

import { PageWrapper, ContentWrapper } from '../components'
import { DIVIDEND_ADDRESS, NEUTRO_HELPER_ABI, YIELD_BOOSTER_ADDRESS } from '../constants'

const Header = styled.div`
  width: 100%;
  position: sticky;
  top: 0;
`

const Medium = styled.span`
  font-weight: 500;
`

const GridRow = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: 1fr 1fr;
  column-gap: 6px;
  align-items: start;
  justify-content: space-between;
`

function Plugins() {
  const below1180 = useMedia('(max-width: 1180px)')
  const below1024 = useMedia('(max-width: 1024px)')
  const below400 = useMedia('(max-width: 400px)')
  const below816 = useMedia('(max-width: 816px)')
  const below800 = useMedia('(max-width: 800px)')

  const [xNeutroPrice, setXNeutroPrice] = useState()
  const [xNeutroInDividend, setXNeutroInDividend] = useState()
  const [xNeutroInYieldBooster, setXNeutroInYieldBooster] = useState()
  const [pluginsTvl, setPluginsTvl] = useState()
  const [totalAllocated, setTotalAllocated] = useState()

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
        let xneutroPriceRaw = new ethers.utils.BigNumber(
          results.results.neutroHelper.callsReturnContext[0].returnValues[0].hex
        )
        let xneutroPrice = Number(ethers.utils.formatEther(xneutroPriceRaw)).toFixed(6)
        setXNeutroPrice(xneutroPrice)
        let allocatedToDividend = new ethers.utils.BigNumber(
          results.results.dividendHelper.callsReturnContext[0].returnValues[0].hex
        )
          .div(ethers.utils.parseEther('1'))
          .toString()
        setXNeutroInDividend(allocatedToDividend)
        let allocatedToYieldBooster = new ethers.utils.BigNumber(
          results.results.yieldBoosterHelper.callsReturnContext[0].returnValues[0].hex
        )
          .div(ethers.utils.parseEther('1'))
          .toString()
        setXNeutroInYieldBooster(allocatedToYieldBooster)
        let pluginsTvl = (
          (Number(allocatedToDividend) + Number(allocatedToYieldBooster)) *
          Number(xneutroPrice)
        ).toLocaleString()
        setPluginsTvl(pluginsTvl)
        let totalAllocated = (Number(allocatedToDividend) + Number(allocatedToYieldBooster)).toLocaleString()
        setTotalAllocated(totalAllocated)
      } catch (err) {
        console.log('error ', err)
      }
    }
    fetchData()
  }, [])

  return (
    <PageWrapper>
      <ThemedBackground backgroundColor={transparentize(0.6, '#FF5757')} />
      <ContentWrapper>
        <div>
          <AutoColumn gap="24px" style={{ paddingBottom: below800 ? '0' : '24px', height: '100%' }}>
            <TYPE.largeHeader>{below800 ? 'Neutroswap V2' : 'Neutroswap Analytics'}</TYPE.largeHeader>
            <Search />
            <Header>
              <RowBetween style={{ padding: below816 ? '0.5rem' : '.5rem' }}>
                <RowFixed>
                  {!below400 && (
                    <TYPE.main mr={'1rem'}>
                      NEUTRO Price: <Medium>${xNeutroPrice ? xNeutroPrice : '-'}</Medium>
                    </TYPE.main>
                  )}

                  {!below1180 && (
                    <TYPE.main mr={'1rem'}>
                      Plugins TVL: <Medium>${pluginsTvl ? pluginsTvl : '-'}</Medium>
                    </TYPE.main>
                  )}
                  {!below1024 && (
                    <TYPE.main mr={'1rem'}>
                      Total Allocated xNEUTRO: <Medium>{totalAllocated ? totalAllocated : '-'} $xNEUTRO</Medium>
                    </TYPE.main>
                  )}
                </RowFixed>
              </RowBetween>
            </Header>
          </AutoColumn>
          {below800 && ( // mobile card
            <Box mb={20}>
              <Panel>
                <Box>
                  <AutoColumn gap="36px">
                    <AutoColumn gap="20px">
                      <Panel style={{ height: '100%' }}>
                        <Flex>
                          <TYPE.header>xNEUTRO allocated in Dividend Plugin</TYPE.header>
                        </Flex>
                        <Flex style={{ margin: '2px' }}>
                          <TYPE.largeHeader>
                            {xNeutroInDividend ? Number(xNeutroInDividend).toLocaleString() : '-'} $xNEUTRO
                          </TYPE.largeHeader>
                        </Flex>
                      </Panel>
                      <Panel style={{ height: '100%' }}>
                        <Flex>
                          <TYPE.header>xNEUTRO allocated in Yield Booster Plugin</TYPE.header>
                        </Flex>
                        <Flex>
                          <TYPE.largeHeader>
                            {xNeutroInYieldBooster ? Number(xNeutroInYieldBooster).toLocaleString() : '-'} $xNEUTRO
                          </TYPE.largeHeader>
                        </Flex>
                      </Panel>
                    </AutoColumn>
                  </AutoColumn>
                </Box>
              </Panel>
            </Box>
          )}
          {!below800 && (
            <GridRow>
              <Panel style={{ height: '100%' }}>
                <Flex>
                  <TYPE.header>xNEUTRO allocated in Dividend Plugin</TYPE.header>
                </Flex>
                <Flex style={{ margin: '2px' }}>
                  <TYPE.largeHeader>
                    {xNeutroInDividend ? Number(xNeutroInDividend).toLocaleString() : '-'} $xNEUTRO
                  </TYPE.largeHeader>
                </Flex>
              </Panel>
              <Panel style={{ height: '100%' }}>
                <Flex>
                  <TYPE.header>xNEUTRO allocated in Yield Booster Plugin</TYPE.header>
                </Flex>
                <Flex>
                  <TYPE.largeHeader>
                    {xNeutroInYieldBooster ? Number(xNeutroInYieldBooster).toLocaleString() : '-'} $xNEUTRO
                  </TYPE.largeHeader>
                </Flex>
              </Panel>
            </GridRow>
          )}
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default withRouter(Plugins)
