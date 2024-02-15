import { Autocomplete, Box, TextField, IconButton } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { PrefetchTemplate } from '../../../PrefetchTemplate';
import { defaultValues } from '../../../util/data';
import RefreshIcon from '@mui/icons-material/Refresh';

import PatientBox from '../../SMARTBox/PatientBox';
import './PatientSearchBarStyle.css';

export default function PatientSearchBar(props) {
  const [options] = useState(defaultValues);
  const [input, setInput] = useState('');
  const [listOfPatients, setListOfPatients] = useState([]);

  useEffect(() => {
    const newList = props.searchablePatients.map(patient => ({
      id: patient.id,
      name: getName(patient)
    }));
    setListOfPatients([newList]);
  }, [props.searchablePatients]);

  function getName(patient) {
    if (patient.name) {
      return patient.name[0].given[0] + ' ' + patient.name[0].family;
    }
    return '';
  }

  function getFilteredLength(searchstring, listOfPatients) {
    const filteredListOfPatients = listOfPatients[0].filter(element => {
      if (searchstring === '') {
        return element;
      } else {
        return element.name.toLowerCase().includes(searchstring);
      }
    });

    return filteredListOfPatients.length;
  }

  function patientSearchBar() {
    return (
      <Box className="search-box-container">
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
          <IconButton
                color="primary"
                onClick={() => props.getPatients()}
                size="large"
                >
                    <RefreshIcon fontSize="large" />
            </IconButton>
        </span>
        {displayFilteredPatientList(input, listOfPatients[0])}
      </Box>
    );
  }

  function displayFilteredPatientList(searchstring, listOfPatients) {
    const filteredListOfPatients = listOfPatients.filter(element => {
      if (searchstring === '') {
        return element;
      } else {
        return element.name.toLowerCase().includes(searchstring);
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
                callbackList={props.callbackList}
                callbackMap={props.callbackMap}
                updatePrefetchCallback={PrefetchTemplate.generateQueries}
                clearCallback={props.clearCallback}
                options={options}
                responseExpirationDays={props.responseExpirationDays}
                defaultUser={props.defaultUser}
              />
            </span>
          );
        })}
      </Box>
    );
  }

  return <span>{listOfPatients[0] ? patientSearchBar() : 'loading...'}</span>;
}
