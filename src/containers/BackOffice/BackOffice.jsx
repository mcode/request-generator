import React, { memo, useEffect, useContext } from 'react';
import BusinessIcon from '@mui/icons-material/Business';
import Box from '@mui/material/Box';
import { Container } from '@mui/system';
import { SettingsContext } from '../ContextProvider/SettingsProvider';
import Dashboard from './Dashboard';

const BackOffice = (props) => {
  const { client } = props;
  const [, dispatch] = useContext(SettingsContext);

  useEffect(() => {
      document.title = 'EHR | Back Office';
  }, []);

  return (
    <Box>
      <div className='backoffice-app'>
      <Container maxWidth="false">
          <div className="containerg">
            <div className="logo">
              <BusinessIcon
                sx={{ color: 'white', fontSize: 60, paddingTop: 2.5, paddingRight: 2.5 }}
              />
              <h1>Back Office </h1>
            </div>
          </div>
        </Container>
      </div>
      <Dashboard client={client}/>
    </Box>
   
  );
};

export default memo(BackOffice);
