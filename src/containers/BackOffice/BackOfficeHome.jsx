import React from 'react';
import { Grid, Card, CardContent, Typography, Container } from '@mui/material';

function BackOfficeHome(props) {
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" align="center" gutterBottom>
        Home
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div" gutterBottom>
                Questionnaires
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage and view your questionnaires here.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div" gutterBottom>
                Forms
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Access and fill out forms.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div" gutterBottom>
                Patients
              </Typography>
              <Typography variant="body2" color="text.secondary">
                View and manage patient data.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

export default BackOfficeHome;
