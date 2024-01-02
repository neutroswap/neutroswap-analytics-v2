import { Helmet } from 'react-helmet'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import React from 'react'

const WEBSITE_HOST_URL = 'https://analytics.neutroswap.io'

const Meta = ({ location }: RouteComponentProps): JSX.Element => {
  return (
    <Helmet>
      <link rel="canonical" href={`${WEBSITE_HOST_URL}${location.pathname}`} />
    </Helmet>
  )
}

export default withRouter(Meta)
