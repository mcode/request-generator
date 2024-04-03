import { Box, Grid, IconButton, Modal, Tooltip, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import { useState, useEffect } from 'react';
import { getStatusColor } from './EtasuStatusComponent';
import './EtasuStatusModal.css';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Close from '@mui/icons-material/Close';

const getIdText = remsAdminResponse => remsAdminResponse?.case_number || 'N/A';

export const EtasuStatusModal = props => {
  const { callback, onClose, remsAdminResponse, update } = props;
  const [spin, setSpin] = useState(false);
  const color = getStatusColor(remsAdminResponse?.status);

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
            <h1>REMS Status</h1>
            <div className="status-icon" style={{ backgroundColor: color }}></div>
            <Grid container columns={12}>
                <Grid item xs={10}>
                    <div className="bundle-entry">
                        Case Number: {getIdText(remsAdminResponse)}
                    </div>
                    <div className="bundle-entry">Status: {remsAdminResponse.status || 'N/A'}</div>
                </Grid>
                <Grid item xs={2}>
                    <div className="bundle-entry">
                        <Tooltip title="Refresh">
                        <IconButton onClick={callback} data-testid="refresh">
                            <AutorenewIcon
                            data-testid="icon"
                            className={spin === true ? 'refresh' : 'renew-icon'}
                            onAnimationEnd={() => setSpin(false)}
                            />
                        </IconButton>
                        </Tooltip>
                    </div>
                </Grid>
            </Grid>
            <div>
                <br></br>
                <h3>ETASU</h3>
                <Box sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
                    {remsAdminResponse ? (
                        <List>
                        {remsAdminResponse?.metRequirements?.map((metRequirements) => (
                            <ListItem
                                disablePadding
                                key={metRequirements.metRequirementId}
                                data-testid="etasu-item"
                            >
                            <ListItemIcon>
                                {metRequirements.completed ? (
                                <CheckCircle color="success" />
                                ) : (
                                <Close color="warning" />
                                )}
                            </ListItemIcon>
                            {metRequirements.completed ? (
                                <ListItemText primary={metRequirements.requirementName} />
                            ) : (
                                <ListItemText
                                primary={metRequirements.requirementName}
                                secondary={metRequirements.requirementDescription}
                                />
                            )}
                            </ListItem>
                        ))}
                        </List>
                    ) : (
                        'Not Available'
                    )}
                </Box>
            </div>
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
