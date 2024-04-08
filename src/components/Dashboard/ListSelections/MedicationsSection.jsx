import { memo, useState, useEffect } from 'react';
import { Paper, Typography } from '@mui/material';
import useStyles from '../styles';
import { MedicationStatus } from '../../MedicationStatus/MedicationStatus';

const MedicationsSection = props => {
  const classes = useStyles();
  const [message, setMessage] = useState('Loading...');
  const [resources, setResources] = useState([]);
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

const MedicationElement = props => {
  const { initialMedicationDispense, client } = props;
  const [lastCheckedMedicationTime, setMedicationTime] = useState(null);
  const [medicationDispense, setMedicationDispense] = useState(initialMedicationDispense);
  const ehrUrl = client.state.serverUrl;
  const patientId = client.patient.id;
  const medicationRequest = medicationDispense?.authorizingPrescription?.[0];

  const getMedicationStatus = () => {
    setMedicationTime(Date.now());

    if (client?.patient && patientId) {
      client.request(`MedicationDispense/${medicationDispense.id}`, {
        pageLimit: 0,
        onPage: bundle => {
          setMedicationDispense(bundle.entry[0].resource);
        },
        resolveReferences: 'authorizingPrescription'
      });
    }
  };

  return (
    <MedicationStatus
      ehrUrl={ehrUrl}
      request={medicationRequest || { id: null }}
      medicationDispense={medicationDispense}
      getMedicationStatus={getMedicationStatus}
      lastCheckedMedicationTime={lastCheckedMedicationTime}
    />
  );
};

export default memo(MedicationsSection);
