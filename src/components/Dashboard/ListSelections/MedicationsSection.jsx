import React, { memo, useState, useEffect } from 'react';
import { Paper } from '@mui/material';
import FormControlLabel from '@mui/material/FormControlLabel';
import useStyles from '../styles';
import { MedicationStatus } from '../../MedicationStatus/MedicationStatus';
import axios from 'axios';

const MedicationsSection = props => {
  const classes = useStyles();
  const [message, setMessage] = useState('Loading...');
  const [resources, setResources] = useState([]);
  const ehrUrl = props.client.state.serverUrl;
  const patientId = props.client.patient.id;

  useEffect(() => {
    if (patientId) {
      props.client.patient
        .request('MedicationDispense', {
          pageLimit: 0,
          onPage: addResources,
          resolveReferences: 'authorizingPrescription'
        })
        .then(() => {
          setMessage(`No MedicationDispenses found for user with patientId: ${patientId}`);
        });
    } else {
      setMessage('Invalid patient: No patientId provided');
    }
  }, [props.client.patient]);

  const addResources = bundle => {
    if (bundle.entry && bundle.entry.length > 0) {
      setResources(bundle.entry.map(entry => entry.resource));
    }
  };

  return (
    <div className={classes.dashboardArea}>
      <h2 className={classes.elementHeader}>Available Medications</h2>
      {resources.length > 0 ? (
        resources.map(resource => (
          <MedicationElement
            key={resource.id}
            ehrUrl={ehrUrl}
            patientId={patientId}
            initialMedicationDispense={resource}
            client={props.client}
          />
        ))
      ) : (
        <Paper className={classes.dashboardElement}>{message}</Paper>
      )}
    </div>
  );
};

const MedicationElement = (ehrUrl, patientId, initialMedicationDispense, client) => {
  //   const classes = useStyles();
  const [lastCheckedMedicationTime, setMedicationTime] = useState(null);
  const [medicationDispense, setMedicationDispense] = useState(initialMedicationDispense);

  const getMedicationStatus = () => {
    setMedicationTime(Date.now());

    if (client?.patient && patientId) {
      client.patient.request('MedicationDispense', {
        pageLimit: 0,
        onPage: bundle => {
          setMedicationDispense(bundle.entry[0]);
        },
        resolveReferences: 'authorizingPrescription'
      });
    }
  };

  return (
    <MedicationStatus
      ehrUrl={ehrUrl}
      request={medicationDispense?.authorizingPrescription?.[0] || { id: null }}
      medicationDispense={medicationDispense}
      getMedicationStatus={getMedicationStatus}
      lastCheckedMedicationTime={lastCheckedMedicationTime}
    />
  );
};

export default memo(MedicationsSection);
