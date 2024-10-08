import { Autocomplete, Box, TextField, IconButton } from '@mui/material';
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
        </span>
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
                defaultUser={props.defaultUser}
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
