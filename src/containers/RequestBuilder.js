import React, { Component } from 'react';

import DisplayBox from '../components/DisplayBox/DisplayBox';
import ConsoleBox from '../components/ConsoleBox/ConsoleBox';
import '../index.css';
import '../components/ConsoleBox/consoleBox.css';
import SettingsBox from '../components/SettingsBox/SettingsBox';
import RequestBox from '../components/RequestBox/RequestBox';
import buildRequest from '../util/buildRequest.js';
import { types } from '../util/data.js';
import { createJwt, login, setupKeys } from '../util/auth';
import env from 'env-var';
import FHIR from 'fhirclient';

export default class RequestBuilder extends Component {
  constructor(props) {
    super(props);
    this.state = {
      keypair: null,
      loading: false,
      logs: [],
      patient: {},
      response: null,
      showSettings: false,
      token: null,
      client: this.props.client,
      // Configurable values
      alternativeTherapy: env.get('REACT_APP_ALT_DRUG').asBool(),
      baseUrl: env.get('REACT_APP_EHR_BASE').asString(),
      cdsUrl: env.get('REACT_APP_CDS_SERVICE').asString(),
      defaultUser: env.get('REACT_APP_DEFAULT_USER').asString(),
      ehrUrl: env.get('REACT_APP_EHR_SERVER').asString(),
      includeConfig: true,
      launchUrl: env.get('REACT_APP_LAUNCH_URL').asString(),
      orderSelect: env.get('REACT_APP_ORDER_SELECT').asString(),
      orderSign: env.get('REACT_APP_ORDER_SIGN').asString(),
      patientView: env.get('REACT_APP_PATIENT_VIEW').asString(),
      pimsUrl: env.get('REACT_APP_PIMS_SERVER').asString(),
      responseExpirationDays: env.get('REACT_APP_RESPONSE_EXPIRATION_DAYS').asInt(),
      sendPrefetch: true,
      smartAppUrl: env.get('REACT_APP_SMART_LAUNCH_URL').asString()
    };

    this.updateStateElement = this.updateStateElement.bind(this);
    this.submit_info = this.submit_info.bind(this);
    this.consoleLog = this.consoleLog.bind(this);
    this.takeSuggestion = this.takeSuggestion.bind(this);
    this.reconnectEhr = this.reconnectEhr.bind(this);
    this.requestBox = React.createRef();
  }

  componentDidMount() {
    const callback = keypair => {
      this.setState({ keypair });
    };

    setupKeys(callback);
    if (!this.state.client) {
      this.reconnectEhr();
    } else {
      this.setState({ baseUrl: this.state.client.state.serverUrl });
      this.setState({ ehrUrl: this.state.client.state.serverUrl });
    }
  }

  reconnectEhr() {
    FHIR.oauth2
      .authorize({
        clientId: env.get('REACT_APP_CLIENT').asString(),
        iss: this.state.baseUrl,
        redirectUri: '/index',
        scope: env.get('REACT_APP_CLIENT_SCOPES').asString()
      })
      .then(client => {
        this.setState({ client: client });
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
      this.state.ehrUrl,
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
    const jwt = 'Bearer ' + createJwt(this.state.keypair, baseUrl, cdsUrl);
    const headers = new Headers({
      'Content-Type': 'application/json',
      authorization: jwt
    });
    try {
      fetch(cdsUrl, {
        method: 'POST',
        headers: headers,
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
          this.setState({ response: null });
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

  render() {
    return (
      <div>
        <div className="nav-header">
          <button
            className={
              'btn btn-class settings ' + (this.state.showSettings ? 'active' : 'not-active')
            }
            onClick={() => this.updateStateElement('showSettings', !this.state.showSettings)}
          >
            <span className="glyphicon glyphicon-cog settings-icon" />
          </button>
          <button
            className="btn btn-class"
            onClick={() => {
              this.reconnectEhr();
            }}
          >
            Reconnect EHR
          </button>
        </div>
        <div className="form-group container left-form">
          <div id="settings-header"></div>
          {this.state.showSettings && (
            <SettingsBox
              state={this.state}
              consoleLog={this.consoleLog}
              updateCB={this.updateStateElement}
            />
          )}
          <div>
            {/*for the ehr launch */}
            <RequestBox
              ehrUrl={this.state.ehrUrl}
              submitInfo={this.submit_info}
              access_token={this.state.token}
              client={this.state.client}
              fhirServerUrl={this.state.baseUrl}
              fhirVersion={'r4'}
              patientId={this.state.patient.id}
              launchUrl={this.state.launchUrl}
              responseExpirationDays={this.state.responseExpirationDays}
              pimsUrl={this.state.pimsUrl}
              smartAppUrl={this.state.smartAppUrl}
              defaultUser={this.state.defaultUser}
              ref={this.requestBox}
              loading={this.state.loading}
              consoleLog={this.consoleLog}
            />
          </div>
          <br />

          <br />
          <br />
          <br />
          <ConsoleBox logs={this.state.logs} />
        </div>

        <div className="right-form">
          <DisplayBox
            response={this.state.response}
            client={this.state.client}
            patientId={this.state.patient.id}
            ehrLaunch={true}
            takeSuggestion={this.takeSuggestion}
          />
        </div>
      </div>
    );
  }
}
