import React from 'react';
import { reducer, initialState } from './reducer';

export const SettingsContext = React.createContext({
    state: initialState,
    dispatch: () => null
});

export const SettingsProvider = ({ children }) => {
    const [state, dispatch] = React.useReducer(reducer, initialState);

    return (
        <SettingsContext.Provider value={[state, dispatch]}>
            {children}
        </SettingsContext.Provider>
    );
};