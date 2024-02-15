import React, { Component } from 'react';
import './SettingsBox.css';
import Checkbox from '@mui/material/Checkbox';

import { headerDefinitions, types } from '../../util/data';
import FHIR from 'fhirclient';
import { Box, Button, FormControlLabel, Grid, TextField } from '@mui/material';

const clearMedicationDispenses =
  ({ ehrUrl, access_token }, consoleLog) =>
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
              consoleLog(
                'Successfully deleted MedicationDispense ' + resource.id + ' from EHR',
                types.info
              );
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

const clearQuestionnaireResponses =
  ({ ehrUrl, defaultUser, access_token }, consoleLog) =>
  () => {
    console.log(
      'Clear QuestionnaireResponses from the EHR: ' + ehrUrl + ' for author ' + defaultUser
    );
    const client = FHIR.client({
      serverUrl: ehrUrl,
      ...(access_token ? { tokenResponse: access_token } : {})
    });
    client
      .request('QuestionnaireResponse?author=' + defaultUser, { flat: true })
      .then(result => {
        console.log(result);
        result.forEach(resource => {
          console.log(resource.id);
          client
            .delete('QuestionnaireResponse/' + resource.id)
            .then(result => {
              consoleLog(
                'Successfully deleted QuestionnaireResponse ' + resource.id + ' from EHR',
                types.info
              );
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
  ({ pimsUrl }, consoleLog) =>
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
        consoleLog('Successfully reset pims database', types.info);
      })
      .catch(error => {
        console.log('Reset pims error: ');
        consoleLog('Server returned error when resetting pims: ', types.error);
        consoleLog(error.message);
        console.log(error);
      });
  };

const resetRemsAdmin =
  ({ cdsUrl }, consoleLog) =>
  () => {
    let url = new URL(cdsUrl);
    const resetUrl = url.origin + '/etasu/reset';

    fetch(resetUrl, {
      method: 'POST'
    })
      .then(response => {
        console.log('Reset rems admin etasu: ');
        console.log(response);
        consoleLog('Successfully reset rems admin etasu', types.info);
      })
      .catch(error => {
        console.log('Reset rems admin error: ');
        consoleLog('Server returned error when resetting rems admin etasu: ', types.error);
        consoleLog(error.message);
        console.log(error);
      });
  };

const resetHeaderDefinitions = [
  {
    display: 'Clear In-Progress Forms',
    key: 'clearQuestionnaireResponses',
    reset: clearQuestionnaireResponses
  },
  {
    display: 'Clear EHR MedicationDispenses',
    key: 'clearMedicationDispenses',
    reset: clearMedicationDispenses
  },
  {
    display: 'Reset PIMS Database',
    key: 'resetPims',
    reset: resetPims
  },
  {
    display: 'Reset REMS-Admin Database',
    key: 'resetRemsAdmin',
    reset: resetRemsAdmin
  }
];

export default class SettingsBox extends Component {
  constructor(props) {
    super(props);
    this.state = {
      originalValues: []
    };
    this.cancelSettings = this.cancelSettings.bind(this);
    this.closeSettings = this.closeSettings.bind(this);
    this.saveSettings = this.saveSettings.bind(this);
  }

  componentDidMount() {
    const headers = Object.keys(headerDefinitions).map(key => [key, this.props.state[key]]);
    this.setState({ originalValues: headers });
  }

  closeSettings() {
    this.props.updateCB('showSettings', false);
  }
  saveSettings() {
    const headers = Object.keys(headerDefinitions).map(key => [key, this.props.state[key]]);
    console.log(headers);
    localStorage.setItem('reqgenSettings', JSON.stringify(headers));
    this.closeSettings();
  }

  cancelSettings() {
    this.state.originalValues.forEach(e => {
      try {
        this.props.updateCB(e[0], e[1]);
      } catch {
        console.log('Failed to reset setting value');
      }
    });
    this.closeSettings();
  }

  render() {
    const { state, consoleLog, updateCB } = this.props;
    let firstCheckbox = true;
    let showBreak = true;

    const headers = Object.keys(headerDefinitions)
      .map(key => ({ ...headerDefinitions[key], key }))
      // Display the fields in descending order of type. If two fields are the same type, then sort by ascending order of display text.
      .sort(
        (self, other) =>
          -self.type.localeCompare(other.type) || self.display.localeCompare(other.display)
      );

    return (
      <Box flexGrow={1}>
        <h4 className="setting-header">Settings</h4>
        <Grid container spacing={2} sx={{ padding: '20px' }}>
          {headers.map(({ key, type, display }) => {
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
                          updateCB(key, event.target.value);
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
                              updateCB(key, event.target.checked);
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
          {resetHeaderDefinitions.map(({ key, display, reset }) => {
            return (
              <Grid item key={key} xs={3}>
                <Button variant="outlined" onClick={reset(state, consoleLog)}>
                  {display}
                </Button>
              </Grid>
            );
          })}
          {/* spacer */}
          <hr
            style={{
              width: '100%'
            }}
          />
          <Grid item xs={8} />

          <Grid item xs={2}>
            <Button variant="outlined" onClick={this.cancelSettings}>
              Cancel
            </Button>
          </Grid>
          <Grid item xs={2}>
            <Button variant="contained" onClick={this.saveSettings}>
              Save
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  }
}
