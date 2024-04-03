import { EtasuStatusButton } from './EtasuStatusButton.jsx';
import { EtasuStatusModal } from './EtasuStatusModal.jsx';
import { useState, useEffect, useContext } from 'react';
import { Card, Typography } from '@mui/material';
import { SettingsContext } from '../../containers/ContextProvider/SettingsProvider.jsx';
import axios from 'axios';
import { getEtasu } from '../../util/util.js';

export const EtasuStatusComponent = props => {
  const [globalState, _] = useContext(SettingsContext);

  const { remsAdminResponseInit } =
    props;

  const [remsAdminResponse, setRemsAdminResponse] = useState(remsAdminResponseInit);
  const [lastCheckedEtasuTime, setLastCheckedEtasuTime] = useState(0);

  const [showEtasuStatus, setShowEtasuStatus] = useState(false);

  useEffect(() => {
    setLastCheckedEtasuTime(Date.now());
  }, []); 
  const handleCloseEtasuStatus = () => {
    setShowEtasuStatus(false);
  };

  const handleOpenEtasuStatus = () => {
    setShowEtasuStatus(true);
  };

  const refreshEtasu = () => {
    if(remsAdminResponse) {
        const etasuUrl = `${globalState.remsAdminServer}/etasu/met/patient/${remsAdminResponse.patientFirstName}/${remsAdminResponse.patientLastName}/${remsAdminResponse.patientDOB}/drugCode/${remsAdminResponse.drugCode}`;
        getEtasu(etasuUrl, setRemsAdminResponse);
        setLastCheckedEtasuTime(Date.now());
    }
  }
  return (
    <Card variant="outlined" sx={{ padding: 2 }}>
      <Typography variant="h6" align="center" mb={2}>
        {remsAdminResponse?.drugName}
      </Typography>
      <EtasuStatusButton
        baseColor={getStatusColor(remsAdminResponse?.status)}
        remsAdminResponse={remsAdminResponse}
        handleOpenEtasuStatus={handleOpenEtasuStatus}
        lastCheckedEtasuTime={lastCheckedEtasuTime}
      />
      <EtasuStatusModal
        callback={refreshEtasu}
        remsAdminResponse={remsAdminResponse}
        update={showEtasuStatus}
        onClose={handleCloseEtasuStatus}
      />
    </Card>
  );
};

export const getStatusColor = status => {
  switch (status) {
    case 'Approved':
        return 'green';
    case 'Pending':
        return '#f0ad4e';
    default:
      return '#0c0c0c';
  }
};
