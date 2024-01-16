import { ThemeProvider } from '@mui/styles';
import React from 'react';
import { BrowserRouter, HashRouter, Route, Routes } from 'react-router-dom';
import Gateway from '../containers/Gateway/Gateway';
import Index from '../containers/Index';
import Launch from '../containers/Launch';
import PatientPortal from '../containers/PatientPortal';
import RegisterPage from '../containers/register/RegisterPage';
import theme from '../containers/styles/theme';
const isGhPages = process.env.REACT_APP_GH_PAGES === 'true';
const Router = isGhPages ? HashRouter : BrowserRouter;
const redirect = isGhPages ? '/request-generator/#/index' : '/index';
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/launch" element={<Launch redirect={redirect} />} />
        <Route path="/index" element={<Index />} />
        <Route path="/register" element={<RegisterPage />} />
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
