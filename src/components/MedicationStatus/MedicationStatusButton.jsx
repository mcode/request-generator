import { Button, Grid, Typography } from '@mui/material';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import { getStatusText } from './MedicationStatus';

export const MedicationStatusButton = props => {
  const {
    baseColor,
    disabled,
    medicationDispense,
    handleOpenMedicationStatus,
    lastCheckedMedicationTime
  } = props;
  return (
    <Grid item sm={4} md={4} lg={4}>
      <Button
        sx={pharmSx(baseColor)}
        variant="contained"
        onClick={handleOpenMedicationStatus}
        disabled={disabled}
      >
        <div>
          <LocalPharmacyIcon fontSize="large" />
          <Typography sx={{ mb: 0, fontWeight: 'bold' }} component="p">
            Medication:{' '}
          </Typography>
          <p>{getStatusText(medicationDispense?.status)}</p>
        </div>
      </Button>
      {renderTimestamp(lastCheckedMedicationTime)}
    </Grid>
  );
};

const pharmSx = baseColor => ({
  backgroundColor: baseColor,
  ':hover': { filter: 'brightness(110%)', backgroundColor: baseColor }
});

const renderTimestamp = checkedTime => {
  return checkedTime ? (
    <div>
      <Typography component="p">{convertTimeDifference(checkedTime)}</Typography>
      <Typography component="p" color={'GrayText'}>
        {new Date(checkedTime).toLocaleString()}
      </Typography>
    </div>
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
