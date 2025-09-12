import { useContext, useState, useEffect } from 'react';
import { Button, Box, Grid, IconButton } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import RefreshIcon from '@mui/icons-material/Refresh';
import DisplayBox from '../components/DisplayBox/DisplayBox.jsx';
import '../index.css';
import RequestBox from '../components/RequestBox/RequestBox.jsx';
import buildRequest from '../util/buildRequest.js';
import { types, PATIENT_VIEW } from '../util/data.js';
import { createJwt } from '../util/auth.js';
import { getMedicationSpecificCdsHooksUrl, prepPrefetch } from '../util/util.js';

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PatientSearchBar from '../components/RequestBox/PatientSearchBar/PatientSearchBar.jsx';
import { MedicationStatus } from '../components/MedicationStatus/MedicationStatus.jsx';
import { actionTypes } from './ContextProvider/reducer.js';

import axios from 'axios';
import { EtasuStatus } from '../components/EtasuStatus/EtasuStatus';
import { SettingsContext } from './ContextProvider/SettingsProvider.jsx';

const RequestBuilder = props => {
  const { client } = props;
  const [globalState, dispatch] = useContext(SettingsContext);
  const [state, setState] = useState({
    loading: false,
    patient: {},
    user: null,
    expanded: true,
    patientList: [],
    response: {},
    code: null,
    codeSystem: null,
    display: null,
    prefetchedResources: new Map(),
    request: {},
    showSettings: false,
    token: props.token,
    client: client,
    medicationDispense: null,
    lastCheckedMedicationTime: null,
    prefetchCompleted: false,
    medicationRequests: {}
  });
  const displayRequestBox = !!globalState.patient?.id;

  useEffect(() => {
    console.log('Prefetched Resources updated:');
    console.log(state.prefetchedResources);
  }, [state.prefetchedResources]);

  const isOrderNotSelected = () => {
    return Object.keys(state.request).length === 0;
  };

  const disableGetMedicationStatus = isOrderNotSelected() || state.loading || globalState.disableMedicationStatus;
  const disableGetEtasu = isOrderNotSelected() || state.loading;
  const getMedicationStatus = () => {
    setState(prevState => ({
      ...prevState,
      lastCheckedMedicationTime: Date.now()
    }));

    axios.get(`${globalState.ehrUrl}/MedicationDispense?prescription=${state.request.id}`).then(
      response => {
        const bundle = response.data;
        setState(prevState => ({
          ...prevState,
          medicationDispense: bundle.entry?.[0].resource
        }));
      },
      error => {
        console.log('Was not able to get medication status', error);
      }
    );
  };

  useEffect(() => {
    if (state.client) {
      // Call patients on load of page
      getPatients();
      dispatch({
        type: actionTypes.updateSetting,
        settingId: 'baseUrl',
        value: state.client.state.serverUrl
      });
      dispatch({
        type: actionTypes.updateSetting,
        settingId: 'ehrUrl',
        value: state.client.state.serverUrl
      });
    }

    // if use default user is set, use default user otherwise use logged in user if set
    let currentUser = globalState.useDefaultUser ? globalState.defaultUser : (state.userId ? state.userId : globalState.defaultUser);
    setState(prevState => ({...prevState, user: currentUser}));
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

  const getMedicationRequests = patientId => {
    client
      .request(`MedicationRequest?subject=Patient/${patientId}`, {
        resolveReferences: ['subject', 'performer', 'medicationReference'],
        graph: false,
        flat: true
      })
      .then(result => {
        setState(prevState => ({ ...prevState, medicationRequests: result }));
      });
  };

  useEffect(() => {
    const hook = globalState.hookToSend;

    let remsAdminUrls = [];
    // get all the remsAdminUrl for each MedicationRequest
    state.medicationRequests?.data?.forEach(request => {
      const remsAdminUrl = getMedicationSpecificCdsHooksUrl(request, globalState, hook);
      if (remsAdminUrl) {
        remsAdminUrls.push(remsAdminUrl);
      }
      //sendHook(prefetch, request, patient, hook, remsAdminUrl);
    });
    const uniqueUrls = [...new Set(remsAdminUrls.map(item => item))];

    uniqueUrls?.forEach(url => {
      sendHook(prepPrefetch(state.prefetchedResources), null, globalState.patient, hook, url);
    });
  }, [state.medicationRequests]);

  const submitInfo = (prefetch, request, patient, hook) => {
    console.log('Initiating form submission ', types.info);
    let remsAdminUrl = null;
    if (request) {
      remsAdminUrl = getMedicationSpecificCdsHooksUrl(request, globalState, hook);
      sendHook(prefetch, request, patient, hook, remsAdminUrl);
    } else {
      // get all MedicationRequests for the patient, then continue
      getMedicationRequests(patient.id);
    }
  };

  const sendHook = (prefetch, request, patient, hook, remsAdminUrl) => {
    setState(prevState => ({
      ...prevState,
      loading: !!remsAdminUrl,
      patient
    }));

    if (!remsAdminUrl) {
      return;
    }

    const hookConfig = {
      includeConfig: globalState.includeConfig,
      alternativeTherapy: globalState.alternativeTherapy
    };
    let user = state.user;
    let json_request = buildRequest(
      request,
      user,
      patient,
      globalState.ehrUrlSentToRemsAdminForPreFetch,
      state.client.state.tokenResponse,
      prefetch,
      globalState.sendPrefetch,
      hook,
      hookConfig,
      'pharm0111'
    );

    let baseUrl = globalState.baseUrl;

    const headers = {
      'Content-Type': 'application/json'
    };
    if (globalState.generateJsonToken) {
      const jwt = 'Bearer ' + createJwt(baseUrl, remsAdminUrl);
      headers.authorization = jwt;
    }

    try {
      fetch(remsAdminUrl, {
        method: 'POST',
        headers: new Headers(headers),
        body: JSON.stringify(json_request)
      })
        .then(response => {
          response.json().then(fhirResponse => {
            console.log(fhirResponse);
            if (fhirResponse?.status) {
              console.log(
                'Server returned status ' + fhirResponse.status + ': ' + fhirResponse.error
              );
              console.log(fhirResponse.message);
            } else {
              if (response?.url?.includes(PATIENT_VIEW)) {
                // copy the cards from the old response into the new
                setState(prevState => ({
                  ...prevState,
                  response: { cards: [...(prevState.response.cards || []), ...fhirResponse.cards] }
                }));
              } else {
                setState(prevState => ({ ...prevState, response: fhirResponse }));
              }
            }
            setState(prevState => ({ ...prevState, loading: false }));
          });
        })
        .catch(() => {
          console.log('No response received from the server', types.error);
          setState(prevState => ({ ...prevState, response: {}, loading: false }));
        });
    } catch (error) {
      setState(prevState => ({ ...prevState, loading: false }));
      console.log('Unexpected error occurred', types.error);
      if (error instanceof TypeError) {
        console.log(error.name + ': ' + error.message);
      }
    }
  };

  const getPatients = () => {
    setState(prevState => ({ ...prevState, expanded: false }));
    if (globalState.patientFhirQuery) {
      client
        .request(globalState.patientFhirQuery, { flat: true })
        .then(result => {
          setState(prevState => ({ ...prevState, patientList: result, expanded: true }));
        })
        .catch(e => {
          setState(prevState => ({ ...prevState, patientList: e }));
          console.log(e);
        });
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
      prefetchedResources: new Map(),
      practitioner: {},
      coverage: {},
      response: {}
    }));
  };

  const handleChange = () => (event, isExpanded) => {
    setState(prevState => ({
      ...prevState,
      expanded: isExpanded ? true : false
    }));
  };

  const renderError = () => {
    return (
      <span className="patient-error">
        Encountered Error: Try Refreshing The Client <br /> {state.patientList.message}{' '}
      </span>
    );
  };

  return (
    <>
      <Grid container spacing={2} padding={2}>
        <Grid item xs={11}>
          <Accordion expanded={state.expanded} onChange={handleChange()}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel1a-content"
              id="panel1a-header"
            >
              <Button variant="contained" startIcon={<PersonIcon />} style={{padding:'10px',paddingLeft:'20px', paddingRight:'20px'}}>
                Select a patient
              </Button>
              <span style={{ width: '30px'}}></span>
              {state.patient?.name ? (
                // Display the first name
                <span><h4>{state.patient?.name?.[0]?.given?.[0] + ' ' + state.patient?.name?.[0]?.family}</h4></span>
              ) : (
                <span><h4>All Patients</h4></span>
              )}
            </AccordionSummary>
            <AccordionDetails>
              {state.patientList.length > 0 && state.expanded && (
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
                      showButtons={true}
                    />
                  )}
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>
        <Grid item xs={1} alignContent="center" justifyContent="center">
          <IconButton color="primary" onClick={() => getPatients()} size="large">
            <RefreshIcon fontSize="large" />
          </IconButton>
        </Grid>

        <Grid item container className="form-group" xs={12} md={6} spacing={2}>
          {displayRequestBox && (
            <Grid item>
              <RequestBox
                ehrUrl={globalState.ehrUrl}
                submitInfo={submitInfo}
                access_token={state.token}
                client={state.client}
                fhirServerUrl={globalState.baseUrl}
                fhirVersion={'r4'}
                patientId={globalState.patient.id}
                patient={globalState.patient}
                request={state.request}
                response={state.response}
                code={state.code}
                codeSystem={state.codeSystem}
                display={state.display}
                prefetchedResources={state.prefetchedResources}
                launchUrl={globalState.launchUrl}
                responseExpirationDays={globalState.responseExpirationDays}
                pimsUrl={globalState.pimsUrl}
                smartAppUrl={globalState.smartAppUrl}
                user={state.user}
                loading={state.loading}
                patientFhirQuery={globalState.patientFhirQuery}
                prefetchCompleted={state.prefetchCompleted}
              />
            </Grid>
          )}
          <Grid item container justifyContent="center" textAlign="center" spacing={2}>
            {!disableGetEtasu && (
              <Grid item>
                <EtasuStatus code={state.code} request={state.request} />
              </Grid>
            )}
            {!disableGetMedicationStatus && (
              <Grid item>
                <MedicationStatus
                  ehrUrl={globalState.ehrUrl}
                  request={state.request}
                  medicationDispense={state.medicationDispense}
                  getMedicationStatus={getMedicationStatus}
                  lastCheckedMedicationTime={state.lastCheckedMedicationTime}
                />
              </Grid>
            )}
          </Grid>
        </Grid>

        <Grid item container xs={12} md={6}>
          <DisplayBox
            response={state.response}
            client={state.client}
            patientId={globalState.patient?.id}
            ehrLaunch={true}
          />
        </Grid>
      </Grid>
    </>
  );
};

export default RequestBuilder;
