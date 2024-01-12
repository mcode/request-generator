import { Button, ButtonGroup } from '@mui/material';
import _ from 'lodash';
import React, { Component } from 'react';
import buildNewRxRequest from '../../util/buildScript.2017071.js';
import PersonIcon from '@mui/icons-material/Person';
import MuiAlert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { defaultValues, shortNameMap } from '../../util/data';
import { getAge } from '../../util/fhir';
import { retrieveLaunchContext } from '../../util/util';
import InProgressFormBox from './InProgressFormBox/InProgressFormBox.js';
import './request.css';

export default class RequestBox extends Component {
  constructor(props) {
    super(props);
    this.state = {
      gatherCount: 0,
      response: {},
      open: false
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
    this.props.callback(request,request);    // Submit the cds hook request.
    this.submitOrderSign(request);
  }

  componentDidMount() { }

  prepPrefetch() {
    const preppedResources = new Map();
    Object.keys(this.props.prefetchedResources).forEach(resourceKey => {
      let resourceList = [];
      if (Array.isArray(this.props.prefetchedResources[resourceKey])) {
        resourceList = this.props.prefetchedResources[resourceKey].map(resource => {
          return resource;
        });
      } else {
        resourceList = this.props.prefetchedResources[resourceKey];
      }

      preppedResources.set(resourceKey, resourceList);
    });
    return preppedResources;
  }

  submitPatientView = () => {
    this.props.submitInfo(this.prepPrefetch(), null, this.props.patient, 'patient-view');
  };

  submitOrderSelect = () => {
    if (!_.isEmpty(this.props.request)) {
      this.props.submitInfo(
        this.prepPrefetch(),
        this.props.request,
        this.props.patient,
        'order-select'
      );
    }
  };

  submitOrderSign = request => {
    this.props.submitInfo(this.prepPrefetch(), request, this.props.patient, 'order-sign');
  };

  submit = () => {
    if (!_.isEmpty(this.props.request)) {
      this.submitOrderSign(this.props.request);
    }
  };

  componentDidUpdate(prevProps, prevState) {
    // if prefetch completed
    if (
      prevState.prefetchCompleted != this.state.prefetchCompleted &&
      this.state.prefetchCompleted
    ) {
      // if the prefetch contains a medicationRequests bundle
      if (this.props.prefetchedResources.medicationRequests) {
        this.submitPatientView();
      }
      // we could use this in the future to send order-select
      //// if the prefetch contains a request
      //if (this.props.prefetchedResources.request) {
      //  this.submitOrderSelect();
      //}
    }
  }

  updateStateElement = (elementName, text) => {
    this.setState({ [elementName]: text });
  };

  emptyField = (<span className="empty-field">empty</span>);

  renderPatientInfo() {
    const patient = this.props.patient;
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
          Code: {this.props.code ? this.props.code : this.emptyField}
        </div>
        <div className="info lower-border">
          System: {this.props.codeSystem ? shortNameMap[this.props.codeSystem] : this.emptyField}
        </div>
        <div className="info lower-border">
          Display: {this.props.display ? this.props.display : this.emptyField}
        </div>
      </div>
    );
  }

  renderPrefetchedResources() {
    const prefetchMap = new Map(Object.entries(this.props.prefetchedResources));
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

    let userId = this.props.prefetchedResources?.practitioner?.id;
    if (!userId) {
      console.log(
        'Practitioner not populated from prefetch, using default from config: ' +
        this.props.defaultUser
      );
      userId = this.props.defaultUser;
    }

    let link = {
      appContext: 'user=' + userId + '&patient=' + this.props.patient.id,
      type: 'smart',
      url: this.props.smartAppUrl
    };

    retrieveLaunchContext(link, this.props.patient.id, this.props.client.state).then(result => {
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
      if (Object.keys(this.props.request).length > 0) {
        order = `${this.props.request.resourceType}/${this.props.request.id}`;
        if (this.props.request.insurance && this.props.request.insurance.length > 0) {
          coverage = `${this.props.request.insurance[0].reference}`;
        }
      }
    }

    if (order) {
      appContext += `order=${order}`;

      if (coverage) {
        appContext += `&coverage=${coverage}`;
      }
    }

    if (Object.keys(this.props.response).length > 0) {
      response = `QuestionnaireResponse/${this.props.response.id}`;
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

    return retrieveLaunchContext(linkCopy, this.props.patient.id, this.props.client.state).then(
      result => {
        linkCopy = result;
        return linkCopy;
      }
    );
  }

  /**
   * Send NewRx for new Medication to the Pharmacy Information System (PIMS)
   */
  sendRx = e => {
    console.log('Sending NewRx to: ' + this.props.pimsUrl);

    // build the NewRx Message
    var newRx = buildNewRxRequest(
      this.props.prefetchedResources.patient,
      this.props.prefetchedResources.practitioner,
      this.props.request
    );

    console.log('Prepared NewRx:');
    console.log(newRx);

    const serializer = new XMLSerializer();

    // Sending NewRx to the Pharmacy
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
        console.log('Successfully sent NewRx to PIMS');
        console.log(response);
        this.handleRxResponse();
      })
      .catch(error => {
        console.log('sendRx Error - unable to send NewRx to PIMS: ');
        console.log(error);
      });
  };

  isOrderNotSelected() {
    return Object.keys(this.props.request).length === 0;
  }

  isPatientNotSelected() {
    return Object.keys(this.props.patient).length === 0;
  }

  // SnackBar 
  handleRxResponse = () => this.setState({ open: true });

  handleClose = () => this.setState({ open: false });


  render() {
    const disableSendToCRD = this.isOrderNotSelected() || this.props.loading;
    const disableSendRx = this.isOrderNotSelected() || this.props.loading;
    const disableLaunchSmartOnFhir = this.isPatientNotSelected();
    const { open } = this.state;
    return (
      <div>
        { this.props.patient.id ? (
            <div className="request">
              <div style={{paddingTop: '15px'}}>
                <div className="request-header">
                  <span>Patient ID: {this.props.patient.id}</span>
                </div>
                <div className='patient-info'>
                  {this.renderPatientInfo()}
                  {this.renderPrefetchedResources()}
                </div>
              </div>
              <div className="action-btns">
                {Object.keys(this.props.response).length ?
                  <InProgressFormBox
                    qrResponse={this.props.response}
                    relaunch={this.relaunch}
                  />
                : <span />}
                <ButtonGroup variant="outlined" aria-label="outlined button group">
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
          </div>
        ) : (
          <span/>
        )}
        <Snackbar
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left'
              }}
              open={open}
              onClose={this.handleClose}
              autoHideDuration={6000}
            >
              <MuiAlert
                onClose={this.handleClose}
                severity="success"
                elevation={6}
                variant="filled"
              >
                Success! NewRx Recieved By Pharmacy
              </MuiAlert>
            </Snackbar>
      </div>
    );
  }
}
