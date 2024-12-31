import { ThemeProvider } from '@mui/material';

import React, { useEffect } from 'react';
import { BrowserRouter, HashRouter, Route, Routes } from 'react-router-dom';
import Gateway from '../containers/Gateway/Gateway';
import Index from '../containers/Index';
import Launch from '../containers/Launch';
import PatientPortal from '../containers/PatientPortal';
import RegisterPage from '../containers/register/RegisterPage';
import theme from '../containers/styles/theme';
import { SettingsContext } from '../containers/ContextProvider/SettingsProvider';
import { actionTypes } from '../containers/ContextProvider/reducer';

const isGhPages = process.env.VITE_GH_PAGES.trim() === 'true';
const Router = isGhPages ? HashRouter : BrowserRouter;
const redirect = isGhPages ? '/request-generator/#/index' : '/index';
console.log('redirect: ' + redirect);
const App = () => {
  const [, dispatch] = React.useContext(SettingsContext);
  useEffect(() => {
    dispatch({
      type: actionTypes.updateSetting,
      settingId: 'redirect',
      value: redirect
    });
  }, []);
  return (
    <Router>
      <Routes>
        <Route path="/launch" element={<Launch redirect={redirect} />} />
        <Route path="/index" element={<ThemeProvider theme={theme}><Index/></ThemeProvider>} />
        <Route path="/register" element={<RegisterPage />} />
        {/* forcibly enter backoffice workflow */}
        <Route path="/index/backoffice" element={<ThemeProvider theme={theme}><Index backoffice={true}/></ThemeProvider> } />
        <Route
          path="/patient-portal"
          element={
            <ThemeProvider theme={theme}>
              <PatientPortal />
            </ThemeProvider>
          }
        />
        <Route path="/" exact element={<Gateway redirect={redirect} />} />
      </Routes>
    </Router>
  );
};

export default App;
