import React, { useContext, useEffect, useState } from 'react';
import { Stack, Paper, Typography } from '@mui/material';
import { actionTypes } from '../ContextProvider/reducer';
import { SettingsContext } from '../ContextProvider/SettingsProvider';

function SimplePatientSelect(props) {
    const { client } = props;
    const [patients, setPatients] = useState([]);
    const [globalState, dispatch] = useContext(SettingsContext);

    const handlePatientClick = (patient) => {
        dispatch({ type: actionTypes.updatePatient, value: patient }); 
    };
    useEffect(() => {
        client.request("Patient").then(result => {
            setPatients(result.entry.map(entry => entry.resource));
        });
    }, []);

    return (
        <Stack spacing={2} style={{ margin: '20px' }}>
            {patients.map((patient, index) => (
                <Paper elevation={3} key={index} style={{ padding: '16px' }} onClick = {() => {handlePatientClick(patient)}}>
                    <Typography variant="h6">
                        {patient.name?.[0]?.given?.[0] || 'Unknown'} {patient.name?.[0]?.family || ''}
                    </Typography>
                    <Typography variant="body2">DOB: {patient.birthDate || 'Unknown'}</Typography>
                    <Typography variant="body2">Patient ID: {patient.id}</Typography>
                </Paper>
            ))}
        </Stack>
    );
}

export default SimplePatientSelect;
