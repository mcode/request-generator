import React, { memo, useEffect, useState } from 'react';
import {
  Button,
  Checkbox,
  FormControlLabel,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  Paper,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  TextField
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

import env from 'env-var';
import FHIR from 'fhirclient';

import {
  headerDefinitions,
  ORDER_SIGN,
  ORDER_SELECT,
  PATIENT_VIEW,
  ENCOUNTER_START,
  REMS_ETASU
} from '../../util/data';
import { getPatientFirstAndLastName } from '../../util/util';
import { actionTypes } from '../../containers/ContextProvider/reducer';
import { SettingsContext } from '../../containers/ContextProvider/SettingsProvider';

const ENDPOINT = [ORDER_SIGN, ORDER_SELECT, PATIENT_VIEW, ENCOUNTER_START, REMS_ETASU];

const SettingsSection = props => {
  const { client, userId } = props;

  const [state, dispatch, updateSetting, readSettings, saveSettings] =
    React.useContext(SettingsContext);

  // State for PACIO automatic polling
  const [lastPacioTimestamp, setLastPacioTimestamp] = useState(null);

  const fieldHeaders = Object.keys(headerDefinitions)
    .map(key => ({ ...headerDefinitions[key], key }))
    // Display the fields in descending order of type. If two fields are the same type,
    // then sort by ascending order of display text.
    .sort(
      (self, other) =>
        -self.type.localeCompare(other.type) || self.display.localeCompare(other.display)
    );

  useEffect(() => {
    readSettings();
  }, []);

  const resetSettings = () => {
    dispatch({ type: actionTypes.resetSettings });
  };

  const resetPims =
    ({ pimsUrl }) =>
    () => {
      let url = new URL(pimsUrl);
      const resetUrl = url.origin + '/doctorOrders/api/deleteAll';
      console.log('reset pims: ' + resetUrl);

      fetch(resetUrl, {
        method: 'DELETE'
      })
        .then(response => {
          console.log('Reset pims: ');
          console.log(response);
        })
        .catch(error => {
          console.log('Reset pims error: ');
          console.log(error);
        });
    };

  const resetRemsAdmin =
    ({ cdsUrl }) =>
    () => {
      fetch(cdsUrl, {
        method: 'POST'
      })
        .then(response => {
          console.log('Reset rems admin etasu: ');
          console.log(response);
        })
        .catch(error => {
          console.log('Reset rems admin error: ');
          console.log(error);
        });
    };

  const clearResourceWithParams = async (type, params) => {
    console.log('Clear ' + type + 's from the EHR');
    let query = type;
    if (params != '') {
      query = type + params;
      console.log('    -> with params ' + params);
    }

    try {
      const result = await client.request(query, { flat: true });
      console.log(result);

      // Delete all resources in parallel and wait for all to complete
      const deletePromises = result.map(async resource => {
        console.log('Delete ' + type + ': ' + resource.id);
        try {
          const deleteResult = await client.delete(type + '/' + resource.id);
          console.log(deleteResult);
        } catch (e) {
          console.log('Failed to delete ' + type + ' ' + resource.id);
          console.log(e);
        }
      });

      await Promise.all(deletePromises);
      console.log(`Finished deleting all ${type}s`);
    } catch (e) {
      console.log('Failed to retrieve list of ' + type + 's');
      console.log(e);
    }
  };

  const clearResource =
    ({}, type) =>
    async () => {
      // Delete all resources of type type
      return await clearResourceWithParams(type, '');
    };

  const clearPatient =
    ({ patientOfInterest }) =>
    async () => {
      console.log(`clear patient ${patientOfInterest}`);

      try {
        // Delete related resources first
        await clearResourceWithParams('MedicationRequest', `?subject=${patientOfInterest}`);
        await clearResourceWithParams('Communication', `?subject=${patientOfInterest}`);
        await clearResourceWithParams('Coverage', `?beneficiary=${patientOfInterest}`);

        // Finally delete the patient
        const result = await client.delete(`Patient/${patientOfInterest}`);
        console.log('Successfully deleted patient:', result);
      } catch (e) {
        console.log('Failed to delete patient:', e);
      }
    };

  const reconnectEhr =
    ({ baseUrl, redirect }) =>
    () => {
      FHIR.oauth2.authorize({
        clientId: env.get('VITE_CLIENT').asString(),
        iss: baseUrl,
        redirectUri: redirect,
        scope: env.get('VITE_CLIENT_SCOPES').asString()
      });
    };

  const createCommunication = (patientId, practitionerId, message) => {
    const ts = Date.now();
    const currentDate = new Date(ts);

    const communication = {
      resourceType: 'Communication',
      status: 'in-progress',
      category: [
        {
          coding: [
            {
              system: 'http://acme.org/messagetypes',
              code: 'Alert'
            }
          ],
          text: 'Alert'
        }
      ],
      subject: {
        reference: 'Patient/' + patientId
      },
      sent: currentDate.toISOString(),
      received: currentDate.toISOString(),
      recipient: [
        {
          reference: 'Practitioner/' + practitionerId
        }
      ],
      sender: {
        reference: 'Device/f001'
      },
      payload: [
        {
          contentString: message
        }
      ]
    };

    return communication;
  };

  const addCommunication = (patientId, message) => {
    // add a communication notifying the practitioner that the resources were created
    const communication = createCommunication(patientId, userId, message);

    client
      .create(communication)
      .then(result => {
        //console.log(result);
      })
      .catch(e => {
        console.log('Failed to add Communication to EHR');
        console.log(e);
      });
  };

  const parsePacioToc = async pacioToc => {
    console.log('    Parse PACIO TOC Bundle');
    let medicationStatementList = [];
    let patient = null;

    pacioToc?.entry.forEach(tocEntry => {
      const tocResource = tocEntry?.resource;

      switch (tocResource?.resourceType) {
        case 'Patient':
          // find the patient
          console.log('      Found Patient');
          patient = tocResource;
          break;
        case 'Bundle':
          console.log('      Process TOC Bundle');
          tocResource?.entry.forEach(bundleEntry => {
            const bundleEntryResource = bundleEntry?.resource;
            switch (bundleEntryResource?.resourceType) {
              case 'MedicationStatement':
                // find the MedicationStatements
                console.log('        Found MedicationStatement');
                medicationStatementList.push(bundleEntryResource);
                break;
            }
          });
          break;
      }
    });

    if (!patient) {
      console.log('PACIO TOC missing Patient');
      return;
    }

    // Get prescriber from settings
    const newPrescriberId = state.pacioNewPrescriberId;
    console.log(
      `    Converting MedicationStatements to MedicationRequests with prescriber: ${newPrescriberId}`
    );

    let targetPatient = null;
    console.log('    Creating new patient from TOC bundle');
    try {
      targetPatient = await client.create(patient);
      console.log(
        `    Created new patient: ${getPatientFirstAndLastName(targetPatient)} (${targetPatient.id})`
      );
      addCommunication(
        targetPatient.id,
        `Added new patient (${getPatientFirstAndLastName(targetPatient)}) from transfer of care`
      );
    } catch (e) {
      console.log('    Failed to create patient:', e);
      return;
    }

    // Convert MedicationStatements to MedicationRequests
    const patientId = targetPatient.id;
    const patientName = getPatientFirstAndLastName(targetPatient);
    console.log(`    Creating MedicationRequests for patient ${patientName} (${patientId})`);

    for (const medicationStatement of medicationStatementList) {
      // Create a new MedicationRequest from the MedicationStatement
      const medicationRequest = {
        resourceType: 'MedicationRequest',
        meta: {
          profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-medicationrequest']
        },
        status: 'active',
        intent: 'order',
        subject: {
          reference: `Patient/${patientId}`,
          display: patientName
        },
        authoredOn: new Date().toISOString().split('T')[0],
        requester: {
          reference: `Practitioner/${newPrescriberId}`,
          display: 'Transfer Prescriber'
        }
      };

      // Add insurance/coverage reference if available
      if (coverageId) {
        medicationRequest.insurance = [
          {
            reference: `Coverage/${coverageId}`
          }
        ];
      }

      // Copy medication information
      if (medicationStatement.medicationCodeableConcept) {
        medicationRequest.medicationCodeableConcept = medicationStatement.medicationCodeableConcept;
      } else if (medicationStatement.medicationReference) {
        medicationRequest.medicationReference = medicationStatement.medicationReference;
      }

      // Copy dosage if available
      if (medicationStatement.dosage && medicationStatement.dosage.length > 0) {
        medicationRequest.dosageInstruction = medicationStatement.dosage.map((dosage, index) => ({
          sequence: index + 1,
          text: dosage.text,
          timing: dosage.timing,
          route: dosage.route,
          doseAndRate: dosage.doseAndRate
        }));
      }

      // Add note about transfer
      medicationRequest.note = [
        {
          text: `Continued from previous care. Original medication statement: ${medicationStatement.id || 'unknown'}`
        }
      ];

      const medName =
        medicationRequest.medicationCodeableConcept?.coding?.[0]?.display || 'Unknown medication';

      try {
        const medicationRequestResult = await client.create(medicationRequest);
        console.log(`    Added new MedicationRequest for ${medName} (ID: ${medicationRequestResult.id})`);
        addCommunication(
          patientId,
          `Added new MedicationRequest for ${medName} from transfer of care`
        );
      } catch (e) {
        console.log(`    Failed to add MedicationRequest for ${medName}:`, e);
      }
    }
  };

  const pollPacioNotifications = async () => {
    const pacioEhrUrl = state.pacioEhrUrl;

    if (!pacioEhrUrl) {
      return;
    }

    try {
      console.log('Polling PACIO discharge notifications...');

      // Build query URL
      let query = '?type=message&_format=json';
      if (lastPacioTimestamp) {
        query += `&_lastUpdated=gt${lastPacioTimestamp}`;
        console.log(`  Using timestamp filter: ${lastPacioTimestamp}`);
      } else {
        console.log('  First poll - no timestamp filter');
      }

      const pacioFhirClient = FHIR.client({
        serverUrl: pacioEhrUrl
      });

      // Fetch discharge notifications
      const searchBundle = await pacioFhirClient.request(query);

      // Update timestamp from server response for next poll
      if (searchBundle?.meta?.lastUpdated) {
        const serverTimestamp = searchBundle.meta.lastUpdated;
        console.log(`  Server timestamp: ${serverTimestamp}`);
        setLastPacioTimestamp(serverTimestamp);
      }

      if (searchBundle?.entry && searchBundle.entry.length > 0) {
        console.log(`  Found ${searchBundle.entry.length} discharge notification(s)`);

        for (const notificationEntry of searchBundle.entry) {
          const notificationBundle = notificationEntry.resource;

          if (
            notificationBundle?.resourceType === 'Bundle' &&
            notificationBundle.type === 'message'
          ) {
            console.log(`  Processing notification bundle: ${notificationBundle.id}`);

            // Find DocumentReference in the notification bundle
            let documentReference = null;
            if (notificationBundle.entry) {
              for (const entry of notificationBundle.entry) {
                if (entry.resource?.resourceType === 'DocumentReference') {
                  documentReference = entry.resource;
                  console.log('    Found DocumentReference (TOC)');
                  break;
                }
              }
            }

            if (documentReference?.content?.[0]?.attachment?.url) {
              const tocBundleUrl = documentReference.content[0].attachment.url;
              console.log(`    Fetching TOC bundle from: ${tocBundleUrl}`);

              // Fetch and process the TOC bundle
              try {
                const tocBundle = await pacioFhirClient.request(tocBundleUrl);
                await parsePacioToc(tocBundle);
              } catch (e) {
                console.log(`    Failed to fetch/process TOC bundle:`, e);
              }
            } else {
              console.log('    No DocumentReference with TOC bundle URL found');
            }
          }
        }
      } else {
        console.log('  No new notifications found');
      }
    } catch (e) {
      console.log('Failed to poll PACIO notifications:', e);
    }
  };

  // Reset timestamp when PACIO URL changes (switching servers)
  useEffect(() => {
    if (state.pacioEhrUrl) {
      console.log('PACIO URL changed, resetting timestamp for fresh poll');
      setLastPacioTimestamp(null);
    }
  }, [state.pacioEhrUrl]);

  // Setup automatic polling on component mount
  useEffect(() => {
    if (!state.pacioEhrUrl) {
      return;
    }

    // Poll immediately on mount or URL change
    pollPacioNotifications();

    // Then poll every 30 seconds
    const interval = setInterval(() => {
      pollPacioNotifications();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [state.pacioEhrUrl, lastPacioTimestamp]);

  const resetHeaderDefinitions = [
    {
      display: 'Reset PIMS Database',
      key: 'resetPims',
      reset: resetPims
    },
    {
      display: 'Reset REMS-Admin Database',
      key: 'resetRemsAdmin',
      reset: resetRemsAdmin
    },
    {
      display: 'Clear EHR In-Progress Forms',
      key: 'clearQuestionnaireResponses',
      reset: clearResource,
      parameter: 'QuestionnaireResponse'
    },
    {
      display: 'Clear EHR Dispense Statuses',
      key: 'clearMedicationDispenses',
      reset: clearResource,
      parameter: 'MedicationDispense'
    },
    {
      display: 'Clear EHR Tasks',
      key: 'clearTasks',
      reset: clearResource,
      parameter: 'Task'
    },
    {
      display: 'Clear EHR Patient',
      key: 'clearPatient',
      reset: clearPatient
    },
    {
      display: 'Reconnect EHR',
      key: 'reconnectEHR',
      reset: reconnectEhr,
      variant: 'contained'
    }
  ];

  let firstCheckbox = true;
  let showBreak = true;

  return (
    <Grid container spacing={2} sx={{ padding: '20px' }}>
      <Grid container item xs={12} direction="row" spacing={2}>
        {fieldHeaders.map(({ key, type, display }) => {
          switch (type) {
            case 'input':
              return (
                <Grid key={key} item xs={6}>
                  {(state['useDefaultUser'] && key === 'defaultUser') || key != 'defaultUser' ? (
                    <div>
                      <TextField
                        label={display}
                        variant="outlined"
                        value={state[key]}
                        onChange={event => updateSetting(key, event.target.value)}
                        sx={{ width: '100%' }}
                      />
                    </div>
                  ) : (
                    ''
                  )}
                </Grid>
              );
            case 'check':
              if (firstCheckbox) {
                firstCheckbox = false;
                showBreak = true;
              } else {
                showBreak = false;
              }
              return (
                <React.Fragment key={key}>
                  {showBreak ? <Grid item xs={12}></Grid> : ''}
                  <Grid item xs={3}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={Boolean(state[key])}
                          onChange={event => updateSetting(key, event.target.checked)}
                        />
                      }
                      label={display}
                    />
                  </Grid>
                </React.Fragment>
              );
            case 'dropdown':
              return (
                <React.Fragment key={key}>
                  <Grid key={key} item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel id="dropdown-label">
                        Hook to send when selecting a patient
                      </InputLabel>
                      <Select
                        labelId="dropdown-label"
                        id="dropdown"
                        value={state[key]}
                        label="Hook to send when selecting a patient"
                        onChange={event => updateSetting(key, event.target.value)}
                        sx={{ width: '100%' }}
                      >
                        <MenuItem key={PATIENT_VIEW} value={PATIENT_VIEW}>
                          {PATIENT_VIEW}
                        </MenuItem>
                        <MenuItem key={ENCOUNTER_START} value={ENCOUNTER_START}>
                          {ENCOUNTER_START}
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </React.Fragment>
              );
            default:
              return (
                <div key={key}>
                  <p className="setting-header">{display}</p>
                </div>
              );
          }
        })}
      </Grid>

      <Grid item xs={12} sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer
          component={Paper}
          sx={{
            border: '1px solid #535353',
            'td, th': { border: 0 },
            'td, input': { py: 1 },
            maxHeight: 440
          }}
        >
          {!state['useIntermediary'] && (
            <Table stickyHeader aria-label="sticky table">
              <TableHead>
                <TableRow sx={{ th: { fontWeight: 'bold' } }}>
                  <TableCell width={500}>Medication Display</TableCell>
                  <TableCell width={200}>Medication RxNorm Code</TableCell>
                  <TableCell width={200}>Hook / Endpoint</TableCell>
                  <TableCell width={500}>REMS Admin URL</TableCell>
                  {/* This empty TableCell corresponds to the add and delete 
                buttons. It is used to fill up the sticky header which 
                will appear over the gray/white table rows. */}
                  <TableCell width={150} />
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(state.medicationRequestToRemsAdmins).map(([key, row]) => {
                  return (
                    <TableRow key={key}>
                      <TableCell>
                        <TextField
                          variant="outlined"
                          value={row.display}
                          onChange={event =>
                            dispatch({
                              type: actionTypes.updateCdsHookSetting,
                              settingId: key,
                              value: { display: event.target.value }
                            })
                          }
                          sx={{ width: '100%' }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          variant="outlined"
                          value={row.rxnorm}
                          onChange={event =>
                            dispatch({
                              type: actionTypes.updateCdsHookSetting,
                              settingId: key,
                              value: { rxnorm: event.target.value }
                            })
                          }
                          sx={{ width: '100%' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          labelId="dropdown-label"
                          id="dropdown"
                          value={row.endpointType}
                          onChange={event =>
                            dispatch({
                              type: actionTypes.updateCdsHookSetting,
                              settingId: key,
                              value: { endpointType: event.target.value }
                            })
                          }
                          sx={{ width: '100%' }}
                        >
                          {ENDPOINT.map(endpointType => (
                            <MenuItem key={endpointType} value={endpointType}>
                              {endpointType}
                            </MenuItem>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell>
                        <TextField
                          variant="outlined"
                          value={row.remsAdmin}
                          onChange={event =>
                            dispatch({
                              type: actionTypes.updateCdsHookSetting,
                              settingId: key,
                              value: { remsAdmin: event.target.value }
                            })
                          }
                          sx={{ width: '100%' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Add a new row below">
                          <IconButton
                            color="primary"
                            onClick={() =>
                              dispatch({ type: actionTypes.addCdsHookSetting, settingId: key })
                            }
                            size="large"
                          >
                            <AddIcon fontSize="large" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete this row">
                          <IconButton
                            color="primary"
                            onClick={() =>
                              dispatch({ type: actionTypes.deleteCdsHookSetting, settingId: key })
                            }
                            size="large"
                          >
                            <DeleteIcon fontSize="large" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </Grid>

      {/* spacer */}
      <hr
        style={{
          width: '100%'
        }}
      />

      <Grid container item xs={6} justifyContent="flex-start" direction="row" spacing={2}>
        {resetHeaderDefinitions.map(({ key, display, reset, variant, parameter }) => {
          return (
            <Grid item key={key}>
              <Button variant={variant ? variant : 'outlined'} onClick={reset(state, parameter)}>
                {display}
              </Button>
            </Grid>
          );
        })}
      </Grid>

      <Grid container item xs={6} justifyContent="flex-end" direction="row" spacing={2}>
        <Grid item>
          <Button variant="outlined" onClick={resetSettings}>
            Reset
          </Button>
        </Grid>
        <Grid item>
          <Button variant="contained" onClick={saveSettings}>
            Save
          </Button>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default memo(SettingsSection);