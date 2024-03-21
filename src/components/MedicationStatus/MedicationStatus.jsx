import { MedicationStatusButton } from './MedicationStatusButton.jsx';
import { MedicationStatusModal } from './MedicationStatusModal.jsx';
import { useState, useEffect } from 'react';
import { Card, Typography } from '@mui/material';

export const MedicationStatus = props => {
  const { ehrUrl, request, medicationDispense, getMedicationStatus, lastCheckedMedicationTime } =
    props;
  const [showMedicationStatus, setShowMedicationStatus] = useState(false);

  useEffect(() => getMedicationStatus(), [request.id, ehrUrl]);

  const handleCloseMedicationStatus = () => {
    setShowMedicationStatus(false);
  };

  const handleOpenMedicationStatus = () => {
    setShowMedicationStatus(true);
  };

  return (
    <Card variant="outlined" sx={{ padding: 2 }}>
      <Typography variant="h6" align="center" mb={2}>
        {request?.medicationCodeableConcept?.coding?.[0].display}
      </Typography>
      <MedicationStatusButton
        baseColor={getStatusColor(medicationDispense?.status)}
        medicationDispense={medicationDispense}
        handleOpenMedicationStatus={handleOpenMedicationStatus}
        lastCheckedMedicationTime={lastCheckedMedicationTime}
      />
      <MedicationStatusModal
        callback={getMedicationStatus}
        medicationDispense={medicationDispense}
        update={showMedicationStatus}
        onClose={handleCloseMedicationStatus}
      />
    </Card>
  );
};

export const getStatusColor = status => {
  switch (status) {
    case 'completed':
      return 'green';
    case 'preparation':
    case 'in-progress':
    case 'cancelled':
    case 'on-hold':
    case 'entered-in-error':
    case 'stopped':
    case 'declined':
    case 'unknown':
    default:
      return '#0c0c0c';
  }
};

export const getStatusText = status => {
  switch (status) {
    case 'completed':
      return 'Picked Up';
    case 'unknown':
      return 'Not Started';
    case 'preparation':
    case 'in-progress':
    case 'cancelled':
    case 'on-hold':
    case 'entered-in-error':
    case 'stopped':
    case 'declined':
    default:
      return 'N/A';
  }
};
