import React, { useState, useEffect, useContext } from 'react';

import { Box, Tab, Tabs, Button } from '@mui/material';
import { Container } from '@mui/system';
import SettingsSection from '../../components/RequestDashboard/SettingsSection';
import { SettingsContext } from '../ContextProvider/SettingsProvider';
import TaskTab from './TaskTab';

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`
  };
}

export default function Dashboard(props) {
  const { client, token } = props;
  const [headerStyle, setHeaderStyle] = useState(undefined);
  const [globalState, dispatch, updateSetting, readSettings] = React.useContext(SettingsContext);
  console.log('global state patient -- > ', globalState.patient);

  useEffect(() => {
    readSettings();
    const updateScrollState = () => {
      var threshold = 10;
      if (window.scrollY > threshold) {
        setHeaderStyle('true');
      } else {
        setHeaderStyle(undefined);
      }
    };
    document.addEventListener('scroll', updateScrollState);
    return () => document.removeEventListener('scroll', updateScrollState);
  }, []);

  const [tabIndex, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <div>
      <Container maxWidth="xl">
        <Box
          sx={{
            width: '100%',
            border: 1,
            borderRadius: '5px',
            borderWidth: 4,
            borderColor: '#F1F3F4',
            backgroundColor: '#E7EBEF'
          }}
        >
          <Box sx={{ backgroundColor: '#F1F3F4', borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabIndex} onChange={handleChange} aria-label="basic tabs example" centered>
              <Tab label="Tasks" {...a11yProps(0)} />
              <Tab label="Settings" {...a11yProps(1)} />
            </Tabs>
          </Box>

          <Box>
            <Box sx={{ padding: 2 }}>
              {tabIndex === 0 && (
                <Box>
                  <TaskTab client={client} token={token}></TaskTab>
                </Box>
              )}
              {tabIndex === 1 && (
                <Box>
                  <SettingsSection client={client}></SettingsSection>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Container>
    </div>
  );
}
