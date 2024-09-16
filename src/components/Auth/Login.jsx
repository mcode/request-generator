import React, { memo, useCallback, useState, useEffect } from 'react';
import { TextField, Button } from '@mui/material';
import Alert from './Alert';
import axios from 'axios';
import useStyles from './styles';
import env from 'env-var';

const Login = props => {
  const classes = useStyles();
  const [message, setMessage] = useState(null);
  const [username, _setUsername] = useState('');
  const [password, _setPassword] = useState('');
  const handleClose = () => setMessage(null);
  document.title = 'EHR | Patient Portal';

  const onSubmit = useCallback(() => {
    if (username && password) {
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);
      params.append('grant_type', 'password');
      params.append('client_id', env.get('VITE_CLIENT').asString());
      axios
        .post(
          `${env.get('VITE_AUTH').asString()}/auth/realms/${env
            .get('VITE_REALM')
            .asString()}/protocol/openid-connect/token`,
          params,
          { withCredentials: true }
        )
        .then(result => {
          props.tokenCallback(result.data.access_token);
        })
        .catch(err => {
          setMessage('Unable to Login');
          console.error(err);
        });
    }
  }, [username, password, props]);

  useEffect(() => {
    const listener = event => {
      if (event.code === 'Enter' || event.code === 'NumpadEnter') {
        event.preventDefault();
        onSubmit();
      }
    };
    document.addEventListener('keydown', listener);
    return () => {
      document.removeEventListener('keydown', listener);
    };
  }, [username, password, onSubmit]);

  const setUsername = event => {
    _setUsername(event.target.value);
  };

  const setPassword = event => {
    _setPassword(event.target.value);
  };

  return (
    <div className={classes.background}>
      <Alert message={message} handleClose={handleClose} />

      <div className={`${classes.loginContent} ${classes.formFont}`}>
        <div className={classes.loginHeader}>Log in.</div>
        <div className={classes.loginSubheader}>Log in to view your patient records.</div>
        <form noValidate autoComplete="off" className={classes.formFont}>
          <TextField
            classes={{
              root: classes.resize
            }}
            variant="standard"
            value={username}
            onChange={setUsername}
            label="Username"
          />
          <TextField
            classes={{
              root: classes.resize
            }}
            variant="standard"
            type="password"
            label="Password"
            value={password}
            onChange={setPassword}
          />
          <Button
            variant="contained"
            classes={{ root: classes.loginButton, label: classes.formFont }}
            onClick={onSubmit}
          >
            Log In
          </Button>
          <div className={classes.passwordForget}>Forgot password?</div>
        </form>
      </div>
    </div>
  );
};

export default memo(Login);
