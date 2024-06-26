import { Box, Button, Typography, ButtonGroup } from '@mui/material';
import './InProgressFormBoxStyle.css';

const InProgressFormBox = props => {
  return props.qrResponse?.questionnaire ? (
    <Box className={'in-progress-container'}>
      <Typography variant="h6" color="text.primary" gutterBottom>
        In Progress Form
      </Typography>
      <Typography variant="subtitle1">
        <Typography color="text.secondary"> Practitioner: </Typography>
        {props.qrResponse.author ? props.qrResponse.author.reference : 'empty'}
      </Typography>
      <Typography variant="subtitle1">
        <Typography color="text.secondary"> Last Edited: </Typography>{' '}
        {props.qrResponse.authored ? props.qrResponse.authored : 'empty'}
      </Typography>
      <Typography sx={{ mb: 4 }} variant="subtitle1">
        <Typography color="text.secondary"> Form Link: </Typography>
        {props.qrResponse.questionnaire ? props.qrResponse.questionnaire : 'empty'}
      </Typography>
      <ButtonGroup variant="outlined" aria-label="button group">
        <Button
          onClick={props.relaunch}
          color="primary"
          varient="outlined"
          style={{ width: '300px' }}
        >
          Open In-Progress Form
        </Button>
      </ButtonGroup>
    </Box>
  ) : (
    ''
  );
};

export default InProgressFormBox;
