import React, { memo, useEffect } from 'react';
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
import { actionTypes } from '../../containers/ContextProvider/reducer';
import { SettingsContext } from '../../containers/ContextProvider/SettingsProvider';

const ENDPOINT = [ORDER_SIGN, ORDER_SELECT, PATIENT_VIEW, ENCOUNTER_START, REMS_ETASU];

const SettingsSection = props => {
  const [state, dispatch, updateSetting, readSettings, saveSettings] = React.useContext(SettingsContext);

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

  const clearResource = 
    ({ ehrUrl, access_token }, type) =>
    () => {
      console.log('Clear ' + type + 's from the EHR: ' + ehrUrl);
      const client = FHIR.client({
        serverUrl: ehrUrl,
        ...(access_token ? { tokenResponse: access_token } : {})
      });
      client
        .request(type, { flat: true })
        .then(result => {
          console.log(result);
          result.forEach(resource => {
            console.log('Delete ' + type + ': ' + resource.id);
            client
              .delete(type + '/' + resource.id)
              .then(result => {
                console.log(result);
              })
              .catch(e => {
                console.log('Failed to delete ' + type + ' ' + resource.id);
                console.log(e);
              });
          });
        })
        .catch(e => {
          console.log('Failed to retrieve list of ' + type + 's');
          console.log(e);
        });
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
                  { ( (state['useDefaultUser'] && key === 'defaultUser') || key != 'defaultUser' ) ? (
                  <div>
                    <TextField
                      label={display}
                      variant="outlined"
                      value={state[key]}
                      onChange={event => updateSetting(key, event.target.value)}
                      sx={{ width: '100%' }}
                    />
                  </div>
                  ) : ('') }
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
