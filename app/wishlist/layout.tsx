import * as React from 'react'
import { SiteChrome } from './site-chrome'

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <SiteChrome>{children}</SiteChrome>
}
