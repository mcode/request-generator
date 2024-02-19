import React, { Component } from 'react';
import { Button, Box, Grid, IconButton, Modal, DialogTitle } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import RefreshIcon from '@mui/icons-material/Refresh';
import DisplayBox from '../components/DisplayBox/DisplayBox';
import '../index.css';
import SettingsBox from '../components/SettingsBox/SettingsBox';
import RequestBox from '../components/RequestBox/RequestBox';
import buildRequest from '../util/buildRequest.js';
import { types, defaultValues, headerDefinitions } from '../util/data.js';
import { createJwt, setupKeys } from '../util/auth';

import env from 'env-var';
import FHIR from 'fhirclient';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SettingsIcon from '@mui/icons-material/Settings';
import PatientSearchBar from '../components/RequestBox/PatientSearchBar/PatientSearchBar';
import { MedicationStatus } from '../components/MedicationStatus/MedicationStatus.jsx';

export default class RequestBuilder extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      logs: [],
      patient: {},
      expanded: false,
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
      codeValues: defaultValues
    };

    this.updateStateElement = this.updateStateElement.bind(this);
    this.submit_info = this.submit_info.bind(this);
    this.consoleLog = this.consoleLog.bind(this);
    this.takeSuggestion = this.takeSuggestion.bind(this);
    this.reconnectEhr = this.reconnectEhr.bind(this);
    this.requestBox = React.createRef();
  }

  componentDidMount() {
    // init settings
    Object.keys(headerDefinitions).map(key => {
      this.setState({ [key]: headerDefinitions[key].default });
    });
    // load settings
    JSON.parse(localStorage.getItem('reqgenSettings') || '[]').forEach(element => {
      try {
        this.updateStateElement(element[0], element[1]);
      } catch {
        if (element[0]) {
          console.log('Could not load setting:' + element[0]);
        }
      }
    });

    if (!this.state.client) {
      this.reconnectEhr();
    } else {
      // Call patients on load of page
      this.getPatients();
      this.setState({ baseUrl: this.state.client.state.serverUrl });
      this.setState({ ehrUrl: this.state.client.state.serverUrl });
    }
  }

  reconnectEhr() {
    FHIR.oauth2.authorize({
      clientId: env.get('REACT_APP_CLIENT').asString(),
      iss: this.state.baseUrl,
      redirectUri: this.props.redirect,
      scope: env.get('REACT_APP_CLIENT_SCOPES').asString()
    });
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
    this.setState({ [elementName]: text });
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

  submit_info(prefetch, request, patient, hook) {
    this.setState({ loading: true });
    this.consoleLog('Initiating form submission', types.info);
    this.setState({ patient });
    const hookConfig = {
      includeConfig: this.state.includeConfig,
      alternativeTherapy: this.state.alternativeTherapy
    };
    let user = this.state.defaultUser;
    let json_request = buildRequest(
      request,
      user,
      patient,
      this.state.ehrUrlSentToRemsAdminForPreFetch,
      this.state.client.state.tokenResponse,
      prefetch,
      this.state.sendPrefetch,
      hook,
      hookConfig
    );
    let cdsUrl = this.state.cdsUrl;
    if (hook === 'order-sign') {
      cdsUrl = cdsUrl + '/' + this.state.orderSign;
    } else if (hook === 'order-select') {
      cdsUrl = cdsUrl + '/' + this.state.orderSelect;
    } else if (hook === 'patient-view') {
      cdsUrl = cdsUrl + '/' + this.state.patientView;
    } else {
      this.consoleLog("ERROR: unknown hook type: '", hook, "'");
      return;
    }

    let baseUrl = this.state.baseUrl;

    const headers = {
      'Content-Type': 'application/json'
    };
    if (this.state.generateJsonToken) {
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
    this.props.client
      .request(this.state.patientFhirQuery, { flat: true })
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
    const displayRequestBox = !!this.state.patient.id;
    const disableGetMedicationStatus = this.isOrderNotSelected() || this.state.loading;

    return (
      <>
        <Grid
          container
          className="nav-header"
          xs={12}
          justifyContent="space-between"
          alignItems="center"
        >
          <Button
            sx={navigationBarButtonStyle}
            onClick={() => this.reconnectEhr()}
            variant="outlined"
          >
            Reconnect EHR
          </Button>
          <Button
            sx={navigationBarButtonStyle}
            onClick={() => this.updateStateElement('showSettings', !this.state.showSettings)}
            variant="outlined"
          >
            <SettingsIcon fontSize="large" />
          </Button>
          <Modal
            open={this.state.showSettings}
            onClose={() => {
              this.setState({ showSettings: false });
            }}
          >
            <div className="settings-box">
              <SettingsBox
                state={this.state}
                consoleLog={this.consoleLog}
                updateCB={this.updateStateElement}
              />
            </div>
          </Modal>
        </Grid>
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
                        launchUrl={this.state.launchUrl}
                        callback={this.updateStateElement}
                        callbackList={this.updateStateList}
                        callbackMap={this.updateStateMap}
                        // updatePrefetchCallback={PrefetchTemplate.generateQueries}
                        clearCallback={this.clearState}
                        options={this.state.codeValues}
                        responseExpirationDays={this.state.responseExpirationDays}
                        defaultUser={this.state.defaultUser}
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
                  ehrUrl={this.state.ehrUrl}
                  submitInfo={this.submit_info}
                  access_token={this.state.token}
                  client={this.state.client}
                  fhirServerUrl={this.state.baseUrl}
                  fhirVersion={'r4'}
                  patientId={this.state.patient.id}
                  patient={this.state.patient}
                  request={this.state.request}
                  response={this.state.response}
                  code={this.state.code}
                  codeSystem={this.state.codeSystem}
                  display={this.state.display}
                  prefetchedResources={this.state.prefetchedResources}
                  launchUrl={this.state.launchUrl}
                  responseExpirationDays={this.state.responseExpirationDays}
                  pimsUrl={this.state.pimsUrl}
                  smartAppUrl={this.state.smartAppUrl}
                  defaultUser={this.state.defaultUser}
                  ref={this.requestBox}
                  loading={this.state.loading}
                  consoleLog={this.consoleLog}
                  patientFhirQuery={this.state.patientFhirQuery}
                />
              </Grid>
            )}
            {!disableGetMedicationStatus && (
              <Grid item>
                <MedicationStatus ehrUrl={this.state.ehrUrl} request={this.state.request} />
              </Grid>
            )}
          </Grid>

          <Grid item container xs={12} md={6}>
            <DisplayBox
              response={this.state.response}
              client={this.state.client}
              patientId={this.state.patient.id}
              ehrLaunch={true}
              takeSuggestion={this.takeSuggestion}
            />
          </Grid>
        </Grid>
      </>
    );
  }
}

const navigationBarButtonStyle = {
  backgroundColor: 'white',
  color: 'black',
  borderColor: 'black',
  display: 'flex',
  marginX: 2,
  marginY: 1,
  '&:hover': {
    color: 'white',
    backgroundColor: 'black',
    borderColor: 'black'
  },
  '&:active': {
    color: 'white',
    backgroundColor: 'black',
    borderColor: 'black'
  }
};
