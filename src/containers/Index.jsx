import { useState, useEffect } from 'react';
import FHIR from 'fhirclient';
import Home from '../components/RequestDashboard/Home';

const Index = () => {
  const [client, setClient] = useState(null);

  useEffect(() => {
    FHIR.oauth2.ready().then(client => {
      setClient(client);
    });
  }, []);

  return (
    <div>
      {client ? (
        <Home client={client} />
      ) : (
        <div className="loading">
          <h1>Getting Client...</h1>
        </div>
      )}
    </div>
  );
};

export default Index;
