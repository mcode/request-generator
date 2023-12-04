import { Autocomplete, Box, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { PrefetchTemplate } from '../../../PrefetchTemplate';
import { defaultValues } from '../../../util/data';
import PatientBox from '../../SMARTBox/PatientBox';
import './PatientSearchBarStyle.css';

export default function PatientSearchBar(props) {
    const [options] = useState(defaultValues);
    const [input, setInput] = useState('');
    const [listOfPatients, setListOfPatients] = useState([]);

    useEffect(() => {
        const newList = props.searchablePatients.map((patient) => ({
            id: patient.id,
            name: getName(patient),
        }));
        setListOfPatients([newList]);
    }, [props.searchablePatients]);

    function getName(patient) {
        if (patient.name) {
            return (patient.name[0].given[0]) + ' ' + (patient.name[0].family);
        }
        return '';
    }

    function patientSearchBar() {
        return (
            <Box className='search-box-container'>
                <Autocomplete className='search-box'
                    disablePortal
                    id='search-box'
                    onInputChange={(event, newInputValue) => {
                        setInput(newInputValue.toLowerCase());
                    }}
                    options={listOfPatients[0].map(item => item.name)}
                    renderInput={(params) => <TextField {...params}
                        label='Search for a patient'
                    />} />
                {displayFilteredPatientList(input, listOfPatients[0])}
            </Box>
        );
    }

    function displayFilteredPatientList(searchstring, listOfPatients) {
        const filteredListOfPatients = listOfPatients.filter((element) => {
            if (searchstring === '') {
                return element;
            }
            else {
                return element.name.toLowerCase().includes(searchstring);
            }
        });

        return (
            <Box>
                {filteredListOfPatients.map(patient => {
                    return (
                        <div key={patient.id}>
                            <PatientBox
                                key={patient.id}
                                patient={props.searchablePatients.find(item => item.id === patient.id)}
                                client={props.client}
                                callback={props.callback}
                                callbackList={props.callbackList}
                                callbackMap={props.callbackMap}
                                updatePrefetchCallback={PrefetchTemplate.generateQueries}
                                clearCallback={props.clearCallback}
                                ehrUrl={props.ehrUrl}
                                options={options}
                                responseExpirationDays={props.responseExpirationDays}
                                defaultUser={props.defaultUser}
                            />
                        </div>
                    );
                })}
            </Box>
        );
    }

    return (
        <div>
            {listOfPatients[0] ? patientSearchBar() : 'loading...'}
        </div>
    );
}