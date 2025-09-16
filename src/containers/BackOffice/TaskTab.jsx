import React from 'react';
import { useContext, useState, useEffect } from 'react';

import { Button, Box, Container, Grid, IconButton } from '@mui/material';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonIcon from '@mui/icons-material/Person';
import RefreshIcon from '@mui/icons-material/Refresh';

import { actionTypes } from '../ContextProvider/reducer';

import PatientSearchBar from '../../components/RequestBox/PatientSearchBar/PatientSearchBar.jsx';
import TasksSection from '../../components/RequestDashboard/TasksSection';
import { SettingsContext } from '../ContextProvider/SettingsProvider.jsx';
import useStyles from './styles';

const TaskTab = props => {
  const { client, token } = props;
  const [globalState, dispatch] = useContext(SettingsContext);
  const [state, setState] = useState({
    loading: false,
    patient: {},
    user: null,
    expanded: false,
    patientList: [],
    response: {},
    code: null,
    codeSystem: null,
    display: null,
    request: {},
    showSettings: false,
    token: null,
    client: client,
    medicationDispense: null,
    lastCheckedMedicationTime: null,
    prefetchCompleted: false,
    medicationRequests: {}
  });
  const classes = useStyles();

  const getPatients = () => {
    if (globalState.patientFhirQuery) {
      client
        .request(globalState.patientFhirQuery, { flat: true })
        .then(result => {
          setState(prevState => ({ ...prevState, patientList: result }));
        })
        .catch(e => {
          setState(prevState => ({ ...prevState, patientList: e }));
          console.log(e);
        });
    }
  };

  useEffect(() => {
    if (state.client) {
      // Call patients on load of page
      getPatients();
    }
    // if use default user is set, use default user otherwise use logged in user if set
    let currentUser = globalState.useDefaultUser
      ? globalState.defaultUser
      : token.userId
        ? token.userId
        : globalState.defaultUser;
    setState(prevState => ({ ...prevState, user: currentUser }));
  }, []);

  const updateStateElement = (elementName, text) => {
    if (elementName === 'patient') {
      setState(prevState => ({ ...prevState, patient: text }));
      dispatch({
        type: actionTypes.updatePatient,
        value: text
      });
    } else {
      setState(prevState => ({
        ...prevState,
        [elementName]: text
      }));
    }
  };

  const updateStateMap = (elementName, key, text) => {
    setState(prevState => ({
      ...prevState,
      [elementName]: { ...prevState[elementName], [key]: text }
    }));
  };

  const clearState = () => {
    setState(prevState => ({
      ...prevState,
      response: {}
    }));
  };

  const handleChange = () => (event, isExpanded) => {
    setState(prevState => ({
      ...prevState,
      expanded: isExpanded ? true : false
    }));
  };

  return (
    <Container maxWidth="lg">
      <Grid container spacing={2} padding={2}>
        <Grid item xs={11}>
          <Accordion expanded={state.expanded} onChange={handleChange()}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel1a-content"
              id="panel1a-header"
            >
              <Button
                variant="contained"
                startIcon={<PersonIcon />}
                style={{ padding: '10px', paddingLeft: '20px', paddingRight: '20px' }}
              >
                Select a patient
              </Button>
              <span style={{ width: '30px' }}></span>
              {state.patient?.name ? (
                // Display the first name
                <span>
                  <h4>
                    {state.patient?.name?.[0]?.given?.[0] + ' ' + state.patient?.name?.[0]?.family}
                  </h4>
                </span>
              ) : (
                <span>
                  <h4>All Patients</h4>
                </span>
              )}
            </AccordionSummary>
            <AccordionDetails>
              {state.patientList.length > 0 && state.expanded && (
                <div>
                  <Box>
                    {state.patientList instanceof Error ? (
                      renderError()
                    ) : (
                      <PatientSearchBar
                        getPatients={getPatients}
                        searchablePatients={state.patientList}
                        client={client}
                        request={state.request}
                        launchUrl={globalState.launchUrl}
                        callback={updateStateElement}
                        callbackMap={updateStateMap}
                        clearCallback={clearState}
                        responseExpirationDays={globalState.responseExpirationDays}
                        user={state.user}
                        showButtons={false}
                      />
                    )}
                  </Box>
                </div>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>
        <Grid item xs={1} alignContent="center" justifyContent="center">
          <IconButton color="primary" onClick={() => getPatients()} size="large">
            <RefreshIcon fontSize="large" />
          </IconButton>
        </Grid>
      </Grid>

      <TasksSection client={client} userName={token.name} userId={token.userId}></TasksSection>
    </Container>
  );
};

export default TaskTab;
