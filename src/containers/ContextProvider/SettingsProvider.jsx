import React from 'react';
import { reducer, initialState } from './reducer';
import { actionTypes } from '../../containers/ContextProvider/reducer';

export const SettingsContext = React.createContext({
  state: initialState,
  dispatch: () => null,
  updateSetting: () => null,
  readSettings: () => null,
  saveSettings: () => null
});

export const SettingsProvider = ({ children }) => {
  const [state, dispatch] = React.useReducer(reducer, initialState);

  const updateSetting = (key, value) => {
    dispatch({
      type: actionTypes.updateSetting,
      settingId: key,
      value: value
    });
  };

  const readSettings = () => {
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
  };

  const saveSettings = () => {
    const headers = Object.keys(state).map(key => [key, state[key]]);
    localStorage.setItem('reqgenSettings', JSON.stringify(headers));
  };

  return (
    <SettingsContext.Provider value={[state, dispatch, updateSetting, readSettings, saveSettings]}>
      {children}
    </SettingsContext.Provider>
  );
};
