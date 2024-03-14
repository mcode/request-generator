import React, { useState, useEffect } from 'react';
import { Button, Box, Grid, IconButton } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import RefreshIcon from '@mui/icons-material/Refresh';
import DisplayBox from '../components/DisplayBox/DisplayBox.js';
import '../index.css';
import RequestBox from '../components/RequestBox/RequestBox.js';
import buildRequest from '../util/buildRequest.js';
import { types } from '../util/data.js';
import { createJwt } from '../util/auth.js';

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PatientSearchBar from '../components/RequestBox/PatientSearchBar/PatientSearchBar.js';
import { MedicationStatus } from '../components/MedicationStatus/MedicationStatus.jsx';
import { actionTypes } from './ContextProvider/reducer.js';

import axios from 'axios';
import { EtasuStatus } from '../components/EtasuStatus/EtasuStatus';

const RequestBuilder = props => {
  const { globalState, dispatch, client } = props;
  const [state, setState] = useState({
    loading: false,
    patient: {},
    expanded: true,
    patientList: [],
    response: {},
    code: null,
    codeSystem: null,
    display: null,
    prefetchedResources: new Map(),
    request: {},
    showSettings: false,
    token: null,
    client: client,
    medicationDispense: null,
    lastCheckedMedicationTime: null,
    remsAdminResponse: {},
    lastCheckedEtasuTime: null
  });
  const displayRequestBox = !!globalState.patient?.id;

  const isOrderNotSelected = () => {
    return Object.keys(state.request).length === 0;
  };


  const disableGetMedicationStatus = isOrderNotSelected() || state.loading;
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

  const getEtasu = () => {
    setState(prevState => ({
      ...prevState,
      lastCheckedEtasuTime: Date.now()
    }));

    const patientFirstName = globalState.patient?.name?.at(0)?.given?.at(0);
    const patientLastName = globalState.patient?.name?.at(0)?.family;
    const patientDOB = globalState.patient?.birthDate;

    console.log(
      'get Etastu Status: ' +
        patientFirstName +
        ' ' +
        patientLastName +
        ' - ' +
        patientDOB +
        ' - ' +
        state.code
    );
    const etasuUrl = `${globalState.remsAdminServer}/etasu/met/patient/${patientFirstName}/${patientLastName}/${patientDOB}/drugCode/${state.code}`;
    axios({
      method: 'get',
      url: etasuUrl
    }).then(
      response => {
        // Sorting an array mutates the data in place.
        const remsMetRes = response.data;
        if (remsMetRes.metRequirements) {
          remsMetRes.metRequirements.sort((first, second) => {
            // Keep the other forms unsorted.
            if (second.requirementName.includes('Patient Status Update')) {
              // Sort the Patient Status Update forms in descending order of timestamp.
              return second.requirementName.localeCompare(first.requirementName);
            }
            return 0;
          });
        }
        setState(prevState => ({
          ...prevState,
          remsAdminResponse: response.data
        }));
      },
      error => {
        console.log(error);
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
  }, []);

  const updateStateElement = (elementName, text) => {
    if (elementName === 'patient') {
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

  const submitInfo = (prefetch, request, patient, hook) => {
    console.log('Initiating form submission ', types.info);
    setState(prevState => ({
      ...prevState,
      loading: true,
      patient
    }));
    const hookConfig = {
      includeConfig: globalState.includeConfig,
      alternativeTherapy: globalState.alternativeTherapy
    };
    let user = globalState.defaultUser;
    let json_request = buildRequest(
      request,
      user,
      patient,
      globalState.ehrUrlSentToRemsAdminForPreFetch,
      state.client.state.tokenResponse,
      prefetch,
      globalState.sendPrefetch,
      hook,
      hookConfig
    );
    let cdsUrl = globalState.cdsUrl;
    if (hook === 'order-sign') {
      cdsUrl = cdsUrl + '/' + globalState.orderSign;
    } else if (hook === 'order-select') {
      cdsUrl = cdsUrl + '/' + globalState.orderSelect;
    } else if (hook === 'patient-view') {
      cdsUrl = cdsUrl + '/' + globalState.patientView;
    } else {
      console.log("ERROR: unknown hook type: '", hook);
      return;
    }

    let baseUrl = globalState.baseUrl;

    const headers = {
      'Content-Type': 'application/json'
    };
    if (globalState.generateJsonToken) {
      const jwt = 'Bearer ' + createJwt(baseUrl, cdsUrl);
      headers.authorization = jwt;
    }

    try {
      fetch(cdsUrl, {
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
              setState(prevState => ({ ...prevState, response: fhirResponse }));
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
              style={{ marginLeft: '45%' }}
            >
              <Button variant="contained" startIcon={<PersonIcon />}>
                Select a patient
              </Button>
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
                      defaultUser={globalState.defaultUser}
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
                defaultUser={globalState.defaultUser}
                loading={state.loading}
                patientFhirQuery={globalState.patientFhirQuery}
              />
            </Grid>
          )}
          <Grid item container justifyContent="center" textAlign="center" spacing={2}>
            {!disableGetEtasu && (
              <Grid item>
                <EtasuStatus 
                  etasuUrl={globalState}
                  request={state.request}
                  remsAdminResponse={state.remsAdminResponse}
                  getEtasuStatus={getEtasu}
                  lastCheckedEtasuTime={state.lastCheckedEtasuTime}
                />
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
