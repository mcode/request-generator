import React, { memo, useState, useEffect } from 'react';
import FHIR from 'fhirclient';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import env from 'env-var';
import { SettingsContext } from '../ContextProvider/SettingsProvider';
import Dashboard from './Dashboard';

const BackOffice = (props) => {
  const { client } = props;
  const [, dispatch] = React.useContext(SettingsContext);

  useEffect(() => {
      document.title = 'EHR | Back Office';
  }, []);

  const logout = () => {
    setClient(null);
    setPatientName(null);
  };

  const getName = patient => {
    const name = [];
    if (patient.name) {
      if (patient.name[0].given) {
        name.push(patient.name[0].given[0]);
      }
      if (patient.name[0].family) {
        name.push(patient.name[0].family);
      }
    }
    return name.join(' ');
  };
  return (
    <div>
        <Dashboard client = {client}/>
    </div>
  );
};

export default memo(BackOffice);
