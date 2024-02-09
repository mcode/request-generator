import React, { Component } from 'react';
import { getAge, getDrugCodeFromMedicationRequest } from '../../util/fhir';
import './smart.css';
import { Button } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import MedicationIcon from '@mui/icons-material/Medication';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { retrieveLaunchContext } from '../../util/util';

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
      questionnaireTitles: {},
      showMedications: false,
      showQuestionnaires: false,
      numInProgressForms: 0,
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


  makeOption(request, options) {
    const code = this.getCoding(request);

    let option = {
      key: request.id,
      text: code.display + ' (Medication request: ' + code.code + ')',
      code: code.code,
      name: code.display,
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
      this.updateQRResponse(response);
    }
  }

  updatePatient(patient) {
    this.props.callback('patient', patient);
  }

  updateQRResponse(response) {
    this.props.callback('response', response);
  }

  fetchResources(queries) {
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

  handleRequestChange(data, patient) {
    if (data) {
      let coding = this.getCoding(JSON.parse(data));
      this.setState({
        request: data,
        code: coding.code,
        system: coding.system,
        display: coding.display,
        response: ''
      });
      this.props.callback('response', '');
      // update prefetch request for the medication
      const request = JSON.parse(data);
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
      // close the accordian after selecting a medication, can change if we want to keep open
      this.props.callback('expanded', false);
    } else {
      this.setState({
        request: ''
      });
    }
  }

  handleResponseChange(data) {
    if (data) {
      this.setState({
        response: data
      });
      const response = JSON.parse(data);
      this.updateQRResponse(response);
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
        this.setState({ numInProgressForms: result.data.length });
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
    // const display = `${questionnaireTitle}: created at ${qr.authored}`;
    return {
      key: qr.id,
      text: questionnaireTitle,
      time: qr.authored,
      value: JSON.stringify(qr)
    };
  }

  isOrderNotSelected() {
    return Object.keys(this.props.request).length === 0;
  }

  /**
   * Launch In progress From
  */

  relaunch = (data) => {
    this.handleResponseChange(data);
    this.props.callback('expanded', false);
    this.buildLaunchLink(data).then(link => {
      //e.preventDefault();
      window.open(link.url, '_blank');
    });
  };

  async buildLaunchLink(data) {
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

    // using data passed in instead of waiting for state/props variables to be updated
    const resp = JSON.parse(data);
    if (Object.keys(resp).length > 0) {
      response = `QuestionnaireResponse/${resp.id}`;
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

    const result = await retrieveLaunchContext(linkCopy, this.props.patient.id, this.props.client.state);
    linkCopy = result;
    return linkCopy;
  }

  makeResponseTable(columns, options, type, patient) {
    return (
      <TableContainer key={type} component={Paper} sx={{ blackgroundColor: '#ddd', border: '1px solid #535353' }}>
        <Table sx={{ maxHeight: 440, justifyContent: 'center' }} stickyHeader>
          <TableHead sx={{ borderBottom: '1px solid #535353'}}>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ border: 0 }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {options.map((row) => (
              <Tooltip key={row.key} title='Select Medication' arrow>
                <TableRow
                  sx={{ 'td, th': { border: 0 } }}
                  className='hover-row'
                  onClick={() => this.handleRequestChange(row.value, patient)}
                >
                  <TableCell component="th" scope="row">
                    {row.name}
                  </TableCell>
                  <TableCell>{row.code}</TableCell>
                </TableRow>
              </Tooltip>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  makeQuestionnaireTable(columns, options, type, patient) {
    return (
      <TableContainer key={type} component={Paper} sx={{ blackgroundColor: '#ddd', border: '1px solid #535353' }}>
        <Table sx={{ maxHeight: 440, justifyContent: 'center' }} stickyHeader>
          <TableHead sx={{ borderBottom: '1px solid #535353'}}>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ border: 0 }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {options.map((row) => (
              <Tooltip title='Open In-Progress Form' arrow>
                <TableRow
                  key={row.key}
                  sx={{ 'td, th': { border: 0 } }}
                  onClick={() => this.relaunch(row.value)}
                  className='hover-row'
                >
                  <TableCell component="th" scope="row">
                    {row.text}
                  </TableCell>
                  <TableCell>{row.time}</TableCell>
                </TableRow>
              </Tooltip>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  render() {
    const patient = this.props.patient;
    let name = '';
    let fullName = '';
    let formatBirthdate = '';
    if (patient.name) {
      name = <span> {`${patient.name[0].given[0]} ${patient.name[0].family}`} </span>;
      fullName = <span> {`${patient.name[0].given.join(' ')} ${patient.name[0].family}`} </span>;
    }
    if (patient.birthDate) {
      formatBirthdate = new Date(patient.birthDate).toDateString();
    }

    // add all of the requests to the list of options
    let options = [];
    let responseOptions = [];
    if (this.state.deviceRequests.data) {
      this.state.deviceRequests.data.forEach(e => {
        this.makeOption(e, options);
      });
    }
    if (this.state.serviceRequests.data) {
      this.state.serviceRequests.data.forEach(e => {
        this.makeOption(e, options);
      });
    }
    if (this.state.medicationRequests.data) {
      this.state.medicationRequests.data.forEach(e => {
        this.makeOption(e, options);
      });
    }

    if (this.state.medicationDispenses.data) {
      this.state.medicationDispenses.data.forEach(e => {
        this.makeOption(e, options);
      });
    }

    if (this.state.questionnaireResponses.data) {
      responseOptions = this.state.questionnaireResponses.data.map(qr => this.makeQROption(qr));
    }

    const medicationColumns = [
      { id: 'name', label: 'Medication'},
      { id: 'code', label: 'Request #'},
    ];

    const questionnaireColumns = [
      { id: 'name', label: 'Title'},
      { id: 'time', label: 'Created'}
    ];

    const medicationTooltip = options.length === 0 ? 'No medications found.' : `${options.length} medications available`;
    const formTooltip = this.state.numInProgressForms === 0 ? 'No In-Progress Forms' : 'Open In-Progress Forms';

    return (
      <div key={patient.id} className="patient-box">
        <div className="patient-header">
          <span style={{ fontWeight: 'bolder' }}>{name ? name : 'N/A'}</span>{' '}
          {`(ID: ${patient.id})`}
        </div>
        <div className="patient-selection-box">
          <div className="patient-info">
            <div>
              <span style={{ fontWeight: 'bold' }}>Full Name</span>: {fullName}
            </div>
            <div>
              <span style={{ fontWeight: 'bold' }}>Gender</span>: {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
            </div>
            <div>
              <span style={{ fontWeight: 'bold' }}>DoB/Age</span>: {formatBirthdate} ({getAge(patient.birthDate)} years old)
            </div>
          </div>
          <div className="button-options">
          { this.state.showMedications ? 
            <Button variant='contained' className='big-button' startIcon={<MedicationIcon />} onClick={() => this.setState({ showMedications: false })}>Close Medications</Button>
          : <Tooltip title={medicationTooltip} placement="top">
            <span>
              <Button variant='contained' className='big-button' startIcon={<MedicationIcon />} disabled={options.length === 0} onClick={() => {
                this.updatePatient(patient);
                this.setState({ showMedications: true, showQuestionnaires: false });
              }}>Request New Medication</Button>
            </span>
            </Tooltip>}
          { this.state.showQuestionnaires ? 
            <Button variant='contained' className='big-button' startIcon={<MedicationIcon />} onClick={() => this.setState({ showQuestionnaires: false })}>Close In Progress Forms</Button>
          :
          <Tooltip title={formTooltip} placement="top">
            <span>
              <Button variant='contained' className='big-button' startIcon={<MedicationIcon />} disabled={this.state.numInProgressForms === 0} onClick={() => {
              this.updatePatient(patient);
              this.setState({ showQuestionnaires: true, showMedications: false });
            }}>{this.state.numInProgressForms} Form(s) In Progress</Button> 
            </span>
          </Tooltip> 
          }
          <Button
            variant="contained"
            className='select-btn'
            onClick={() => this.updateValues(patient)}
          >
            Select Patient
          </Button>
          </div>
        </div>
        { this.state.showMedications ?
          <div className='patient-table-info'>
            { this.makeResponseTable(medicationColumns, options, 'medication', patient) }
          </div>
        : <span />}
        { this.state.showQuestionnaires ?
          <div className='patient-table-info'>
            { this.makeQuestionnaireTable(questionnaireColumns, responseOptions, 'questionnaire', patient) }
          </div>
        : <span />}
      </div>
    );
  }
}
