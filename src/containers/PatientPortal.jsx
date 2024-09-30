import React, { memo, useState, useEffect } from 'react';
import useStyles from './styles/styles';
import FHIR from 'fhirclient';
import Login from '../components/Auth/Login';
import Dashboard from '../components/Dashboard/Dashboard';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import env from 'env-var';
import { actionTypes } from './ContextProvider/reducer';
import { SettingsContext } from './ContextProvider/SettingsProvider';
import { getPatientFirstAndLastName } from '../util/util';

const PatientPortal = () => {
  const classes = useStyles();
  const [token, setToken] = useState(null);
  const [client, setClient] = useState(null);
  const [patientName, setPatientName] = useState(null);
  const [, dispatch] = React.useContext(SettingsContext);

  useEffect(() => {
    if (token) {
      const data = JSON.parse(Buffer.from(token.split('.')[1], 'base64'));
      const client = FHIR.client({
        serverUrl: env.get('VITE_EHR_BASE').asString(),
        tokenResponse: {
          type: 'bearer',
          access_token: token,
          patient: data.patientId
        }
      });
      client.request(`Patient/${client.patient.id}`).then(patient => {
        setPatientName(getPatientFirstAndLastName(patient));
        dispatch({
          type: actionTypes.updatePatient,
          value: patient
        });
      });
      setClient(client);
      document.title = 'EHR | Patient Portal';
    }
  }, [token]);

  const logout = () => {
    setClient(null);
    setPatientName(null);
  };

  return (
    <div className={classes.background}>
      <AppBar position="fixed" sx={{ zIndex: 1300, backgroundColor: '#bb3551', height: '95px' }}>
        <Toolbar>
          <Typography variant="h5" noWrap component="div" sx={{ lineHeight: '95px' }}>
            <strong>EHR</strong> Patient Portal
          </Typography>
          {patientName ? (
            <span className={classes.loginIcon}>
              <AccountBoxIcon sx={{ fontSize: 60, verticalAlign: 'middle' }} /> {patientName}
            </span>
          ) : null}
        </Toolbar>
      </AppBar>
      {token && client ? (
        <Dashboard client={client} logout={logout}></Dashboard>
      ) : (
        <Login tokenCallback={setToken}></Login>
      )}
    </div>
  );
};

export default memo(PatientPortal);
