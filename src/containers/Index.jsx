import React, { useState, useEffect } from 'react';
import FHIR from 'fhirclient';
import env from 'env-var';
import Home from '../components/RequestDashboard/Home';
import { SettingsProvider } from './ContextProvider/SettingsProvider';

const Index = props => {
  const [client, setClient] = useState(null);

  useEffect(() => {
    FHIR.oauth2.ready().then(client => {
      setClient(client);
    });
  }, []);

  return (
    <div>
      {client ? (
        <SettingsProvider>
          <Home client={client} />
        </SettingsProvider>
      ) : (
        <div className="loading">
          <h1>Getting Client...</h1>
        </div>
      )}
    </div>
  );
};

export default Index;
