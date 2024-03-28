import React, { memo, useState, useEffect } from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField
} from '@mui/material';

import env from 'env-var';
import FHIR from 'fhirclient';

import { headerDefinitions, medicationRequestToRemsAdmins } from '../../util/data';
import { actionTypes } from '../../containers/ContextProvider/reducer';
import { SettingsContext } from '../../containers/ContextProvider/SettingsProvider';

const SettingsSection = props => {
  const [state, dispatch] = React.useContext(SettingsContext);
  const [headers, setHeaders] = useState([]);
  const [originalValues, setOriginalValues] = useState([]);

  useEffect(() => {
    const remsAdminHookEndpoints = {};
    medicationRequestToRemsAdmins.forEach(row => {
      const { rxnorm, display, hookEndpoints } = row;
      hookEndpoints.forEach(endpoint => {
        const { hook, remsAdmin } = endpoint;
        const key = `${rxnorm}_${hook}`;
        remsAdminHookEndpoints[key] = {
          display,
          hook,
          type: 'tableInput',
          default: remsAdmin
        };
      });
    });

    const headers = [
      ...Object.keys(headerDefinitions).map(key => ({ ...headerDefinitions[key], key })),
      ...Object.keys(remsAdminHookEndpoints).map(key => ({ ...remsAdminHookEndpoints[key], key }))
    ]
      // Display the fields in descending order of type. If two fields are the same type, then sort by ascending order of display text.
      .sort(
        (self, other) =>
          -self.type.localeCompare(other.type) || self.display.localeCompare(other.display)
      );
    setHeaders(headers);

    const originals = [
      ...Object.keys(headerDefinitions).map(key => [key, state[key]]),
      ...Object.keys(remsAdminHookEndpoints).map(key => [key, state[key]])
    ];
    setOriginalValues(originals);

    JSON.parse(localStorage.getItem('reqgenSettings') || '[]').forEach(element => {
      try {
        updateSetting(element[0], element[1]);
      } catch {
        if (element[0]) {
          console.log('Could not load setting:' + element[0]);
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
    const headers = Object.keys(headerDefinitions).map(key => [key, state[key]]);
    localStorage.setItem('reqgenSettings', JSON.stringify(headers));
  };

  const resetSettings = () => {
    originalValues.forEach(e => {
      try {
        updateSetting(e[0], e[1]);
      } catch {
        console.log('Failed to reset setting value');
      }
    });
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
      let url = new URL(cdsUrl);
      const resetUrl = url.origin + '/etasu/reset';

      fetch(resetUrl, {
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
        {headers
          .filter(header => header.type !== 'tableInput')
          .map(({ key, type, display }) => {
            switch (type) {
              case 'input':
                return (
                  <Grid key={key} item xs={6}>
                    <div>
                      <TextField
                        label={display}
                        variant="outlined"
                        value={state[key]}
                        onChange={event => {
                          updateSetting(key, event.target.value);
                        }}
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
                            onChange={event => {
                              updateSetting(key, event.target.checked);
                            }}
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
        {resetHeaderDefinitions.map(({ key, display, reset, variant }) => {
          return (
            <Grid item key={key} xs={6}>
              <Button variant={variant ? variant : 'outlined'} onClick={reset(state)}>
                {display}
              </Button>
            </Grid>
          );
        })}
      </Grid>

      <Grid item xs={12}>
        <TableContainer
          component={Paper}
          sx={{ border: '1px solid #535353', 'td, th': { border: 0 }, 'td, input': { py: 1 } }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ th: { fontWeight: 'bold' } }}>
                <TableCell>Medication</TableCell>
                <TableCell>CDS Hook</TableCell>
                <TableCell>REMS Admin Endpoint</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {headers
                .filter(header => header.type === 'tableInput')
                .map(({ key, hook, display }) => (
                  <TableRow key={key}>
                    <TableCell>{display}</TableCell>
                    <TableCell>{hook}</TableCell>
                    <TableCell>
                      <TextField
                        variant="outlined"
                        value={state[key]}
                        onChange={event => {
                          updateSetting(key, event.target.value);
                        }}
                        sx={{ width: '100%' }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
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

      <Grid container item xs={12} justifyContent="flex-end" direction="row" spacing={2}>
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
