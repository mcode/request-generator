import { EtasuStatusButton } from './EtasuStatusButton.jsx';
import { EtasuStatusModal } from './EtasuStatusModal.jsx';
import { useState, useEffect, useContext } from 'react';
import { Card } from '@mui/material';
import { SettingsContext } from '../../containers/ContextProvider/SettingsProvider.jsx';
import { standardsBasedGetEtasu } from '../../util/util.js';

export const EtasuStatusComponent = props => {
  const [globalState, _] = useContext(SettingsContext);

  const { remsAdminResponseInit, data } =
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
        const standarEtasuUrl = `${globalState.remsAdminServer}/4_0_0/GuidanceResponse/$rems-etasu`;
        standardsBasedGetEtasu(standarEtasuUrl, data, setRemsAdminResponse);
        setLastCheckedEtasuTime(Date.now());
    }
  }
  return (
    <Card variant="outlined" sx={{ padding: 2 }}>
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
    case 'success':
        return 'green';
    case 'data-required':
        return '#f0ad4e';
    default:
      return '#0c0c0c';
  }
};
