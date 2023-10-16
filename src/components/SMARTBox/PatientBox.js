import React, { Component } from "react";
import { getAge } from "../../util/fhir";
import FHIR from "fhirclient";
import "./smart.css";
import { Button, IconButton } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';


export default class PatientBox extends Component {
  constructor(props) {
    super(props);
    this.state = {
      request: "",
      deviceRequests: {},
      medicationRequests: {},
      serviceRequests: {},
      medicationDispenses: {},
      response: "",
      questionnaireResponses: {},
      openRequests: false,
      openQuestionnaires: false
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
    this.makeDropdown = this.makeDropdown.bind(this);
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

  makeDropdown(options, label, stateVar, stateChange) {
    console.log(options);
    return (
      <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth>
        <InputLabel>{label}</InputLabel>
        <Select
          labelId = {`${label}-label`}
          value= {stateVar}
          label={label}
          onChange={stateChange}
        >
          {options.map((op) => {
            return <MenuItem key = {op.key} value = {op.value}>{op.text}</MenuItem>
          })}
        </Select>
      </FormControl>
    </Box>
    )
  }
  makeOption(request, options) {
    let code = this.getCoding(request);

    let option = {
      key: request.id,
      text: code.display + " (Medication request: " + code.code + ")",
      value: JSON.stringify(request)
    }
    options.push(option);
  }

  updateValues(patient) {
    this.props.callback("patient", patient);
    this.props.callback("openPatient", false);
    this.props.clearCallback();
    if (this.state.request) {
      const request = JSON.parse(this.state.request);
      if (request.resourceType === "DeviceRequest" || request.resourceType === "ServiceRequest" || request.resourceType === "MedicationRequest" || request.resourceType === "MedicationDispense") {
        this.updatePrefetchRequest(request, patient, this.props.defaultUser);
      } else {
        this.props.clearCallback();
      }
    }
    else {
      this.updatePrefetchRequest(null, patient, this.props.defaultUser);
    }

    if (this.state.response) {
      const response = JSON.parse(this.state.response);
      this.updateQRResponse(patient, response);
    }
  }

  updateQRResponse(patient, response) {
    this.props.callback("response", response);
  }

  fetchResources(queries) {
    console.log(queries);
    var requests = [];
    this.props.callback("prefetchCompleted", false);
    queries.forEach((query, queryKey) => {
      const urlQuery = this.props.ehrUrl + '/' + query;
      requests.push(fetch(urlQuery, {
        method: "GET",
      }).then((response) => {
        const responseJson = response.json()
        return responseJson;
      }).then((resource) => {
        this.props.callbackMap("prefetchedResources", queryKey, resource);
      }));
    });

    Promise.all(requests)
    .then((results) => {
      console.log("fetchResourcesSync: finished")
      this.props.callback("prefetchCompleted", true);
    }).catch(function(err) {
      console.log("fetchResourcesSync: failed to wait for all the prefetch to populate");
      console.log(err);
    }) 
  }

  updatePrefetchRequest(request, patient, user) {
    const patientReference = "Patient/"+patient?.id;
    const userReference = "Practitioner/"+user;
    if (request) {
      this.props.callback(request.resourceType, request);
      var queries = this.props.updatePrefetchCallback(request, patientReference, userReference, "request", "patient", "practitioner");
      this.fetchResources(queries);

      this.props.callback("request", request);
      const coding = this.getCoding(request);
      this.props.callback("code", coding.code);
      this.props.callback("codeSystem", coding.system);
      this.props.callback("display", coding.display);
    } else {
      var queries = this.props.updatePrefetchCallback(request, patientReference, userReference, "patient", "practitioner", "medicationRequests");
      this.fetchResources(queries);
    }
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

  handleRequestChange(e) {
    const data = e.target.value;
    if (data) {
      let coding = this.getCoding(JSON.parse(data));
      this.setState({
        request: data,
        code: coding.code,
        system: coding.system,
        display: coding.display,
        response: ""
      });
    } else {
      this.setState({
        request: ""
      });
    }
  }

  handleResponseChange(e) {
    const data = e.target.value;
    if (data) {
      this.setState({
        response: data
      });
    } else {
      this.setState({
        response: ""
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
      value: JSON.stringify(qr)
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
      <div key = {patient.id} className="patient-box">
        <div className="patient-header">
          <span style={{fontWeight: 'bolder'}}>{name ? name : "N/A"}</span> {`(ID: ${patient.id})`}
        </div>
        <div
          className="patient-selection-box"
        >
          <div className="patient-info">
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
              <span className="emptyForm">No requests</span>
            : 
              this.makeDropdown(options, "Choose a patient", this.state.request, this.handleRequestChange)
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
              this.makeDropdown(responseOptions, "Choose an in-progress form", this.state.response, this.handleResponseChange)
            }
          </div>
          <Button variant="outlined" size="small" className="select-btn" onClick={() => this.updateValues(patient)}>Select</Button>
        </div>
      </div>
    );
  }
}
