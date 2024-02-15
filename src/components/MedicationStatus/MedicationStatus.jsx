import axios from 'axios';
import { MedicationStatusButton } from './MedicationStatusButton.jsx';
import { MedicationStatusModal } from './MedicationStatusModal.jsx';
import { useState, useEffect } from 'react';
import { Card } from '@mui/material';

export const MedicationStatus = props => {
  const { ehrUrl, request } = props;
  const [medicationDispense, setMedicationDispense] = useState(null);
  const [showMedicationStatus, setShowMedicationStatus] = useState(false);
  const [lastCheckedMedicationTime, setLastCheckedMedicationTime] = useState(null);

  useEffect(() => getMedicationStatus(), [request.id]);

  const getMedicationStatus = () => {
    setLastCheckedMedicationTime(Date.now());

    axios.get(`${ehrUrl}/MedicationDispense?prescription=${request.id}`).then(
      response => {
        const bundle = response.data;
        setMedicationDispense(bundle.entry?.[0].resource);
      },
      error => {
        console.log('Was not able to get medication status', error);
      }
    );
  };

  const handleCloseMedicationStatus = () => {
    setShowMedicationStatus(false);
  };

  const handleOpenMedicationStatus = () => {
    setShowMedicationStatus(true);
  };

  return (
    <Card variant="outlined" sx={{ padding: 2 }}>
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
