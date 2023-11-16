import React, { Component } from 'react';
import { BrowserRouter , HashRouter , Routes, Route } from 'react-router-dom';
import RequestBuilder from '../containers/RequestBuilder';
import PatientPortal from '../containers/PatientPortal';
import theme from '../containers/styles/theme';
import { ThemeProvider } from '@mui/styles';

const Router = (process.env.REACT_APP_GH_PAGES === 'true') ? HashRouter : BrowserRouter;

export default class App extends Component {
  render() {
    return (
      <Router >
        <Routes>
          <Route path="/" exact element={<RequestBuilder />} />

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
  }
}
