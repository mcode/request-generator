import React from 'react';
import { Snackbar } from '@mui/material';
import { Alert as MuiAlert } from '@mui/material';
import PropTypes from 'prop-types';

function Alert(props) {
  const { message, handleClose } = props;

  return (
    <Snackbar
      open={message !== null}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <MuiAlert onClose={handleClose} severity="error">
        {message}
      </MuiAlert>
    </Snackbar>
  );
}

Alert.propTypes = {
  message: PropTypes.string,
  handleClose: PropTypes.func.isRequired
};

export default Alert;
