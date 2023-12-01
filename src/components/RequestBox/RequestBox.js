import React, { Component } from 'react';
import FHIR from 'fhirclient';
import PatientBox from '../SMARTBox/PatientBox';
import { types, defaultValues, shortNameMap } from '../../util/data';
import { getAge } from '../../util/fhir';
import buildNewRxRequest from '../../util/buildScript.2017071.js';
import _ from 'lodash';
import './request.css';
import { PrefetchTemplate } from '../../PrefetchTemplate';
import { retrieveLaunchContext } from '../../util/util';
import PersonIcon from '@mui/icons-material/Person';
import { Button, ButtonGroup, Modal, Box } from '@mui/material';
const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  flexDirection: 'column',
  width: '80%',
  height: '70%',
  overflowY: 'scroll',
  transform: 'translate(-50%, -50%)',
  display: 'flex',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  borderBottom: '2px solid black',
  boxShadow: 24,
  p: 4,
  padding: '0px'
};
export default class RequestBox extends Component {
  constructor(props) {
    super(props);
    this.state = {
      openPatient: false,
      patientList: [],
      patient: {},
      prefetchedResources: new Map(),
      codeValues: defaultValues,
      code: null,
      codeSystem: null,
      display: null,
      request: {},
      gatherCount: 0,
      response: {}
    };

    this.renderRequestResources = this.renderRequestResources.bind(this);
    this.renderPatientInfo = this.renderPatientInfo.bind(this);
    this.renderOtherInfo = this.renderOtherInfo.bind(this);
    this.renderResource = this.renderResource.bind(this);
    this.renderPrefetchedResources = this.renderPrefetchedResources.bind(this);
    this.renderError = this.renderError.bind(this);
    this.buildLaunchLink = this.buildLaunchLink.bind(this);
  }

  // TODO - see how to submit response for alternative therapy
  replaceRequestAndSubmit(request) {
    this.setState({ request: request });
    // Submit the cds hook request.
    this.submitOrderSign(request);
  }

  componentDidMount() {}

  exitSmart = () => {
    this.setState({ openPatient: false });
  };

  prepPrefetch() {
    const preppedResources = new Map();
    Object.keys(this.state.prefetchedResources).forEach(resourceKey => {
      let resourceList = [];
      if (Array.isArray(this.state.prefetchedResources[resourceKey])) {
        resourceList = this.state.prefetchedResources[resourceKey].map(resource => {
          return resource;
        });
      } else {
        resourceList = this.state.prefetchedResources[resourceKey];
      }

      preppedResources.set(resourceKey, resourceList);
    });
    return preppedResources;
  }

  submitPatientView = () => {
    this.props.submitInfo(this.prepPrefetch(), null, this.state.patient, 'patient-view');
  };

  submitOrderSelect = () => {
    if (!_.isEmpty(this.state.request)) {
      this.props.submitInfo(
        this.prepPrefetch(),
        this.state.request,
        this.state.patient,
        'order-select'
      );
    }
  };

  submitOrderSign = request => {
    this.props.submitInfo(this.prepPrefetch(), request, this.state.patient, 'order-sign');
  };

  submit = () => {
    if (!_.isEmpty(this.state.request)) {
      this.submitOrderSign(this.state.request);
    }
  };

  componentDidUpdate(prevProps, prevState) {
    // if prefetch completed
    if (
      prevState.prefetchCompleted != this.state.prefetchCompleted &&
      this.state.prefetchCompleted
    ) {
      // if the prefetch contains a medicationRequests bundle
      if (this.state.prefetchedResources.medicationRequests) {
        this.submitPatientView();
      }
      // we could use this in the future to send order-select
      //// if the prefetch contains a request
      //if (this.state.prefetchedResources.request) {
      //  this.submitOrderSelect();
      //}
    }
  }

  updateStateElement = (elementName, text) => {
    this.setState({ [elementName]: text });
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

  getPatients = () => {
    this.setState({ openPatient: true });
    this.props.client
      .request(this.props.patientFhirQuery, { flat: true })
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

  emptyField = (<span className="empty-field">empty</span>);

  renderPatientInfo() {
    const patient = this.state.patient;
    if (Object.keys(patient).length === 0) {
      return <div className="demographics"></div>;
    }
    let name;
    if (patient.name) {
      name = <span> {`${patient.name[0].given[0]} ${patient.name[0].family}`} </span>;
    } else {
      name = this.emptyField;
    }
    return (
      <div className="demographics">
        <div className="lower-border">
          <span style={{ fontWeight: 'bold' }}>Demographics</span>
        </div>
        <div className="info lower-border">Name: {name}</div>
        <div className="info lower-border">
          Age: {patient.birthDate ? getAge(patient.birthDate) : this.emptyField}
        </div>
        <div className="info lower-border">
          Gender: {patient.gender ? patient.gender : this.emptyField}
        </div>
        <div className="info lower-border">
          State: {this.state.patientState ? this.state.patientState : this.emptyField}
        </div>
        {this.renderOtherInfo()}
        {this.renderQRInfo()}
      </div>
    );
  }

  renderOtherInfo() {
    return (
      <div className="other-info">
        <div className="lower-border">
          <span style={{ fontWeight: 'bold' }}>Coding</span>
        </div>
        <div className="info lower-border">
          Code: {this.state.code ? this.state.code : this.emptyField}
        </div>
        <div className="info lower-border">
          System: {this.state.codeSystem ? shortNameMap[this.state.codeSystem] : this.emptyField}
        </div>
        <div className="info lower-border">
          Display: {this.state.display ? this.state.display : this.emptyField}
        </div>
      </div>
    );
  }

  renderQRInfo() {
    const qrResponse = this.state.response;
    return (
      <div className="questionnaire-response">
        {qrResponse.questionnaire ? (
          <>
            <div className="lower-border">
              <span style={{ fontWeight: 'bold' }}>In Progress Form</span>
            </div>
            <div className="info lower-border">
              Form: {qrResponse.questionnaire ? qrResponse.questionnaire : this.emptyField}
            </div>
            <div className="info lower-border">
              Author: {qrResponse.author ? qrResponse.author.reference : this.emptyField}
            </div>
            <div className="info lower-border">
              Date: {qrResponse.authored ? qrResponse.authored : this.emptyField}
            </div>
          </>
        ) : (
          <div />
        )}
      </div>
    );
  }

  renderPrefetchedResources() {
    const prefetchMap = new Map(Object.entries(this.state.prefetchedResources));
    if (prefetchMap.size > 0) {
      return this.renderRequestResources(prefetchMap);
    }
  }

  renderRequestResources(requestResources) {
    var renderedPrefetches = new Map();
    requestResources.forEach((resourceList, resourceKey) => {
      const renderedList = [];
      if (Array.isArray(resourceList)) {
        resourceList.forEach(resource => {
          console.log('Request resources:' + JSON.stringify(requestResources));
          console.log('Request key:' + resourceKey);
          renderedList.push(this.renderResource(resource));
        });
      } else {
        renderedList.push(this.renderResource(resourceList));
      }

      renderedPrefetches.set(resourceKey, renderedList);
    });
    console.log(renderedPrefetches);
    console.log(Object.entries(renderedPrefetches));
    return (
      <div className="prefetched">
        <div className="prefetch-header">Prefetched</div>
        {Array.from(renderedPrefetches.keys()).map(resourceKey => {
          const currentRenderedPrefetch = renderedPrefetches.get(resourceKey);
          return (
            <div key={resourceKey}>
              <div className="prefetch-subheader">{resourceKey + ' Resources'}</div>
              {currentRenderedPrefetch}
            </div>
          );
        })}
      </div>
    );
  }

  renderResource(resource) {
    let value = <div>N/A</div>;
    if (!resource.id) {
      resource = resource.resource;
    }
    if (resource.id) {
      var resourceId = resource.id;
      var resourceType = resource.resourceType;
      value = (
        <div key={resourceId}>
          <span style={{ textTransform: 'capitalize' }}>{resourceType}</span>: {resourceType}/
          {resourceId} .....<span className="checkmark glyphicon glyphicon-ok"></span>
        </div>
      );
    } else {
      value = (
        <div key={'UNKNOWN'}>
          <span style={{ textTransform: 'capitalize' }}>{'UNKNOWN'}</span> .....
          <span className="remove glyphicon glyphicon-remove"></span>
        </div>
      );
    }
    return value;
  }

  renderError() {
    return (
      <span className="patient-error">
        Encountered Error: Try Refreshing The Client <br /> {this.state.patientList.message}{' '}
      </span>
    );
  }

  launchSmartOnFhirApp = () => {
    console.log('Launch SMART on FHIR App');

    let userId = this.state.prefetchedResources?.practitioner?.id;
    if (!userId) {
      console.log(
        'Practitioner not populated from prefetch, using default from config: ' +
          this.props.defaultUser
      );
      userId = this.props.defaultUser;
    }

    let link = {
      appContext: 'user=' + userId + '&patient=' + this.state.patient.id,
      type: 'smart',
      url: this.props.smartAppUrl
    };

    retrieveLaunchContext(link, this.state.patient.id, this.props.client.state).then(result => {
      link = result;
      console.log(link);
      // launch the application in a new window
      window.open(link.url, '_blank');
    });
  };

  /**
   * Relaunch DTR using the available context
   */
  relaunch = e => {
    this.buildLaunchLink().then(link => {
      //e.preventDefault();
      window.open(link.url, '_blank');
    });
  };

  buildLaunchLink() {
    // build appContext and URL encode it
    let appContext = '';
    let order = undefined,
      coverage = undefined,
      response = undefined;

    if (!this.isOrderNotSelected()) {
      if (Object.keys(this.state.request).length > 0) {
        order = `${this.state.request.resourceType}/${this.state.request.id}`;
        if (this.state.request.insurance && this.state.request.insurance.length > 0) {
          coverage = `${this.state.request.insurance[0].reference}`;
        }
      }
    }

    if (order) {
      appContext += `order=${order}`;

      if (coverage) {
        appContext += `&coverage=${coverage}`;
      }
    }

    if (Object.keys(this.state.response).length > 0) {
      response = `QuestionnaireResponse/${this.state.response.id}`;
    }

    if (order && response) {
      appContext += `&response=${response}`;
    } else if (!order && response) {
      appContext += `response=${response}`;
    }

    const link = {
      appContext: encodeURIComponent(appContext),
      type: 'smart',
      url: this.props.launchUrl
    };

    let linkCopy = Object.assign({}, link);

    return retrieveLaunchContext(linkCopy, this.state.patient.id, this.props.client.state).then(
      result => {
        linkCopy = result;
        return linkCopy;
      }
    );
  }

  /**
   * Send the NewRxRequestMessage to the Pharmacy Information System (PIMS)
   */
  sendRx = e => {
    console.log('sendRx: ' + this.props.pimsUrl);

    // build the NewRx Message
    var newRx = buildNewRxRequest(
      this.state.prefetchedResources.patient,
      this.state.prefetchedResources.practitioner,
      this.state.request
    );
    console.log(newRx);
    const serializer = new XMLSerializer();

    // send the message to the prescriber
    this.props.consoleLog('Sending Rx to PIMS', types.info);
    fetch(this.props.pimsUrl, {
      method: 'POST',
      //mode: 'no-cors',
      headers: {
        Accept: 'application/xml',
        'Content-Type': 'application/xml'
      },
      body: serializer.serializeToString(newRx)
    })
      .then(response => {
        console.log('sendRx response: ');
        console.log(response);
        this.props.consoleLog('Successfully sent Rx to PIMS', types.info);
      })
      .catch(error => {
        console.log('sendRx error: ');
        this.props.consoleLog('Server returned error sending Rx to PIMS: ', types.error);
        this.props.consoleLog(error.message);
        console.log(error);
      });
  };

  isOrderNotSelected() {
    return Object.keys(this.state.request).length === 0;
  }

  isPatientNotSelected() {
    return Object.keys(this.state.patient).length === 0;
  }

  render() {
    const disableSendToCRD = this.isOrderNotSelected() || this.props.loading;
    const disableLaunchDTR = !this.state.response.questionnaire;
    const disableSendRx = this.isOrderNotSelected() || this.props.loading;
    const disableLaunchSmartOnFhir = this.isPatientNotSelected();
    return (
      <div>
        <div className="request">
          <Modal
            open={this.state.openPatient}
            onClose={this.exitSmart}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
          >
            <Box sx={style}>
              {this.state.patientList instanceof Error
                ? this.renderError()
                : this.state.patientList.map(patient => {
                    return (
                      <PatientBox
                        key={patient.id}
                        patient={patient}
                        client={this.props.client}
                        callback={this.updateStateElement}
                        callbackList={this.updateStateList}
                        callbackMap={this.updateStateMap}
                        updatePrefetchCallback={PrefetchTemplate.generateQueries}
                        clearCallback={this.clearState}
                        ehrUrl={this.props.ehrUrl}
                        options={this.state.codeValues}
                        responseExpirationDays={this.props.responseExpirationDays}
                        defaultUser={this.props.defaultUser}
                      />
                    );
                  })}
            </Box>
          </Modal>
          <div>
            <Button variant="contained" onClick={this.getPatients} startIcon={<PersonIcon />}>
              Select a patient
            </Button>
            <div className="request-header">
              {this.state.patient.id ? (
                <span>Patient ID: {this.state.patient.id}</span>
              ) : (
                <em>No patient selected</em>
              )}
            </div>
            <div>
              {this.renderPatientInfo()}
              {this.renderPrefetchedResources()}
            </div>
          </div>
        </div>
        {this.state.patient.id ? (
          <div className="action-btns">
            <ButtonGroup variant="outlined" aria-label="outlined button group">
              <Button onClick={this.relaunch} disabled={disableLaunchDTR}>
                Open In-Progress Form
              </Button>
              <Button onClick={this.launchSmartOnFhirApp} disabled={disableLaunchSmartOnFhir}>
                Launch SMART on FHIR App
              </Button>
              <Button onClick={this.sendRx} disabled={disableSendRx}>
                Send Rx to Pharmacy
              </Button>
              <Button onClick={this.submit} disabled={disableSendToCRD}>
                Sign Order
              </Button>
            </ButtonGroup>
          </div>
        ) : (
          <span />
        )}
      </div>
    );
  }
}
