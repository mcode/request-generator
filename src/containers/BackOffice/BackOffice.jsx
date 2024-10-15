import React, { memo, useEffect, useContext } from 'react';
import BusinessIcon from '@mui/icons-material/Business';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import Box from '@mui/material/Box';
import { Button } from '@mui/material';
import { Container } from '@mui/system';
import Dashboard from './Dashboard';
import Index from '../Index';
import useStyles from './styles';

import { logout } from '../../util/auth';

const BackOffice = (props) => {
  const classes = useStyles();
  const { client, token } = props;

  useEffect(() => {
    document.title = 'EHR | Back Office';
  }, []);

  return (

    <Box>
      { token && client ? (
      <Box>

        <div className='backoffice-app'>
        <Container maxWidth="false">
            <div className="containerg">
              <div className="logo">
                <BusinessIcon
                  sx={{ color: 'white', fontSize: 60, paddingTop: 2.5, paddingRight: 2.5 }}
                />
                <h1><strong>EHR</strong> Back Office </h1>
              </div>
              <span className={classes.loginIcon}>
                <AccountBoxIcon sx={{ fontSize: 60, verticalAlign: 'middle' }} /> {token.name}
                <Button variant="outlined" className={classes.whiteButton} onClick={logout}>
                  Logout
                </Button>
              </span>
            </div>
        </Container>
        </div>
        <Dashboard client={client} token={token} />
    
      </Box>
      ) : (
        <Index></Index>
      ) }

    </Box>

   
  );
};

export default memo(BackOffice);
