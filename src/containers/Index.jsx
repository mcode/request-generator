import React, { useState, useEffect } from 'react';
import FHIR from 'fhirclient';
import env from 'env-var';
import RequestBuilder from '../containers/RequestBuilder';

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
        <RequestBuilder client={client} />
      ) : (
        <div className="loading">
          <h1>Getting Client...</h1>
        </div>
      )}
    </div>
  );
};

export default Index;
