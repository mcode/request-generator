import { memo, useState } from 'react';
import FHIR from 'fhirclient';
import env from 'env-var';
import { Button, Checkbox, FormControl, FormControlLabel, TextField } from '@mui/material';
import Stack from '@mui/material/Stack';
import Autocomplete from '@mui/material/Autocomplete';
import useStyles from './styles';

const Gateway = props => {
  const classes = useStyles();
  const envFhir = env.get('VITE_EHR_SERVER').asString();
  const envClient = env.get('VITE_CLIENT').asString();
  console.log(env.get('VITE_EHR_SERVER').asString());
  const envScope = env.get('VITE_CLIENT_SCOPES').asString().split(' ');
  const [clientId, setClientId] = useState(envClient || '');
  const [fhirUrl, setFhirUrl] = useState(envFhir || '');
  const [backOffice, setBackOffice] = useState(false);

  const [scope, _setScope] = useState(envScope || []);
  const setScope = value => {
    // split by space to facilitate copy/pasting strings of scopes into the input
    const sv = value.map(e => {
      if (e) {
        return e.split(' ');
      }
    });
    _setScope(sv.flat());
  };
  const submit = event => {
    event.preventDefault();
    FHIR.oauth2.authorize({
      clientId: clientId,
      scope: scope.join(' '),
      redirectUri: props.redirect + (backOffice ? '/backoffice' : ''),
      iss: fhirUrl
    });
  };
  return (
    <div className={classes.gatewayDiv}>
      <h2 className={classes.gatewayHeader}>Launch Request Generator</h2>
      <form onSubmit={submit} autoComplete="off">
        <FormControl fullWidth={true} required={true} margin="normal">
          <Stack spacing={4} sx={{ width: '500px' }}>
            <Autocomplete
              freeSolo
              filterSelectedOptions
              id="iss-dropdown"
              inputValue={fhirUrl}
              onInputChange={(e, inputValue) => {
                setFhirUrl(inputValue);
              }}
              options={[envFhir]} // TODO: can be updated later to include registered iss
              renderInput={params => (
                <TextField
                  {...params}
                  size="medium"
                  label="FHIR Server Endpoint"
                  InputProps={{
                    ...params.InputProps,
                    type: 'search'
                  }}
                />
              )}
            />
            <Autocomplete
              freeSolo
              filterSelectedOptions
              id="client-dropdown"
              inputValue={clientId}
              onInputChange={(e, inputValue) => {
                setClientId(inputValue);
              }}
              options={[envClient]} // TODO: can be updated later to match from iss from register page
              renderInput={params => (
                <TextField
                  {...params}
                  size="medium"
                  label="Client ID"
                  InputProps={{
                    ...params.InputProps,
                    type: 'search'
                  }}
                />
              )}
            />
            <Autocomplete
              multiple
              freeSolo
              limitTags={3}
              disableClearable
              filterSelectedOptions
              id="tags-outlined"
              options={envScope} // can be updated to include other scopes
              value={scope}
              onChange={(e, scopes) => {
                // scopes is the new full list, not the singular new value
                setScope(scopes);
              }}
              defaultValue={['launch']}
              renderInput={params => (
                <TextField {...params} label="Scope" placeholder="Enter Scope" />
              )}
            />
            <Stack direction="row">
              <FormControlLabel
                control={
                  <Checkbox
                    value={backOffice}
                    onChange={() => {
                      setBackOffice(!backOffice);
                    }}
                  />
                }
                label="Back Office"
              />
            </Stack>
            <Button type="submit" variant="outlined" disabled={clientId === '' || fhirUrl === ''}>
              Launch
            </Button>
          </Stack>
        </FormControl>
      </form>
    </div>
  );
};

export default memo(Gateway);
