import React from 'react';
import { Button, Box, Text, Page } from '@wix/design-system';

export default function Home() {
  return (
    <Page>
      <Box padding="20px">
        <Text size="medium" tagName="h1" weight="bold">Welcome to Form Management</Text>
        <Box marginTop="12px" marginBottom="24px">
          <Text>Your dashboard is ready to be customized!</Text>
        </Box>
        <Button>Get Started</Button>
      </Box>
    </Page>
  );
}
