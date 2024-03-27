import { EtasuStatusButton } from './EtasuStatusButton.jsx';
import { EtasuStatusModal } from './EtasuStatusModal.jsx';
import { useState, useEffect, useContext } from 'react';
import { Card, Typography } from '@mui/material';
import { SettingsContext } from '../../containers/ContextProvider/SettingsProvider.jsx';
import axios from 'axios';
import { EtasuStatusComponent } from './EtasuStatusComponent.jsx';
import { getEtasu } from '../../util/util.js';

// converts code into etasu for the component to render
// simplifies usage for applications that only know the code, not the case they want to display
export const EtasuStatus = props => {
  const [globalState, _] = useContext(SettingsContext);

  const { code } =
    props;
  const [remsAdminResponse, setRemsAdminResponse] = useState({});
  useEffect(() => getEtasuStatus(), [code]);
  const getEtasuStatus = () => {
    const patientFirstName = globalState.patient?.name?.at(0)?.given?.at(0);
    const patientLastName = globalState.patient?.name?.at(0)?.family;
    const patientDOB = globalState.patient?.birthDate;

    console.log(
      'get Etastu Status: ' +
        patientFirstName +
        ' ' +
        patientLastName +
        ' - ' +
        patientDOB +
        ' - ' +
        code
    );
    const etasuUrl = `${globalState.remsAdminServer}/etasu/met/patient/${patientFirstName}/${patientLastName}/${patientDOB}/drugCode/${code}`;
    getEtasu(etasuUrl, setRemsAdminResponse);
  };

  return (
    <>
      {remsAdminResponse.case_number ? <EtasuStatusComponent remsAdminResponseInit={remsAdminResponse} /> : ""}
    </>
  );
};

