import React, { memo, useState, useEffect } from 'react';
import useStyles from './styles/styles';
import FHIR from 'fhirclient';
import Login from '../components/Auth/Login';
import Dashboard from '../components/Dashboard/Dashboard';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import PersonIcon from '@mui/icons-material/Person';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import MuiAlert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import env from 'env-var';
import { actionTypes } from './ContextProvider/reducer';
import { SettingsContext } from './ContextProvider/SettingsProvider';
import { getPatientFirstAndLastName } from '../util/util';

const PatientPortal = () => {
  const classes = useStyles();
  const [token, setToken] = useState(null);
  const [data, setData] = useState(null);
  const [client, setClient] = useState(null);
  const [patientName, setPatientName] = useState(null);
  const [, dispatch] = React.useContext(SettingsContext);

  useEffect(() => {
    if (token) {
      const data = JSON.parse(Buffer.from(token.split('.')[1], 'base64'));
      setData(data);
      const client = FHIR.client({
        serverUrl: env.get('VITE_EHR_BASE').asString(),
        tokenResponse: {
          type: 'bearer',
          access_token: token,
          patient: data.patientId
        }
      });
      if (client?.patient?.id) {
        client.request(`Patient/${client.patient.id}`).then(patient => {
          setPatientName(getPatientFirstAndLastName(patient));
          dispatch({
            type: actionTypes.updatePatient,
            value: patient
          });
        });
      }
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
      <AppBar position="fixed" sx={{ zIndex: 1300, backgroundColor: '#bb3551', height: '120px' }}>
        <Toolbar>
          <Typography variant="h4" noWrap component="div" sx={{ lineHeight: '120px' }}>
            <PersonIcon
              sx={{ color: 'white', fontSize: 60, paddingTop: 0, paddingRight: 2.5, verticalAlign: 'middle' }}
            />
            <strong>EHR</strong> Patient Portal
          </Typography>
          {patientName ? (
            <span className={classes.loginIcon}>
              <AccountBoxIcon sx={{ fontSize: 60, verticalAlign: 'middle' }} /> {patientName}
            </span>
          ) : null}
        </Toolbar>
      </AppBar>
      {token && client && patientName ? (
        <Dashboard client={client} logout={logout}></Dashboard>
      ) : (
        <div>
          { patientName ? ( '' ) : (
            <Snackbar
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left'
              }}
              open={(patientName == null) && (client != null)}
            >
              <MuiAlert severity="error" elevation={6} variant="filled">
                Error! {data?.name} is not a Patient
              </MuiAlert>
            </Snackbar>
          ) }
          <Login tokenCallback={setToken}></Login>
        </div>
      )}
    </div>
  );
};

export default memo(PatientPortal);
