import React, { memo, useState, useEffect } from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
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

import { headerDefinitions, medicationRequestToRemsAdmins } from '../../util/data';
import { actionTypes, initialState } from '../../containers/ContextProvider/reducer';
import { SettingsContext } from '../../containers/ContextProvider/SettingsProvider';

const CDS_HOOKS = ['order-sign', 'order-select', 'patient-view'];

const SettingsSection = props => {
  const [state, dispatch] = React.useContext(SettingsContext);

  const fieldHeaders = Object.keys(headerDefinitions)
    .map(key => ({ ...headerDefinitions[key], key }))
    // Display the fields in descending order of type. If two fields are the same type,
    // then sort by ascending order of display text.
    .sort(
      (self, other) =>
        -self.type.localeCompare(other.type) || self.display.localeCompare(other.display)
    );

  useEffect(() => {
    JSON.parse(localStorage.getItem('reqgenSettings') || '[]').forEach(([key, value]) => {
      try {
        updateSetting(key, value);
      } catch {
        if (!key) {
          console.log('Could not load setting:' + key);
        }
      }
    });

    // indicate to the rest of the app that the settings have been loaded
    dispatch({
      type: actionTypes.flagStartup
    });
  }, []);

  const updateSetting = (key, value) => {
    dispatch({
      type: actionTypes.updateSetting,
      settingId: key,
      value: value
    });
  };

  const saveSettings = () => {
    const headers = Object.keys(state).map(key => [key, state[key]]);
    localStorage.setItem('reqgenSettings', JSON.stringify(headers));
  };

  const resetSettings = () => {
    dispatch({ type: actionTypes.resetSettings });
  };

  const clearQuestionnaireResponses =
    ({ defaultUser }) =>
    () => {
      props.client
        .request('QuestionnaireResponse?author=' + defaultUser, { flat: true })
        .then(result => {
          result.forEach(resource => {
            props.client
              .delete('QuestionnaireResponse/' + resource.id)
              .then(result => {
                console.log(result);
              })
              .catch(e => {
                console.log('Failed to delete QuestionnaireResponse ' + resource.id);
                console.log(e);
              });
          });
        })
        .catch(e => {
          console.log('Failed to retrieve list of QuestionnaireResponses');
          console.log(e);
        });
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

  const clearMedicationDispenses =
    ({ ehrUrl, access_token }) =>
    () => {
      console.log('Clear MedicationDispenses from the EHR: ' + ehrUrl);
      const client = FHIR.client({
        serverUrl: ehrUrl,
        ...(access_token ? { tokenResponse: access_token } : {})
      });
      client
        .request('MedicationDispense', { flat: true })
        .then(result => {
          console.log(result);
          result.forEach(resource => {
            console.log(resource.id);
            client
              .delete('MedicationDispense/' + resource.id)
              .then(result => {
                console.log(result);
              })
              .catch(e => {
                console.log('Failed to delete MedicationDispense ' + resource.id);
                console.log(e);
              });
          });
        })
        .catch(e => {
          console.log('Failed to retrieve list of MedicationDispense');
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
      display: 'Clear In-Progress Forms',
      key: 'clearQuestionnaireResponses',
      reset: clearQuestionnaireResponses
    },
    {
      display: 'Reset REMS-Admin Database',
      key: 'resetRemsAdmin',
      reset: resetRemsAdmin
    },
    {
      display: 'Clear EHR MedicationDispenses',
      key: 'clearMedicationDispenses',
      reset: clearMedicationDispenses
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
                  <div>
                    <TextField
                      label={display}
                      variant="outlined"
                      value={state[key]}
                      onChange={event => updateSetting(key, event.target.value)}
                      sx={{ width: '100%' }}
                    />
                  </div>
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
          <Table stickyHeader aria-label="sticky table">
            <TableHead>
              <TableRow sx={{ th: { fontWeight: 'bold' } }}>
                <TableCell width={500}>Medication Display</TableCell>
                <TableCell width={200}>Medication RxNorm Code</TableCell>
                <TableCell width={200}>CDS Hook</TableCell>
                <TableCell width={500}>REMS Admin Endpoint</TableCell>
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
                        value={row.hook}
                        onChange={event =>
                          dispatch({
                            type: actionTypes.updateCdsHookSetting,
                            settingId: key,
                            value: { hook: event.target.value }
                          })
                        }
                        sx={{ width: '100%' }}
                      >
                        {CDS_HOOKS.map(hook => (
                          <MenuItem key={hook} value={hook}>
                            {hook}
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
        </TableContainer>
      </Grid>

      {/* spacer */}
      <hr
        style={{
          width: '100%'
        }}
      />

      <Grid container item xs={6} justifyContent="flex-start" direction="row" spacing={2}>
        {resetHeaderDefinitions.map(({ key, display, reset, variant }) => {
          return (
            <Grid item key={key}>
              <Button variant={variant ? variant : 'outlined'} onClick={reset(state)}>
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
