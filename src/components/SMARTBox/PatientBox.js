import React, { Component } from 'react';
import { getAge, getDrugCodeFromMedicationRequest } from '../../util/fhir';
import './smart.css';
import { Button, IconButton } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

export default class PatientBox extends Component {
  constructor(props) {
    super(props);
    this.state = {
      request: '',
      deviceRequests: {},
      medicationRequests: {},
      serviceRequests: {},
      medicationDispenses: {},
      response: '',
      questionnaireResponses: {},
      openRequests: false,
      openQuestionnaires: false,
      questionnaireTitles: {}
    };

    this.handleRequestChange = this.handleRequestChange.bind(this);

    this.updatePrefetchRequest = this.updatePrefetchRequest.bind(this);
    this.getDeviceRequest = this.getDeviceRequest.bind(this);
    this.getServiceRequest = this.getServiceRequest.bind(this);
    this.getMedicationRequest = this.getMedicationRequest.bind(this);
    this.getMedicationDispense = this.getMedicationDispense.bind(this);
    this.getRequests = this.getRequests.bind(this);
    this.getResponses = this.getResponses.bind(this);
    this.getQuestionnaireTitles = this.getQuestionnaireTitles.bind(this);
    this.makeQROption = this.makeQROption.bind(this);
    this.handleResponseChange = this.handleResponseChange.bind(this);
    this.makeDropdown = this.makeDropdown.bind(this);
  }

  componentDidMount() {
    // get requests and responses on open of patients
    this.getRequests();
    this.getResponses(); // TODO: PatientBox should not be rendering itself, needs to recieve its state from parent 
  }

  getCoding(resource) {
    let code = null;
    if (resource.resourceType === 'DeviceRequest') {
      code = resource?.codeCodeableConcept.coding[0];
    } else if (
      resource.resourceType === 'ServiceRequest' ||
      resource.resourceType === 'Medication'
    ) {
      code = resource?.code?.coding[0];
    } else if (resource.resourceType === 'MedicationRequest') {
      code = getDrugCodeFromMedicationRequest(resource);
    } else if (resource.resourceType === 'MedicationDispense') {
      code = resource?.medicationCodeableConcept?.coding[0];
    }
    if (code) {
      if (!code.code) {
        code.code = 'Unknown';
      }
      if (!code.display) {
        code.display = 'Unknown';
      }
      if (!code.system) {
        code.system = 'Unknown';
      }
    } else {
      code = {
        code: 'Unknown',
        display: 'Unknown',
        system: 'Unknown'
      };
    }
    return code;
  }

  makeDropdown(options, label, stateVar, stateChange) {
    return (
      <Box sx={{ minWidth: 120 }}>
        <FormControl fullWidth>
          <InputLabel>{label}</InputLabel>
          <Select
            labelId={`${label}-label`}
            value={stateVar}
            label={label}
            data-testid="dropdown-box"
            onChange={stateChange}
          >
            {options.map(op => {
              return (
                <MenuItem key={op.key} value={op.value}>
                  {op.text}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Box>
    );
  }

  makeOption(request, options) {
    const code = this.getCoding(request);

    let option = {
      key: request.id,
      text: code.display + ' (Medication request: ' + code.code + ')',
      value: JSON.stringify(request)
    };
    options.push(option);
  }

  updateValues(patient) {
    this.props.callback('patient', patient);
    this.props.callback('expanded', false);
    this.props.clearCallback();
    if (this.state.request) {
      const request = JSON.parse(this.state.request);
      if (
        request.resourceType === 'DeviceRequest' ||
        request.resourceType === 'ServiceRequest' ||
        request.resourceType === 'MedicationRequest' ||
        request.resourceType === 'MedicationDispense'
      ) {
        this.updatePrefetchRequest(request, patient, this.props.defaultUser);
      } else {
        this.props.clearCallback();
      }
    } else {
      this.updatePrefetchRequest(null, patient, this.props.defaultUser);
      this.props.callback('request', {});
      this.props.callback('code', null);
      this.props.callback('codeSystem', null);
      this.props.callback('display', null);
    }

    if (this.state.response) {
      const response = JSON.parse(this.state.response);
      this.updateQRResponse(patient, response);
    }
  }

  updateQRResponse(patient, response) {
    this.props.callback('response', response);
  }

  fetchResources(queries) {
    console.log(queries);
    var requests = [];
    this.props.callback('prefetchCompleted', false);
    queries.forEach((query, queryKey) => {
      const urlQuery = '/' + query;
      requests.push(
        this.props.client
          .request(urlQuery)
          .then(response => {
            console.log(response);
            return response;
          })
          .then(resource => {
            this.props.callbackMap('prefetchedResources', queryKey, resource);
          })
      );
    });

    Promise.all(requests)
      .then(() => {
        console.log('fetchResourcesSync: finished');
        this.props.callback('prefetchCompleted', true);
      })
      .catch(function (err) {
        console.log('fetchResourcesSync: failed to wait for all the prefetch to populate');
        console.log(err);
      });
  }

  updatePrefetchRequest(request, patient, user) {
    const patientReference = 'Patient/' + patient?.id;
    const userReference = 'Practitioner/' + user;
    if (request) {
      this.props.callback(request.resourceType, request);
      const queries = this.props.updatePrefetchCallback(
        request,
        patientReference,
        userReference,
        'request',
        'patient',
        'practitioner'
      );
      this.fetchResources(queries);

      this.props.callback('request', request);
      const coding = this.getCoding(request);
      this.props.callback('code', coding.code);
      this.props.callback('codeSystem', coding.system);
      this.props.callback('display', coding.display);
    } else {
      const queries = this.props.updatePrefetchCallback(
        request,
        patientReference,
        userReference,
        'patient',
        'practitioner',
        'medicationRequests'
      );
      this.fetchResources(queries);
    }
  }

  getDeviceRequest(patientId) {
    this.props.client
      .request(`DeviceRequest?subject=Patient/${patientId}`, {
        resolveReferences: ['subject', 'performer'],
        graph: false,
        flat: true
      })
      .then(result => {
        this.setState({ deviceRequests: result });
      });
  }

  getServiceRequest(patientId) {
    this.props.client
      .request(`ServiceRequest?subject=Patient/${patientId}`, {
        resolveReferences: ['subject', 'performer'],
        graph: false,
        flat: true
      })
      .then(result => {
        this.setState({ serviceRequests: result });
      });
  }

  getMedicationRequest(patientId) {
    this.props.client
      .request(`MedicationRequest?subject=Patient/${patientId}`, {
        resolveReferences: ['subject', 'performer', 'medicationReference'],
        graph: false,
        flat: true
      })
      .then(result => {

        // add the medicationReference as a contained resource
        result?.data.forEach(e => {
          if (e?.medicationReference) {
            let medicationReference = e?.medicationReference.reference;

            // find the matching medication in the references
            const medication = result?.references?.[medicationReference];
            if (medication) {
              const code = medication?.code?.coding?.[0];

              if (code) {
                // add the reference as a contained resource to the request
                if (!e?.contained) {
                  e.contained = [];
                  e.contained.push(medication);
                } else {
                  // only add to contained if not already in there
                  let found = false;
                  e?.contained.forEach(c => {
                    if (c.id === medication.id) {
                      found = true;
                    }
                  });
                  if (!found) {
                    e?.contained.push(medication);
                  }
                }
              }
            }
          }
        });


        this.setState({ medicationRequests: result });
      });
  }

  getMedicationDispense(patientId) {
    this.props.client
      .request(`MedicationDispense?subject=Patient/${patientId}`, {
        resolveReferences: ['subject', 'performer'],
        graph: false,
        flat: true
      })
      .then(result => {
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
        response: ''
      });
    } else {
      this.setState({
        request: ''
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
        response: ''
      });
    }
  }

  getRequests() {
    const patientId = this.props.patient.id;
    this.getDeviceRequest(patientId);
    this.getServiceRequest(patientId);
    this.getMedicationRequest(patientId);
    this.getMedicationDispense(patientId);
  }

  /**
   * Retrieve QuestionnaireResponse
   */
  getResponses() {
    const patientId = this.props.patient.id;

    let updateDate = new Date();
    updateDate.setDate(updateDate.getDate() - this.props.responseExpirationDays);
    const searchParameters = [
      `_lastUpdated=gt${updateDate.toISOString().split('T')[0]}`,
      'status=in-progress',
      `subject=Patient/${patientId}`,
      '_sort=-authored'
    ];
    this.props.client
      .request(`QuestionnaireResponse?${searchParameters.join('&')}`, {
        resolveReferences: ['subject'],
        graph: false,
        flat: true
      })
      .then(result => {
        this.setState({ questionnaireResponses: result });
      })
      .then(() => this.getQuestionnaireTitles());
  }

  getQuestionnaireTitles() {
    const promises = [];
    if (this.state.questionnaireResponses.data) {
      if (this.state.questionnaireResponses.data.length > 0) {
        for (const canonical of this.state.questionnaireResponses.data.map(
          questionnaireResponse => questionnaireResponse.questionnaire
        )) {
          promises.push(
            this.props.client
              .request(canonical)
              .then(questionnaire => [canonical, questionnaire.title || canonical])
          );
        }
        Promise.all(promises).then(pairs => {
          this.setState({ questionnaireTitles: Object.fromEntries(pairs) });
        });
      }
    }
  }

  makeQROption(qr) {
    const questionnaireTitle = this.state.questionnaireTitles[qr.questionnaire];
    const display = `${questionnaireTitle}: created at ${qr.authored}`;
    return {
      key: qr.id,
      text: display,
      value: JSON.stringify(qr)
    };
  }

  render() {
    const patient = this.props.patient;
    let name = '';
    if (patient.name) {
      name = <span> {`${patient.name[0].given[0]} ${patient.name[0].family}`} </span>;
    }

    // add all of the requests to the list of options
    let options = [];
    let responseOptions = [];
    let returned = false;
    if (this.state.deviceRequests.data) {
      returned = true;
      this.state.deviceRequests.data.forEach(e => {
        this.makeOption(e, options);
      });
    }
    if (this.state.serviceRequests.data) {
      returned = true;
      this.state.serviceRequests.data.forEach(e => {
        this.makeOption(e, options);
      });
    }
    if (this.state.medicationRequests.data) {
      returned = true;
      this.state.medicationRequests.data.forEach(e => {
        this.makeOption(e, options);
      });
    }

    if (this.state.medicationDispenses.data) {
      returned = true;
      this.state.medicationDispenses.data.forEach(e => {
        this.makeOption(e, options);
      });
    }

    if (this.state.questionnaireResponses.data) {
      responseOptions = this.state.questionnaireResponses.data.map(qr => this.makeQROption(qr));
      returned = true;
    }

    let noResults = 'No results found.';
    if (!returned) {
      noResults = 'Loading...';
    }

    return (
      <div key={patient.id} className="patient-box">
        <div className="patient-header">
          <span style={{ fontWeight: 'bolder' }}>{name ? name : 'N/A'}</span>{' '}
          {`(ID: ${patient.id})`}
        </div>
        <div className="patient-selection-box">
          <div className="patient-info">
            <div>
              <span style={{ fontWeight: 'bold' }}>Gender</span>: {patient.gender}
            </div>
            <div>
              <span style={{ fontWeight: 'bold' }}>Age</span>: {getAge(patient.birthDate)}
            </div>
          </div>
          <div className="request-info">
            <span style={{ fontWeight: 'bold', marginRight: '5px', padding: '5px' }}>Request:</span>
            {!options.length && returned ? (
              <span className="emptyForm">No requests</span>
            ) : (
              this.makeDropdown(
                options,
                'Select a medication request',
                this.state.request,
                this.handleRequestChange
              )
            )}
          </div>
          <div className="request-info">
            <span style={{ fontWeight: 'bold', marginRight: '5px', padding: '5px' }}>
              In Progress Form:
              <IconButton
                color="primary"
                style={{ padding: '0px 5px' }}
                onClick={this.getResponses}
              >
                <RefreshIcon />
              </IconButton>
            </span>
            {!responseOptions.length && returned ? (
              <span className="emptyForm">No in progress forms</span>
            ) : (
              this.makeDropdown(
                responseOptions,
                'Choose an in-progress form',
                this.state.response,
                this.handleResponseChange
              )
            )}
          </div>
          <Button
            variant="outlined"
            size="small"
            className="select-btn"
            onClick={() => this.updateValues(patient)}
          >
            Select
          </Button>
        </div>
      </div>
    );
  }
}
