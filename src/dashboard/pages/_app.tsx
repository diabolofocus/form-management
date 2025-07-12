import React from 'react';
import type { AppProps } from 'next/app';
import { WixDesignSystemProvider } from '@wix/design-system';
import '@wix/design-system/styles.global.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WixDesignSystemProvider>
      <Component {...pageProps} />
    </WixDesignSystemProvider>
  );
}

export default MyApp;
