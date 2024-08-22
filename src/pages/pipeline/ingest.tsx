// pages/ingest.tsx (or /pages/ingest/index.tsx)
import styles from '@/styles/Home.module.css';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import React, { useEffect } from 'react';
import { Connections } from '@/components/Connections/Connections';
import { Sources } from '@/components/Sources/Sources';
import { Destinations } from '@/components/Destinations/Destinations';
import { PageHead } from '@/components/PageHead';
import { ConnectionSyncLogsProvider } from '@/contexts/ConnectionSyncLogsContext';
import { useRouter } from 'next/router';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

export default function Ingest() {
  const router = useRouter();
  const { tab }: any = router.query;

  const tabsObj: { [key: string]: number } = {
    connections: 0,
    sources: 1,
    warehouse: 2
  }
  const reverseTabsObj = Object.entries(tabsObj).reduce(
    (acc, [key, value]) => ({ ...acc, [value]: key }),
    {} as { [key: number]: string }
  );
  const currentTab = tab ? tabsObj[tab] : 0;
  const [value, setValue] = React.useState(currentTab);

  useEffect(() => {
    if (!tab || !tabsObj[tab]) {
      router.push(`/pipeline/ingest?tab=${"connections"}`, undefined, { shallow: true });
    }
    setValue(currentTab);
  }, [currentTab]);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    const tabName = reverseTabsObj[newValue];
    router.push(`/pipeline/ingest?tab=${tabName}`, undefined, { shallow: true });
  };

  return (
    <>
      <PageHead title="Dalgo" />
      <main className={styles.main}>
        <Typography
          sx={{ fontWeight: 700 }}
          variant="h4"
          gutterBottom
          color="#000"
        >
          Ingest
        </Typography>
        <Box sx={{ borderBottom: 1, borderColor: '#DDDDDD' }}>
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="ingestion tabs"
          >
            <Tab
              label="Connections"
              sx={{ mr: 4 }}
              className="connections_walkthrough"
            />
            <Tab
              label="Sources"
              sx={{ mr: 4 }}
              className="sources_walkthrough"
            />
            <Tab label="Your Warehouse" className="warehouse_walkthrough" />
          </Tabs>
        </Box>
        <TabPanel value={value} index={0}>
          <ConnectionSyncLogsProvider>
            <Connections />
          </ConnectionSyncLogsProvider>
        </TabPanel>
        <TabPanel value={value} index={1}>
          <Sources />
        </TabPanel>
        <TabPanel value={value} index={2}>
          <Destinations />
        </TabPanel>
      </main>
    </>
  );
}
