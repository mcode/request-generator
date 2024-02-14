import { Box, Grid, IconButton, Modal, Tooltip } from '@mui/material';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import { useState, useEffect } from 'react';
import { getStatusColor } from './MedicationStatus';
import { getStatusText } from './MedicationStatus';

export const MedicationStatusModal = props => {
  const { callback, onClose, medicationDispense, update } = props;
  const [spin, setSpin] = useState(false);
  const color = getStatusColor(medicationDispense?.status);
  const status = getStatusText(medicationDispense?.status);

  useEffect(() => {
    if (update) {
      setSpin(true);
      callback();
    }
  }, [update]);

  return (
    <Modal open={update} onClose={onClose}>
      <Box sx={modalStyle}>
        <div>
          <h1>Medication Status</h1>
          <div className="status-icon" style={{ backgroundColor: color }}></div>
          <Grid container columns={12}>
            <Grid item xs={10}>
              <div className="bundle-entry">ID: {medicationDispense?.id || 'N/A'}</div>
              <div className="bundle-entry">Status: {status}</div>
            </Grid>
            <Grid item xs={2}>
              <div className="bundle-entry">
                <Tooltip title="Refresh">
                  <IconButton onClick={callback} data-testid="refresh">
                    <AutorenewIcon
                      className={spin === true ? 'refresh' : 'renew-icon'}
                      onAnimationEnd={() => setSpin(false)}
                    />
                  </IconButton>
                </Tooltip>
              </div>
            </Grid>
          </Grid>
        </div>
      </Box>
    </Modal>
  );
};

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '1px solid #000',
  boxShadow: 24,
  p: 4
};
