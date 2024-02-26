import React, { Component } from 'react';
import { Button, Box, Grid, IconButton, Modal, DialogTitle } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import DisplayBox from '../components/DisplayBox/DisplayBox';
import '../index.css';
import RequestBox from '../components/RequestBox/RequestBox';
import buildRequest from '../util/buildRequest.js';
import { types, defaultValues as codeValues, headerDefinitions } from '../util/data.js';
import { createJwt } from '../util/auth';

import env from 'env-var';
import FHIR from 'fhirclient';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SettingsIcon from '@mui/icons-material/Settings';
import PatientSearchBar from '../components/RequestBox/PatientSearchBar/PatientSearchBar';
import { MedicationStatus } from '../components/MedicationStatus/MedicationStatus.jsx';
import { actionTypes } from './ContextProvider/reducer.js';
import axios from 'axios';

export default class RequestBuilder extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      logs: [],
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
      client: this.props.client,
      medicationDispense: null,
      lastCheckedMedicationTime: null
    };

    this.updateStateElement = this.updateStateElement.bind(this);
    this.submitInfo = this.submitInfo.bind(this);
    this.consoleLog = this.consoleLog.bind(this);
    this.takeSuggestion = this.takeSuggestion.bind(this);
    this.requestBox = React.createRef();
  }

  getMedicationStatus = () => {
    this.setState({ lastCheckedMedicationTime: Date.now() });

    axios.get(`${this.state.ehrUrl}/MedicationDispense?prescription=${this.state.request.id}`).then(
      response => {
        const bundle = response.data;
        this.setState({ medicationDispense: bundle.entry?.[0].resource });
      },
      error => {
        console.log('Was not able to get medication status', error);
      }
    );
  };

  componentDidMount() {
    if (!this.state.client) {
      this.reconnectEhr();
    } else {
      // Call patients on load of page
      this.getPatients();
      this.props.dispatch({
        type: actionTypes.updateSetting,
        settingId: 'baseUrl',
        value: this.state.client.state.serverUrl
      });
      this.props.dispatch({
        type: actionTypes.updateSetting,
        settingId: 'ehrUrl',
        value: this.state.client.state.serverUrl
      });
    }
  }

  consoleLog(content, type) {
    console.log(content);
    let jsonContent = {
      content: content,
      type: type
    };
    this.setState(prevState => ({
      logs: [...prevState.logs, jsonContent]
    }));
  }

  updateStateElement = (elementName, text) => {
    if (elementName === 'patient') {
      this.props.dispatch({
        type: actionTypes.updatePatient,
        value: text
      });
    } else {
      this.setState({ [elementName]: text });
    }
    // if the patientFhirQuery is updated, make a call to get the patients
    if (elementName === 'patientFhirQuery') {
      setTimeout(() => {
        this.getPatients();
      }, 1000);
    }
  };

  timeout = time => {
    let controller = new AbortController();
    setTimeout(() => controller.abort(), time * 1000);
    return controller;
  };

  submitInfo(prefetch, request, patient, hook) {
    this.setState({ loading: true });
    this.consoleLog('Initiating form submission', types.info);
    this.setState({ patient });
    const hookConfig = {
      includeConfig: this.props.globalState.includeConfig,
      alternativeTherapy: this.props.globalState.alternativeTherapy
    };
    let user = this.props.globalState.defaultUser;
    let json_request = buildRequest(
      request,
      user,
      patient,
      this.props.globalState.ehrUrlSentToRemsAdminForPreFetch,
      this.state.client.state.tokenResponse,
      prefetch,
      this.props.globalState.sendPrefetch,
      hook,
      hookConfig
    );
    let cdsUrl = this.props.globalState.cdsUrl;
    if (hook === 'order-sign') {
      cdsUrl = cdsUrl + '/' + this.props.globalState.orderSign;
    } else if (hook === 'order-select') {
      cdsUrl = cdsUrl + '/' + this.props.globalState.orderSelect;
    } else if (hook === 'patient-view') {
      cdsUrl = cdsUrl + '/' + this.props.globalState.patientView;
    } else {
      this.consoleLog("ERROR: unknown hook type: '", hook, "'");
      return;
    }

    let baseUrl = this.props.globalState.baseUrl;

    const headers = {
      'Content-Type': 'application/json'
    };
    if (this.props.globalState.generateJsonToken) {
      const jwt = 'Bearer ' + createJwt(baseUrl, cdsUrl);
      headers.authorization = jwt;
    }

    try {
      fetch(cdsUrl, {
        method: 'POST',
        headers: new Headers(headers),
        body: JSON.stringify(json_request),
        signal: this.timeout(10).signal //Timeout set to 10 seconds
      })
        .then(response => {
          clearTimeout(this.timeout);
          response.json().then(fhirResponse => {
            console.log(fhirResponse);
            if (fhirResponse?.status) {
              this.consoleLog(
                'Server returned status ' + fhirResponse.status + ': ' + fhirResponse.error,
                types.error
              );
              this.consoleLog(fhirResponse.message, types.error);
            } else {
              this.setState({ response: fhirResponse });
            }
            this.setState({ loading: false });
          });
        })
        .catch(() => {
          this.consoleLog('No response received from the server', types.error);
          this.setState({ response: {} });
          this.setState({ loading: false });
        });
    } catch (error) {
      this.setState({ loading: false });
      this.consoleLog('Unexpected error occurred', types.error);
      if (error instanceof TypeError) {
        this.consoleLog(error.name + ': ' + error.message, types.error);
      }
      this.setState({ loading: false });
    }
  }

  takeSuggestion(resource) {
    // when a suggestion is taken, call into the requestBox to resubmit the CRD request with the new request
    this.requestBox.current.replaceRequestAndSubmit(resource);
  }

  getPatients = () => {
    if (this.props.globalState.patientFhirQuery) {
      this.props.client
        .request(this.props.globalState.patientFhirQuery, { flat: true })
        .then(result => {
          this.setState({
            patientList: result
          });
        })
        .catch(e => {
          this.setState({
            patientList: e
          });
        });
    }
  };

  updateStateList = (elementName, text) => {
    this.setState(prevState => {
      return { [elementName]: [...prevState[elementName], text] };
    });
  };

  updateStateMap = (elementName, key, text) => {
    this.setState(prevState => {
      if (!prevState[elementName][key]) {
        prevState[elementName][key] = [];
      }
      return { [elementName]: { ...prevState[elementName], [key]: text } };
    });
  };

  clearState = () => {
    this.setState({
      prefetchedResources: new Map(),
      practitioner: {},
      coverage: {},
      response: {}
    });
  };

  handleChange = () => (event, isExpanded) => {
    this.setState({ expanded: isExpanded ? true : false });
  };

  isOrderNotSelected() {
    return Object.keys(this.state.request).length === 0;
  }

  render() {
    const displayRequestBox = !!this.props.globalState.patient?.id;
    const disableGetMedicationStatus = this.isOrderNotSelected() || this.state.loading;

    return (
      <>
        <Grid container spacing={2} padding={2}>
          <Grid item xs={11}>
            <Accordion expanded={this.state.expanded} onChange={this.handleChange()}>
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
                {this.state.patientList.length > 0 && this.state.expanded && (
                  <Box>
                    {this.state.patientList instanceof Error ? (
                      this.renderError()
                    ) : (
                      <PatientSearchBar
                        getPatients={this.getPatients}
                        searchablePatients={this.state.patientList}
                        client={this.props.client}
                        request={this.state.request}
                        launchUrl={this.props.globalState.launchUrl}
                        callback={this.updateStateElement}
                        callbackList={this.updateStateList}
                        callbackMap={this.updateStateMap}
                        clearCallback={this.clearState}
                        responseExpirationDays={this.props.globalState.responseExpirationDays}
                        defaultUser={this.props.globalState.defaultUser}
                      />
                    )}
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          </Grid>
          <Grid item xs={1} alignContent="center" justifyContent="center">
            <IconButton color="primary" onClick={() => this.getPatients()} size="large">
              <RefreshIcon fontSize="large" />
            </IconButton>
          </Grid>

          <Grid item container className="form-group" xs={12} md={6} spacing={2}>
            {displayRequestBox && (
              <Grid item>
                <RequestBox
                  ehrUrl={this.props.globalState.ehrUrl}
                  submitInfo={this.submitInfo}
                  access_token={this.state.token}
                  client={this.state.client}
                  fhirServerUrl={this.props.globalState.baseUrl}
                  fhirVersion={'r4'}
                  patientId={this.props.globalState.patient.id}
                  patient={this.props.globalState.patient}
                  request={this.state.request}
                  response={this.state.response}
                  code={this.state.code}
                  codeSystem={this.state.codeSystem}
                  display={this.state.display}
                  prefetchedResources={this.state.prefetchedResources}
                  launchUrl={this.props.globalState.launchUrl}
                  responseExpirationDays={this.props.globalState.responseExpirationDays}
                  pimsUrl={this.props.globalState.pimsUrl}
                  smartAppUrl={this.props.globalState.smartAppUrl}
                  defaultUser={this.props.globalState.defaultUser}
                  ref={this.requestBox}
                  loading={this.state.loading}
                  consoleLog={this.consoleLog}
                  patientFhirQuery={this.props.globalState.patientFhirQuery}
                />
              </Grid>
            )}
            {!disableGetMedicationStatus && (
              <Grid item>
                <MedicationStatus
                  ehrUrl={this.props.globalState.ehrUrl}
                  request={this.state.request}
                  medicationDispense={this.state.medicationDispense}
                  getMedicationStatus={this.getMedicationStatus}
                  lastCheckedMedicationTime={this.state.lastCheckedMedicationTime}
                />
              </Grid>
            )}
          </Grid>

          <Grid item container xs={12} md={6}>
            <DisplayBox
              response={this.state.response}
              client={this.state.client}
              patientId={this.props.globalState.patient?.id}
              ehrLaunch={true}
              takeSuggestion={this.takeSuggestion}
            />
          </Grid>
        </Grid>
      </>
    );
  }
}
