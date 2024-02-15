import React, { memo, useState, useEffect } from 'react';
import { Button, Box, FormControlLabel, Grid, Checkbox, TextField } from '@mui/material';

import useStyles from './styles';
import { headerDefinitions } from '../../util/data';
import { stateActions } from '../../containers/ContextProvider/reducer';
import { SettingsContext } from '../../containers/ContextProvider/SettingsProvider';

const SettingsSection = props => {
  const classes = useStyles();
  const [state, dispatch] = React.useContext(SettingsContext);
  const [headers, setHeaders] = useState([]);
  const [originalValues, setOriginalValues] = useState([]);

  useEffect(() => {
    const headers = Object.keys(headerDefinitions)
      .map(key => ({ ...headerDefinitions[key], key }))
      // Display the fields in descending order of type. If two fields are the same type, then sort by ascending order of display text.
      .sort(
        (self, other) =>
          -self.type.localeCompare(other.type) || self.display.localeCompare(other.display)
      );
    setHeaders(headers);
    const originals = Object.keys(headerDefinitions).map(key => [key, state[key]]);
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
  }, []);
  const updateSetting = (key, value) => {
    dispatch({
      type: stateActions.updateSetting,
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
    _event => {
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
    _event => {
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
    _event => {
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
  const resetHeaderDefinitions = [
    {
      display: 'Clear In-Progress Forms',
      key: 'clearQuestionnaireResponses',
      reset: clearQuestionnaireResponses
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

  let firstCheckbox = true;
  let showBreak = true;
  return (
    <div>
      <Box flexGrow={1}>
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
          {resetHeaderDefinitions.map(({ key, display, reset }) => {
            return (
              <Grid item key={key} xs={4}>
                <Button variant="outlined" onClick={reset(state)}>
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
            <Button variant="outlined" onClick={resetSettings}>
              Reset
            </Button>
          </Grid>
          <Grid item xs={2}>
            <Button variant="contained" onClick={saveSettings}>
              Save
            </Button>
          </Grid>
        </Grid>
      </Box>
    </div>
  );
};

export default memo(SettingsSection);
