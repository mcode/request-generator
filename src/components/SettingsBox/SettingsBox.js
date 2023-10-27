import React, { Component } from 'react';
import './SettingsBox.css';
import InputBox from '../Inputs/InputBox';
import CheckBox from '../Inputs/CheckBox';
import { headerDefinitions, types } from '../../util/data';
import FHIR from 'fhirclient';

const clearQuestionnaireResponses =
  ({ ehrUrl, defaultUser, access_token }, consoleLog) =>
  _event => {
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
  _event => {
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
    display: 'Clear EHR QuestionnaireResponses',
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

export default class SettingsBox extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {}

  render() {
    const { state, consoleLog, updateCB } = this.props;

    const headers = Object.keys(headerDefinitions)
      .map(key => ({ ...headerDefinitions[key], key }))
      // Display the fields in descending order of type. If two fields are the same type, then sort by ascending order of display text.
      .sort(
        (self, other) =>
          -self.type.localeCompare(other.type) || self.display.localeCompare(other.display)
      );

    return (
      <div>
        {headers.map(({ key, type, display }) => {
          switch (type) {
            case 'input':
              return (
                <div key={key}>
                  <p className="setting-header">{display}</p>
                  <InputBox
                    extraClass="setting-input"
                    value={state[key]}
                    updateCB={updateCB}
                    elementName={key}
                  />
                </div>
              );
            case 'check':
              return (
                <div key={key}>
                  <p className="setting-header">
                    {display}
                    <CheckBox
                      extraClass="setting-checkbox"
                      extraInnerClass="setting-inner-checkbox"
                      toggle={state[key]}
                      updateCB={updateCB}
                      elementName={key}
                    />
                  </p>
                  <p>&nbsp;</p>
                </div>
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
            <div key={key}>
              <button className={'setting-btn btn btn-class'} onClick={reset(state, consoleLog)}>
                {display}
              </button>
            </div>
          );
        })}
      </div>
    );
  }
}
