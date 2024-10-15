import { useEffect, useState } from 'react';
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
import {
  getPatientFirstAndLastName,
  getPatientFullName,
  retrieveLaunchContext
} from '../../util/util';

const PatientBox = props => {
  const [state, setState] = useState({
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
    name: 'N/A',
    fullName: 'N/A',
    formatBirthDate: '',
    options: [],
    responseOptions: []
  });

  const {
    patient,
    callback,
    clearCallback,
    user,
    client,
    callbackMap,
    updatePrefetchCallback,
    responseExpirationDays,
    request,
    launchUrl,
    showButtons,
  } = props;

  const medicationColumns = [
    { id: 'name', label: 'Medication' },
    { id: 'code', label: 'Request #' }
  ];
  const questionnaireColumns = [
    { id: 'name', label: 'Title' },
    { id: 'time', label: 'Created' }
  ];
  const medicationTooltip =
    state.options.length === 0
      ? 'No medications found.'
      : `${state.options.length} medications available`;
  const formTooltip =
    state.numInProgressForms === 0 ? 'No In-Progress Forms' : 'Open In-Progress Forms';

  useEffect(() => {
    // get requests and responses on open of patients
    if (props.showButtons) {
      getRequests();
      getResponses(); // TODO: PatientBox should not be rendering itself, needs to receive its state from parent
    }
    getPatientInfo();
  }, []);

  const getCoding = resource => {
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
  };

  const makeOption = (request, options) => {
    const code = getCoding(request);
    const tempOptions = options;

    let option = {
      key: request.id,
      text: code.display + ' (Medication request: ' + code.code + ')',
      code: code.code,
      name: code.display,
      value: JSON.stringify(request)
    };
    tempOptions.push(option);
    setState(prevState => ({ ...prevState, options: tempOptions }));
  };

  const updateValues = patient => {
    callback('patient', patient);
    callback('expanded', false);
    clearCallback();
    if (state.request) {
      const request = JSON.parse(state.request);
      if (
        request.resourceType === 'DeviceRequest' ||
        request.resourceType === 'ServiceRequest' ||
        request.resourceType === 'MedicationRequest' ||
        request.resourceType === 'MedicationDispense'
      ) {
        updatePrefetchRequest(request, patient, user);
      } else {
        clearCallback();
      }
    } else {
      updatePrefetchRequest(null, patient, user);
      callback('request', {});
      callback('code', null);
      callback('codeSystem', null);
      callback('display', null);
    }

    if (state.response) {
      const response = JSON.parse(state.response);
      updateQRResponse(response);
    }
  };

  const updatePatient = patient => {
    callback('patient', patient);
  };

  const updateQRResponse = response => {
    callback('response', response);
  };

  const fetchResources = queries => {
    let requests = [];
    callback('prefetchCompleted', false);
    queries.forEach((query, queryKey) => {
      const urlQuery = '/' + query;
      requests.push(
        client
          .request(urlQuery)
          .then(response => {
            console.log(response);
            return response;
          })
          .then(resource => {
            callbackMap('prefetchedResources', queryKey, resource);
          })
      );
    });

    Promise.all(requests)
      .then(() => {
        console.log('fetchResourcesSync: finished');
        callback('prefetchCompleted', true);
      })
      .catch(function (err) {
        console.log('fetchResourcesSync: failed to wait for all the prefetch to populate');
        console.log(err);
      });
  };

  const updatePrefetchRequest = (request, patient, user) => {
    const patientReference = 'Patient/' + patient?.id;
    const userReference = 'Practitioner/' + user;
    if (request) {
      callback(request.resourceType, request);
      const queries = updatePrefetchCallback(
        request,
        patientReference,
        userReference,
        'request',
        'patient',
        'practitioner'
      );
      fetchResources(queries);

      callback('request', request);
      const coding = getCoding(request);
      callback('code', coding.code);
      callback('codeSystem', coding.system);
      callback('display', coding.display);
    } else {
      const queries = updatePrefetchCallback(
        request,
        patientReference,
        userReference,
        'patient',
        'practitioner',
        'medicationRequests'
      );
      fetchResources(queries);
    }
  };

  const getMedicationRequest = patientId => {
    client
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
        setState(prevState => ({ ...prevState, medicationRequests: result }));
        result.data.forEach(e => {
          makeOption(e, state.options);
        });
      });
  };

  const handleRequestChange = (data, patient) => {
    if (data) {
      let coding = getCoding(JSON.parse(data));

      setState(prevState => ({
        ...prevState,
        request: data,
        code: coding.code,
        system: coding.system,
        display: coding.display,
        response: ''
      }));
      callback('response', '');
      clearCallback();
      // update prefetch request for the medication
      const request = JSON.parse(data);
      if (
        request.resourceType === 'DeviceRequest' ||
        request.resourceType === 'ServiceRequest' ||
        request.resourceType === 'MedicationRequest' ||
        request.resourceType === 'MedicationDispense'
      ) {
        updatePrefetchRequest(request, patient, user);
      } else {
        clearCallback();
      }
      // close the accordian after selecting a medication, can change if we want to keep open
      callback('expanded', false);
    } else {
      setState(prevState => ({
        ...prevState,
        request: ''
      }));
    }
  };

  const handleResponseChange = data => {
    if (data) {
      setState(prevState => ({
        ...prevState,
        response: data
      }));
      const response = JSON.parse(data);
      updateQRResponse(response);
    } else {
      setState(prevState => ({
        ...prevState,
        response: ''
      }));
    }
  };

  const getRequests = () => {
    const patientId = patient.id;
    getMedicationRequest(patientId);
  };

  /**
   * Retrieve QuestionnaireResponse
   */
  const getResponses = () => {
    const patientId = patient.id;

    let updateDate = new Date();
    updateDate.setDate(updateDate.getDate() - responseExpirationDays);
    const searchParameters = [
      `_lastUpdated=gt${updateDate.toISOString().split('T')[0]}`,
      'status=in-progress',
      `subject=Patient/${patientId}`,
      '_sort=-authored'
    ];
    client
      .request(`QuestionnaireResponse?${searchParameters.join('&')}`, {
        resolveReferences: ['subject'],
        graph: false,
        flat: true
      })
      .then(result => {
        setState(prevState => ({
          ...prevState,
          questionnaireResponses: result,
          numInProgressForms: result.data.length
        }));
        getQuestionnaireTitles(result);
      });
  };

  const getQuestionnaireTitles = qResponse => {
    const promises = [];
    if (qResponse.data) {
      if (qResponse.data.length > 0) {
        for (const canonical of qResponse.data.map(
          questionnaireResponse => questionnaireResponse.questionnaire
        )) {
          promises.push(
            client
              .request(canonical)
              .then(questionnaire => [canonical, questionnaire.title || canonical])
          );
        }
        Promise.all(promises).then(pairs => {
          setState(prevState => ({
            ...prevState,
            questionnaireTitles: Object.fromEntries(pairs)
          }));
          // call get response options from here, to pass in the questionnaireResponses data and questionnaireTitles
          // before state variables are set
          getResponseOptions(qResponse.data, Object.fromEntries(pairs));
        });
      }
    }
  };

  const getResponseOptions = (data, title) => {
    const temp = data.map(qr => makeQROption(qr, title));
    setState(prevState => ({
      ...prevState,
      responseOptions: temp
    }));
  };

  const makeQROption = (qr, questionnaireTitles) => {
    const questionnaireTitle = questionnaireTitles[qr.questionnaire];
    return {
      key: qr.id,
      text: questionnaireTitle,
      time: qr.authored,
      value: JSON.stringify(qr)
    };
  };

  const isOrderNotSelected = () => {
    return Object.keys(request).length === 0;
  };

  /**
   * Launch In progress Form
   */

  const relaunch = data => {
    handleResponseChange(data);
    callback('expanded', false);
    buildLaunchLink(data).then(link => {
      //e.preventDefault();
      window.open(link.url, '_blank');
    });
  };

  const buildLaunchLink = async data => {
    // build appContext and URL encode it
    let appContext = '';
    let order = undefined,
      coverage = undefined,
      response = undefined;

    if (!isOrderNotSelected()) {
      if (Object.keys(request).length > 0) {
        order = `${request.resourceType}/${request.id}`;
        if (request.insurance && request.insurance.length > 0) {
          coverage = `${request.insurance[0].reference}`;
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
      url: launchUrl
    };

    let linkCopy = Object.assign({}, link);

    const result = await retrieveLaunchContext(linkCopy, patient.id, client.state);
    linkCopy = result;
    return linkCopy;
  };

  const makeResponseTable = (columns, options, type, patient) => {
    return (
      <TableContainer key={type} component={Paper} sx={{ border: '1px solid #535353' }}>
        <Table sx={{ maxHeight: 440, justifyContent: 'center' }} stickyHeader>
          <TableHead sx={{ borderBottom: '1px solid #535353' }}>
            <TableRow>
              {columns.map(column => (
                <TableCell key={column.id} align={column.align} style={{ border: 0 }}>
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {options.map(row => (
              <Tooltip key={row.key} title="Select Medication" arrow>
                <TableRow
                  sx={{ 'td, th': { border: 0 } }}
                  className="hover-row"
                  onClick={() => handleRequestChange(row.value, patient)}
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
  };

  const makeQuestionnaireTable = (columns, options, type, _patient) => {
    return (
      <TableContainer
        key={type}
        component={Paper}
        sx={{ backgroundColor: '#ddd', border: '1px solid #535353' }}
      >
        <Table sx={{ maxHeight: 440, justifyContent: 'center' }} stickyHeader>
          <TableHead sx={{ borderBottom: '1px solid #535353' }}>
            <TableRow>
              {columns.map(column => (
                <TableCell key={column.id} align={column.align} style={{ border: 0 }}>
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {options.map(row => (
              <Tooltip title="Open In-Progress Form" arrow key={row.key}>
                <TableRow
                  key={row.key}
                  sx={{ 'td, th': { border: 0 } }}
                  onClick={() => relaunch(row.value)}
                  className="hover-row"
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
  };

  const getPatientInfo = () => {
    if (patient.name) {
      setState(prevState => ({
        ...prevState,
        name: getPatientFirstAndLastName(patient)
      }));
      setState(prevState => ({
        ...prevState,
        fullName: getPatientFullName(patient)
      }));
    }
    if (patient.birthDate) {
      setState(prevState => ({
        ...prevState,
        formatBirthDate: new Date(patient.birthDate).toDateString()
      }));
    }
  };

  return (
    <div key={patient.id} className="patient-box">
      <div className="patient-header">
        <span style={{ fontWeight: 'bolder' }}>{state.name}</span> {`(ID: ${patient.id})`}
      </div>
      <div className="patient-selection-box">
        <div className="patient-info">
          <div>
            <span style={{ fontWeight: 'bold' }}>Full Name</span>: {state.fullName}
          </div>
          <div>
            <span style={{ fontWeight: 'bold' }}>Gender</span>:{' '}
            {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
          </div>
          <div>
            <span style={{ fontWeight: 'bold' }}>DoB/Age</span>: {state.formatBirthDate} (
            {getAge(patient.birthDate)} years old)
          </div>
        </div>
        <div className="button-options">
          {props.showButtons ? (
            state.showMedications ? (
              <Button
                variant="contained"
                className="big-button"
                startIcon={<MedicationIcon />}
                onClick={() => setState(prevState => ({ ...prevState, showMedications: false }))}
              >
                Close Medications
              </Button>
            ) : (
              <Tooltip title={medicationTooltip} placement="top">
                <span>
                  <Button
                    variant="contained"
                    className="big-button"
                    startIcon={<MedicationIcon />}
                    disabled={state.options.length === 0}
                    onClick={() => {
                      updatePatient(patient);
                      setState(prevState => ({
                        ...prevState,
                        showMedications: true,
                        showQuestionnaires: false
                      }));
                    }}
                  >
                    Request New Medication
                  </Button>
                </span>
              </Tooltip>
            )
          ) : ""}
          {props.showButtons ? (
            state.showQuestionnaires ? (
              <Button
                variant="contained"
                className="big-button"
                startIcon={<MedicationIcon />}
                onClick={() => setState(prevState => ({ ...prevState, showQuestionnaires: false }))}
              >
                Close In Progress Forms
              </Button>
            ) : (
              <Tooltip title={formTooltip} placement="top">
                <span>
                  <Button
                    variant="contained"
                    className="big-button"
                    startIcon={<MedicationIcon />}
                    disabled={state.numInProgressForms === 0}
                    onClick={() => {
                      updatePatient(patient);
                      setState(prevState => ({
                        ...prevState,
                        showQuestionnaires: true,
                        showMedications: false
                      }));
                    }}
                  >
                    {state.numInProgressForms} Form(s) In Progress
                  </Button>
                </span>
              </Tooltip>
            )
          ) : ""}
          <Button variant="contained" className="select-btn" onClick={() => updateValues(patient)}>
            Select Patient
          </Button>
        </div>
      </div>
      {state.showMedications ? (
        <div className="patient-table-info">
          {makeResponseTable(medicationColumns, state.options, 'medication', patient)}
        </div>
      ) : (
        <span />
      )}
      {state.showQuestionnaires ? (
        <div className="patient-table-info">
          {makeQuestionnaireTable(
            questionnaireColumns,
            state.responseOptions,
            'questionnaire',
            patient
          )}
        </div>
      ) : (
        <span />
      )}
    </div>
  );
};

export default PatientBox;
