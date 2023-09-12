import React, { Component } from "react";
import { Dropdown, Header } from 'semantic-ui-react'
import { getAge } from "../../util/fhir";
import FHIR from "fhirclient";
import "./smart.css";
import { Button, IconButton } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

export default class SMARTBox extends Component {
  constructor(props) {
    super(props);
    this.state = {
      request: "none",
      deviceRequests: {},
      medicationRequests: {},
      serviceRequests: {},
      medicationDispenses: {},
      response: "none",
      questionnaireResponses: {},
    };

    this.handleRequestChange = this.handleRequestChange.bind(this);

    this.updatePrefetchRequest = this.updatePrefetchRequest.bind(this);
    this.getDeviceRequest = this.getDeviceRequest.bind(this);
    this.getServiceRequest = this.getServiceRequest.bind(this);
    this.getMedicationRequest = this.getMedicationRequest.bind(this);
    this.getMedicationDispense = this.getMedicationDispense.bind(this);
    this.getRequests = this.getRequests.bind(this);
    this.getResponses = this.getResponses.bind(this);
    this.makeQROption = this.makeQROption.bind(this);
    this.handleResponseChange = this.handleResponseChange.bind(this);
  }

  componentDidMount() {
    // get requests and responses on open of patients
    this.getRequests()
    this.getResponses();
  }

  getCoding(request) {
    let code = null;
    if (request.resourceType === "DeviceRequest") {
      code = request.codeCodeableConcept.coding[0];
    } else if (request.resourceType === "ServiceRequest") {
      code = request.code.coding[0];
    } else if (request.resourceType === "MedicationRequest"
      || request.resourceType === "MedicationDispense") {
      code = request.medicationCodeableConcept.coding[0];
    }
    if (code) {
      if (!code.code) {
        code.code = "Unknown";
      }
      if (!code.display) {
        code.display = "Unknown";
      }
      if (!code.system) {
        code.system = "Unknown";
      }
    } else {
      code.code = "Unknown";
      code.display = "Unknown";
      code.system = "Unknown";
    }
    return code;
  }

  makeOption(request, options) {
    let code = this.getCoding(request);

    let option = {
      key: request.id,
      text: code.display + " (Medication request: " + code.code + ")",
      value: JSON.stringify(request),
      content: (
        <Header content={code.code + " (" + request.resourceType + ")"} subheader={code.display} />
      )
    }
    options.push(option);
  }

  updateValues(patient) {
    this.props.callback("patient", patient);
    this.props.callback("openPatient", false);
    this.props.clearCallback();
    if (this.state.request !== "none") {
      const request = JSON.parse(this.state.request);
      if (request.resourceType === "DeviceRequest" || request.resourceType === "ServiceRequest" || request.resourceType === "MedicationRequest" || request.resourceType === "MedicationDispense") {
        this.updatePrefetchRequest(request);
      } else {
        this.props.clearCallback();
      }
    }

    if (this.state.response !== "none") {
      const response = JSON.parse(this.state.response);
      this.updateQRResponse(patient, response);
    }
  }

  updateQRResponse(patient, response) {
    this.props.callback("response", response);
  }

  updatePrefetchRequest(request) {
    this.props.callback(request.resourceType, request);
    const queries = this.props.updatePrefetchCallback(request, "request", "patient", "practitioner");
    queries.forEach((query, queryKey) => {
      const urlQuery = this.props.ehrUrl + '/' + query;
      fetch(urlQuery, {
        method: "GET",
      }).then((response) => {
        const responseJson = response.json()
        return responseJson;
      }).then((resource) => {
        this.props.callbackMap("prefetchedResources", queryKey, resource);
      });
    });
    this.props.callback("request", request);
    const coding = this.getCoding(request);
    this.props.callback("code", coding.code);
    this.props.callback("codeSystem", coding.system);
    this.props.callback("display", coding.display);
  }

  getDeviceRequest(patientId, client) {
    client
      .request(`DeviceRequest?subject=Patient/${patientId}`, {
        resolveReferences: ["subject", "performer"],
        graph: false,
        flat: true,
      })
      .then((result) => {
        this.setState({ deviceRequests: result });
      });
  }

  getServiceRequest(patientId, client) {
    client
      .request(`ServiceRequest?subject=Patient/${patientId}`, {
        resolveReferences: ["subject", "performer"],
        graph: false,
        flat: true,
      })
      .then((result) => {
        this.setState({ serviceRequests: result });
      });
  }

  getMedicationRequest(patientId, client) {
    client
      .request(`MedicationRequest?subject=Patient/${patientId}`, {
        resolveReferences: ["subject", "performer"],
        graph: false,
        flat: true,
      })
      .then((result) => {
        this.setState({ medicationRequests: result });
      });
  }

  getMedicationDispense(patientId, client) {
    client
      .request(`MedicationDispense?subject=Patient/${patientId}`, {
        resolveReferences: ["subject", "performer"],
        graph: false,
        flat: true,
      })
      .then((result) => {
        this.setState({ medicationDispenses: result });
      });
  }

  handleRequestChange(e, data) {
    if (data.value === "none") {
      this.setState({
        request: "none"
      });
    } else {
      let request = JSON.parse(data.value);
      let coding = this.getCoding(request);
      this.setState({
        request: data.value,
        code: coding.code,
        system: coding.system,
        display: coding.display,
        response: "none"
      });
    }
  }

  handleResponseChange(e, data) {
    if (data.value === "none") {
      this.setState({
        response: "none"
      });
    } else {
      this.setState({
        response: data.value
      });
    }
  }

  getRequests() {
    const client = FHIR.client(
      this.props.params
    );
    const patientId = this.props.patient.id;
    this.getDeviceRequest(patientId, client);
    this.getServiceRequest(patientId, client);
    this.getMedicationRequest(patientId, client);
    this.getMedicationDispense(patientId, client);
  }

  /**
   * Retrieve QuestionnaireResponse 
   */
  getResponses() {
    const client = FHIR.client(
      this.props.params
    );
    const patientId = this.props.patient.id;

    let updateDate = new Date();
    updateDate.setDate(updateDate.getDate() - this.props.responseExpirationDays);
    client
      .request(`QuestionnaireResponse?_lastUpdated=gt${updateDate.toISOString().split('T')[0]}&status=in-progress&subject=Patient/${patientId}`, {
        resolveReferences: ["subject"],
        graph: false,
        flat: true,
      })
      .then((result) => {
        this.setState({ questionnaireResponses: result });
      });
  }

  makeQROption(qr, options) {
    const display = `${qr.questionnaire}: created at ${qr.authored}`;
    let option = {
      key: qr.id,
      text: display,
      value: JSON.stringify(qr),
      content: (
        <Header content={"QuestionnaireResponse"} subheader={display} />
      )
    }
    options.push(option);
  }

  render() {
    const patient = this.props.patient;
    let name = "";
    if (patient.name) {
      name = (
        <span> {`${patient.name[0].given[0]} ${patient.name[0].family}`} </span>
      );
    }

    // add all of the requests to the list of options
    let options = []
    let responseOptions = [];
    let returned = false;
    if (this.state.deviceRequests.data) {
      returned = true;
      this.state.deviceRequests.data.forEach((e) => {
        this.makeOption(e, options);
      });
    }
    if (this.state.serviceRequests.data) {
      returned = true;
      this.state.serviceRequests.data.forEach((e) => {
        this.makeOption(e, options);
      });
    }
    if (this.state.medicationRequests.data) {
      returned = true;
      this.state.medicationRequests.data.forEach((e) => {
        this.makeOption(e, options);
      });
    }

    if (this.state.medicationDispenses.data) {
      returned = true;
      this.state.medicationDispenses.data.forEach((e) => {
        this.makeOption(e, options);
      })
    };

    if (this.state.questionnaireResponses.data) {
      this.state.questionnaireResponses.data.forEach(qr => this.makeQROption(qr, responseOptions));
      returned = true;
    }

    let noResults = 'No results found.'
    if (!returned) {
      noResults = 'Loading...';
    }

    return (
      <div>
        <div
          className="patient-selection-box"
          key={patient.id}
        >
          <div className="patient-info">
            <span style={{ fontWeight: "bold" }}>ID</span>: {patient.id}
            <div>
              <span style={{ fontWeight: "bold" }}>Name</span>:{" "}
              {name ? name : "N/A"}
            </div>
            <div>
              <span style={{ fontWeight: "bold" }}>Gender</span>:{" "}
              {patient.gender}
            </div>
            <div>
              <span style={{ fontWeight: "bold" }}>Age</span>:{" "}
              {getAge(patient.birthDate)}
            </div>
          </div>
          <div className="request-info">
            <span style={{ fontWeight: "bold", marginRight: "5px" }}>
              Request:
            </span>
            { !options.length && returned ?
              <span className="emptyForm">No reqeusts</span>
            : 
              <Dropdown
                search searchInput={{ type: 'text' }}
                selection fluid options={options}
                placeholder='Choose an option'
                noResultsMessage={noResults}
                onChange={this.handleRequestChange}
              />
            }
          </div>
          <div className="request-info">
            <span style={{ fontWeight: "bold", marginRight: "5px"}}>
              In Progress Form:
              <IconButton color="primary" style={{ padding: '0px 5px' }} onClick={this.getResponses}>
                <RefreshIcon />
              </IconButton> 
            </span>
            { !responseOptions.length && returned ?
              <span className="emptyForm">No in progress forms</span> :
              <Dropdown
                search searchInput={{ type: 'text' }}
                selection fluid options={responseOptions}
                placeholder='Choose an option'
                noResultsMessage={noResults}
                onChange={this.handleResponseChange}
              />
            }
          </div>
          <Button variant="outlined" size="small" className="select-btn" onClick={() => this.updateValues(patient)}>Select</Button>
        </div>
      </div>
    );
  }
}
