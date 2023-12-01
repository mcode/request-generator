import React, { Component, useState, useEffect } from 'react';
import './PatientSearchBarStyle.css';
import { Typography, Box, TextField, Autocomplete } from '@mui/material';
import PatientBox from '../../SMARTBox/PatientBox';
import { defaultValues } from '../../../util/data';
import { PrefetchTemplate } from '../../../PrefetchTemplate';



export default function PatientSearchBar(props) {
    if(!props.searchablePatients){
        props.searchablePatients = {};
    };

    const [options] = useState(defaultValues);

    const [input, setInput] = useState('');
    // const [list, setList] = useState([]);
    const [listOfPatients, setListOfPatients] = useState([]);

    const handleInput = (e) => {
        setInput(e.target.value.toLowerCase());
    };

    // useEffect(() => {
    //     setList(listOfPatients);
    // }, []);

    useEffect(() => {
        const newList = props.searchablePatients.map((patient) => ({
            id: patient.id,
            name: getName(patient),
            // name: patient.name
        }));
        setListOfPatients([newList]);

    }, [props.searchablePatients]);


    function getName(patient) {
        if (patient.name) {
            return (patient.name[0].given[0]) + ' ' + (patient.name[0].family);
        }
        return '';
    }

    // function findPatientByID(id){
    //     return props.searchablePatients.filter(
    //         function(data){ return props.searchablePatients.id == id}
    //     );
    // }

    function patientSearchBar() {
        return (
            <Box className='App'
                sx={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-evenly',
                }}>

                    <Autocomplete
                        disablePortal
                        id='combo-box-demo'
                        options={listOfPatients[0].map(item => item.name)}

                        renderInput={(params) => <TextField {...params}
                            label='Search for a patient'
                            onSelect={handleInput}
                            sx={{
                                top: -10,
                                width: '100%',
                                margin: '10px auto',
                            }} />}
                    />


                {displayFilteredPatientList(input, listOfPatients[0])}
            </Box>
        );
    }

    

    function displayFilteredPatientList(searchstring, listOfPatients) {
        const filteredListOfPatients = listOfPatients.filter((element) => {
            if (searchstring === '') {
                return element;
            }
            else{
                return element.name.toLowerCase().includes(searchstring);
            }
        });

        return (
            <Box>

                {/* {console.log('should be here')}
                {console.log(JSON.stringify(listOfPatients))}
                {console.log('______')} */}


                {filteredListOfPatients.map((patient) => {
                    return (
                        <div key={patient.id}>
                            <h1>{patient.name}</h1>
                            <h3>{patient.id} </h3>
                            {/* <h4>{props.searchablePatients[0]}</h4> */}
                            {/* <h4>{patient}</h4> */}
                            {/* <h4>{JSON.stringify(patient)}</h4>
                            <h5>{JSON.stringify(listOfPatients[0].id)}</h5> */}
                        </div>
                    );
                })}


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
                                updatePrefetchCallback={PrefetchTemplate.generateQueries} // this is causing issues :/
                                clearCallback={props.clearCallback}
                                ehrUrl={props.ehrUrl} // is this used?
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



            {/* Example need to delete
            {props.searchablePatients.map(patient => {
                return (
                    <Box>
                        <h1>{patient.id}  {getName(patient)}</h1>
                    </Box>
                );
            })} */}



        </div>
    );


}

const top100Films = [
    { label: 'The Shawshank Redemption', year: 1994 },
    { label: 'The Godfather', year: 1972 },
    { label: 'The Godfather: Part II', year: 1974 },
    { label: 'The Dark Knight', year: 2008 },
    { label: '12 Angry Men', year: 1957 },
    { label: "Schindler's List", year: 1993 },
    { label: 'Pulp Fiction', year: 1994 },
];

const patientData = [
    { id: 'pat1234', name: 'one' },
    { id: 'pat017', name: 'two' },
    { id: 'pat036', name: 'three' },
];