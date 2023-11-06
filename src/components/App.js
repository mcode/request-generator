import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RequestBuilder from '../containers/RequestBuilder';
import PatientPortal from '../containers/PatientPortal';
import theme from '../containers/styles/theme';
import { ThemeProvider } from '@mui/styles';
import Launch from '../containers/Launch';
import Index from '../containers/Index';
const Router = (process.env.REACT_APP_GH_PAGES === 'true') ? HashRouter : BrowserRouter;
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" exact element={<RequestBuilder />} />
        <Route exact path="/launch" element={<Launch />} />
        <Route exact path="/index" element={<Index />} />
        <Route
          exact
          path="/patient-portal"
          element={
            <ThemeProvider theme={theme}>
              <PatientPortal />
            </ThemeProvider>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
