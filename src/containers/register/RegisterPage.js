import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, Card, CardContent, FormControl, FormHelperText, IconButton, TextField, Typography } from '@mui/material';
import React, { useState } from 'react';
import './RegisterPageStyle.css';

export default function RegisterPage(props) {
  const [clientId, setClientId] = useState('');
  const [fhirUrl, setFhirUrl] = useState(props.fhirUrl || '');

  const [currentClients, setCurrentClients] = useState(
    JSON.parse(localStorage.getItem('clients') || '[]')
  );

  function deleteClient(client) {
    const newClients = currentClients.filter(
      (c) => !(c.name === client.name && c.client === client.client)
    );
    localStorage.setItem('clients', JSON.stringify(newClients));
    setCurrentClients(newClients);
  }

  function submit(event) {
    console.log('new selection add to LS');
    const newClients = [...currentClients, { name: fhirUrl, client: clientId }];
    setCurrentClients(newClients);
    localStorage.setItem('clients', JSON.stringify(newClients));
    if (props.callback) {
      event.preventDefault();
       props.callback(); // try launching again
    }
    return false;
  }

  return (
    <>
      <Box className={'registerContainer'}>
        <Card sx={{ minWidth: 275 }}>
          <CardContent>
            <h1>Client ID Registration</h1>
            <Typography variant='h5' component='div' color='text.secondary'>
              Request Generator
            </Typography>
            <br></br><br></br>
            <form onSubmit={submit} autoComplete='off'>
              <FormControl fullWidth={true} required={true} margin='normal'>
                <TextField
                  id='clientId'
                  label='Client ID'
                  aria-describedby='clientIdHelp'
                  value={clientId}
                  onChange={e => {
                    setClientId(e.target.value);
                  }}
                />
                <FormHelperText id='clientIdHelp'>
                  Clients must be registered with the FHIR server out of band.
                </FormHelperText>
              </FormControl>
              <FormControl fullWidth={true} required={true} margin='normal'>
                <TextField
                  id='fhirIss'
                  label='ISS'
                  aria-describedby='fhirIssHelp'
                  value={fhirUrl}
                  onChange={e => {
                    setFhirUrl(e.target.value);
                  }}
                />
                <FormHelperText id='fhirIssHelp'>
                  The ISS is the base url of the FHIR server.
                </FormHelperText>
              </FormControl>
              <Button type='submit' variant='contained' disabled={clientId === '' || fhirUrl === ''}>
                Submit
              </Button>
            </form>
          </CardContent>
        </Card>
        <br></br>
        <Box className='clientIds'>
          <Typography variant='h5' component='div' color='text.secondary'>
            Existing Client Ids:
          </Typography>

          {currentClients.map((client, index) => {
            return (
              <div key={index} className='clientIdList'>
                <span style={{ marginRight: '35px' }}>
                  <b>{client.name}</b>: {client.client}
                </span>
                <IconButton
                  style={{ marginRight: '5px' }}
                  onClick={() => {
                    deleteClient(client);
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </div>
            );
          })}
        </Box>
      </Box>
    </>
  );
}
