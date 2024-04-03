import { Button, Grid, Typography } from '@mui/material';
import ListIcon from '@mui/icons-material/List';
import './EtasuStatusButton.css';

export const EtasuStatusButton = props => {
  const { baseColor, remsAdminResponse, handleOpenEtasuStatus, lastCheckedEtasuTime } =
    props;
  return (
    <Grid item container flexDirection="column" alignItems="center">
      <Button sx={buttonSx(baseColor)} variant="contained" onClick={handleOpenEtasuStatus}>
        <ListIcon fontSize="large" />
        <Typography className="etasuButtonText" component="p">
          ETASU:
        </Typography>
        <Typography component="p">{convertStatus(remsAdminResponse?.status)}</Typography>
      </Button>
      {renderTimestamp(lastCheckedEtasuTime)}
    </Grid>
  );
};

const buttonSx = baseColor => ({
  backgroundColor: baseColor,
  ':hover': { filter: 'brightness(110%)', backgroundColor: baseColor },
  flexDirection: 'column'
});

const renderTimestamp = checkedTime => {
  return checkedTime ? (
    <>
      <Typography component="p" className="etasuButtonTimestamp">
        {convertTimeDifference(checkedTime)}
      </Typography>
      <Typography component="p" className="etasuButtonTimestamp timestampString">
        {new Date(checkedTime).toLocaleString()}
      </Typography>
    </>
  ) : (
    <Typography>No medication selected</Typography>
  );
};

const convertTimeDifference = start => {
  const end = Date.now();
  const difference = end - start;
  const diffMin = difference / 60000;
  let prefix = 'a long time';
  if (diffMin < 1) {
    prefix = 'a few seconds';
  } else if (diffMin > 1 && diffMin < 2) {
    prefix = 'a minute';
  } else if (diffMin > 2 && diffMin < 60) {
    prefix = `${Math.round(diffMin)} minutes`;
  } else if (diffMin > 60 && diffMin < 120) {
    prefix = 'an hour';
  } else if (diffMin > 120 && diffMin < 1440) {
    prefix = `${Math.round(diffMin / 60)} hours`;
  } else if (diffMin > 1440 && diffMin < 2880) {
    prefix = 'a day';
  } else if (diffMin > 2880) {
    prefix = `${Math.round(diffMin / 1440)} days`;
  }
  return `Last checked ${prefix} ago`;
};

const convertStatus = status => {
  if (status === 'success') {
    return 'Approved';
  } else if (status === 'data-required') {
    return 'Pending';
  } else {
    return 'Not Started';
  }
}
