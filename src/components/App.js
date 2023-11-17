import React from 'react';
import { BrowserRouter , HashRouter , Routes, Route } from 'react-router-dom';
import RequestBuilder from '../containers/RequestBuilder';
import PatientPortal from '../containers/PatientPortal';
import theme from '../containers/styles/theme';
import { ThemeProvider } from '@mui/styles';
import Launch from '../containers/Launch';
import Index from '../containers/Index';

const isGhPages = process.env.REACT_APP_GH_PAGES === 'true';
const Router = isGhPages ? HashRouter : BrowserRouter;
const redirect = isGhPages ? '/#/index' : '/index';
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path='/launch' element={<Launch redirect={redirect} />} />
        <Route path='/index' element={<Index />} />
        <Route
          path='/patient-portal'
          element={
            <ThemeProvider theme={theme}>
              <PatientPortal />
            </ThemeProvider>
          }
        />
        <Route path="/" exact element={<RequestBuilder redirect = {redirect} />} />

      </Routes>
    </Router>
  );
};

export default App;
