import { Autocomplete, Box, TextField } from '@mui/material';
import { Grid, Button } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';

import { useEffect, useState } from 'react';
import { PrefetchTemplate } from '../../../PrefetchTemplate';
import { defaultValues } from '../../../util/data';

import PatientBox from '../../SMARTBox/PatientBox';
import './PatientSearchBarStyle.css';
import { getPatientFirstAndLastName } from '../../../util/util';

const PatientSearchBar = props => {
  const [options] = useState(defaultValues);
  const [input, setInput] = useState('');
  const [listOfPatients, setListOfPatients] = useState([]);

  useEffect(() => {
    const newList = props.searchablePatients.map(patient => ({
      id: patient.id,
      name: getPatientFirstAndLastName(patient)
    }));
    setListOfPatients([newList]);
  }, [props.searchablePatients]);

  function getFilteredLength(searchString, listOfPatients) {
    const filteredListOfPatients = listOfPatients[0].filter(element => {
      if (searchString === '') {
        return element;
      } else {
        return element.name.toLowerCase().includes(searchString);
      }
    });

    return filteredListOfPatients.length;
  }

  const showAllPatients = () => {
    props.callback('patient', {});
    props.callback('expanded', false);
  };

  function patientSearchBar() {
    return (
      <Box className="search-box-container">
        <Grid container>
          <Grid item xs={9}>
        <span className="search-header">
          <p>Filter patient list</p>
          <Autocomplete
            className="search-box"
            disablePortal
            id="search-box"
            onInputChange={(event, newInputValue) => {
              setInput(newInputValue.toLowerCase());
            }}
            options={listOfPatients[0].map(item => item.name)}
            renderInput={params => <TextField {...params} label="Search" />}
          />
          <p>
            Showing {getFilteredLength(input, listOfPatients)} of {props.searchablePatients.length}{' '}
            records
          </p>
        </span>
          </Grid>
          <Grid item xs={3}>
            <Button variant="contained" startIcon={<PeopleIcon />} onClick={() => { showAllPatients(); }} style={{padding:'10px','paddingLeft':'20px', 'paddingRight':'20px'}}>
              Select all Patients
            </Button>
          </Grid>
        </Grid>
        {displayFilteredPatientList(input, listOfPatients[0])}
      </Box>
    );
  }

  function displayFilteredPatientList(searchString, listOfPatients) {
    const filteredListOfPatients = listOfPatients.filter(element => {
      if (searchString === '') {
        return element;
      } else {
        return element.name.toLowerCase().includes(searchString);
      }
    });
    return (
      <Box>
        {filteredListOfPatients.map(patient => {
          return (
            <span key={patient.id}>
              <PatientBox
                key={patient.id}
                patient={props.searchablePatients.find(item => item.id === patient.id)}
                client={props.client}
                request={props.request}
                launchUrl={props.launchUrl}
                callback={props.callback}
                callbackMap={props.callbackMap}
                updatePrefetchCallback={PrefetchTemplate.generateQueries}
                clearCallback={props.clearCallback}
                options={options}
                responseExpirationDays={props.responseExpirationDays}
                user={props.user}
                showButtons={props.showButtons}
              />
            </span>
          );
        })}
      </Box>
    );
  }

  return <span>{listOfPatients[0] ? patientSearchBar() : 'loading...'}</span>;
};

export default PatientSearchBar;
