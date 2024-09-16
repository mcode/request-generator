import React, { useState, useEffect, useContext } from 'react';
import { Stack, Typography, Box, Button, Card, CardContent } from '@mui/material';
import { SettingsContext } from '../ContextProvider/SettingsProvider';
import { retrieveLaunchContext } from '../../util/util';

const SimplePatientDetails = ({ client }) => {
  const [questionnaires, setQuestionnaires] = useState([]);
  const [globalState, dispatch] = useContext(SettingsContext);
  const patient = globalState.patient;
  const searchInProgressQuestionnaires = async (patientId) => {
    try {
      const response = await client.request({
        url: `QuestionnaireResponse?subject=Patient/${patientId}&status=in-progress`,
        method: 'GET',
      });
      setQuestionnaires(response.entry || []);
    } catch (error) {
      console.error('Error fetching questionnaires:', error);
    }
  };

  useEffect(() => {
    if (patient?.id) {
      searchInProgressQuestionnaires(patient.id);
    }
  }, [patient]);

  const launchResponse = (response) => {
    const appContext = `response=QuestionnaireResponse/${response.id}`;
    const link = {
        appContext: encodeURIComponent(appContext),
        type: 'smart',
        url: globalState.launchUrl
      };
  
      let linkCopy = Object.assign({}, link);
  
      retrieveLaunchContext(linkCopy, patient.id, client.state).then((res) => {
        window.open(res.url, '_blank');
      });
  }
  if(patient) {
  return (
    <Box sx={{padding: '8px'}}>
      <Typography variant="h4" gutterBottom>
        Patient Details
      </Typography>
      <Card sx={{ mb: 4, boxShadow: 2 }}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">
              <strong>Name:</strong> {patient.name?.[0]?.given?.join(' ')} {patient.name?.[0]?.family}
            </Typography>
            <Typography variant="body1">
              <strong>Date of Birth:</strong> {patient.birthDate}
            </Typography>
            <Typography variant="body1">
              <strong>Gender:</strong> {patient.gender}
            </Typography>
            <Typography variant="body1">
              <strong>Address:</strong> {patient.address?.[0]?.line?.join(', ')}, {patient.address?.[0]?.city}, {patient.address?.[0]?.state}, {patient.address?.[0]?.postalCode}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <Typography variant="h5" sx={{ mb: 2 }}>
        In-Progress Questionnaires
      </Typography>

      {questionnaires.length > 0 ? (
        <Stack spacing={2}>
          {questionnaires.map((q) => (
            <Button
              key={q.resource.id}
              variant="outlined"
              onClick={() => launchResponse(q.resource)}
              sx={{
                textAlign: 'left',
                justifyContent: 'start',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
            <Stack>
                <Typography variant="body1">
                    <strong>Questionnaire ID:</strong> {q.resource.id}
                </Typography>
                <Typography variant="body2">Status: {q.resource.status}</Typography>
            </Stack>
            </Button>
          ))}
        </Stack>
      ) : (
        <Typography variant="body2">No in-progress questionnaires found.</Typography>
      )}
    </Box>
  );
} else {
    return (
        <div>No Patient Selected</div>
    )
}
};

export default SimplePatientDetails;
