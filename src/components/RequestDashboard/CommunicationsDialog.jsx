import { useEffect, useState } from 'react';

import { Button, Grid } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Badge from '@mui/material/Badge';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import { Refresh } from '@mui/icons-material';

import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Communication from './Communication';

const CommunicationsDialog = props => {
  const { client, token } = props;
  const [state, setState] = useState({
    client: client,
    token: token,
    initialLoad: true,
    communicationCount: 0,
    communications: [],
    open: false
  });

  const debugLog = message => {
    console.log('CommunicationsDialog: ' + message);
  };

  useEffect(() => {
    // reload on page load and dialog open
    if (state.initialLoad) {
      setState(prevState => ({ ...prevState, initialLoad: false }));
      getCommunications();
    }

    const interval = setInterval(() => {
      // page load...
      getCommunications();
    }, 1000 * 5); // reload every 5 seconds

    return () => clearInterval(interval);
  });

  const getCommunications = () => {
    if (state.client) {
      // try to read communications from FHIR server
      state.client
        .request(`Communication?recipient=${props.token?.userId}`, {
          graph: false,
          flat: true
        })
        .then(bundle => {
          loadCommunications(bundle);
        });
    }
  };

  const deleteCommunication = id => {
    debugLog('deleteCommunication: ' + id);
    if (id) {
      state.client.delete(`Communication/${id}`).then(() => {
        debugLog(`Deleted communication: ${id}`);
        getCommunications();
      });
    }
  };

  const loadCommunications = bundle => {
    let count = bundle.length;
    setState(prevState => ({ ...prevState, communicationCount: count, communications: bundle }));
  };

  const handleClose = () => {
    setState(prevState => ({ ...prevState, open: false }));
  };

  const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#EDF6FF',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'left',
    color: theme.palette.text.secondary
  }));

  const renderCommunications = () => {
    return (
      <Grid container spacing={2} sx={{ mt: 2 }}>
        {state.communications.map(communication => {
          return (
            <Grid item xs={12} sm={12}>
              <Item>
                <Communication
                  communication={communication}
                  deleteCommunication={deleteCommunication}
                />
              </Item>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  return (
    <span>
      <span
        onClick={() => {
          setState(prevState => ({ ...prevState, open: true, initialLoad: true }));
        }}
      >
        <Badge badgeContent={state.communicationCount} color="primary">
          <NotificationsIcon sx={{ fontSize: 26, verticalAlign: 'middle' }} />
        </Badge>
      </span>
      <Dialog fullWidth maxWidth="md" onClose={handleClose} open={state.open}>
        <DialogTitle>
          <Grid container>
            <Grid item xs={10}>
              <NotificationsIcon sx={{ fontSize: 26, verticalAlign: 'middle' }} />
              Communications ({state.communicationCount})
            </Grid>
            <Grid item xs={2}>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={() => {
                  getCommunications();
                }}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </DialogTitle>

        <DialogContent>{renderCommunications()}</DialogContent>
      </Dialog>
    </span>
  );
};

export default CommunicationsDialog;
