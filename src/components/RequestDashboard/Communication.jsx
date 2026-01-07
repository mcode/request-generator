import { Button, Grid } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import useStyles from './styles';

const Communication = props => {
  const classes = useStyles();
  const { communication, deleteCommunication } = props;

  const convertTimeStamp = timeStamp => {
    const date = new Date(timeStamp);
    return date.toLocaleString();
  };

  return (
    <div>
      <Grid container>
        <Grid className={classes.communicationHeader} item xs={2}>
          {`ID: ${communication.id}`}
        </Grid>
        <Grid className={classes.communicationHeader} item xs={8.7}>
          {`Received: ${convertTimeStamp(communication.received)}`}
        </Grid>
        <Grid className={classes.communicationHeaderButton} item xs={1.3}>
          <Button
            fullWidth
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => {
              deleteCommunication(communication.id);
            }}
          >
            Clear
          </Button>
        </Grid>
        <Grid className={classes.communicationDescription} item xs={12}>
          {communication.payload[0].contentString}
        </Grid>
      </Grid>
    </div>
  );
};

export default Communication;
