import React, { memo, useState, useEffect } from 'react';
import { Paper } from '@mui/material';
import FormElement from '../FormElement';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import useStyles from '../styles';

const FormsSection = props => {
  const classes = useStyles();
  const [resources, setResources] = useState([]);
  const [message, setMessage] = useState('Loading...');
  const [checked, setChecked] = useState(true);

  useEffect(() => {
    if (props.client.patient.id) {
      props.client.patient
        .request('QuestionnaireResponse', { pageLimit: 0, onPage: addResources })
        .then(() => {
          setMessage(
            'No QuestionnaireResponses Found for user with patientId: ' + props.client.patient.id
          );
        });
    } else {
      setMessage('Invalid patient: No patientId provided');
    }
  }, [props.client.patient]);

  const handleChange = event => {
    setChecked(event.target.checked);
  };

  const addResources = bundle => {
    if (bundle.entry) {
      bundle.entry.forEach(e => {
        const resource = e.resource;
        setResources(resources => [...resources, resource]);
      });
    }
  };

  const renderElements = () => {
    let resourcesToRender = [];
    if (checked) {
      resourcesToRender = resources.filter(e => {
        return e.status === 'in-progress';
      });
    } else {
      resourcesToRender = resources;
    }
    resourcesToRender.reverse();
    return resourcesToRender;
  };

  return (
    <div className={classes.dashboardArea}>
      <h2 className={classes.elementHeader}>Available Forms</h2>
      <FormControlLabel
        style={{ float: 'right' }}
        control={<Checkbox checked={checked} onChange={handleChange} />}
        label="Only show in-progress forms"
      />
      {resources.length > 0 ? (
        renderElements().map(e => {
          return <FormElement key={e.id} status={e.status} resource={e} client={props.client} />;
        })
      ) : (
        <Paper className={classes.dashboardElement}>{message}</Paper>
      )}
    </div>
  );
};

export default memo(FormsSection);
