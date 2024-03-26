import { EtasuStatusButton } from './EtasuStatusButton.jsx';
import { EtasuStatusModal } from './EtasuStatusModal.jsx';
import { useState, useEffect } from 'react';
import { Card, Typography } from '@mui/material';

export const EtasuStatus = props => {
  const { etasuUrl, request, remsAdminResponse, getEtasuStatus, lastCheckedEtasuTime } =
    props;
  const [showEtasuStatus, setShowEtasuStatus] = useState(false);

  useEffect(() => getEtasuStatus(), [request.id, etasuUrl]);

  const handleCloseEtasuStatus = () => {
    setShowEtasuStatus(false);
  };

  const handleOpenEtasuStatus = () => {
    setShowEtasuStatus(true);
  };

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
        callback={getEtasuStatus}
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
