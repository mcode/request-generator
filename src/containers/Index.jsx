import React, { useState, useEffect } from 'react';
import FHIR from 'fhirclient';
import env from 'env-var';
import RequestBuilder from '../containers/RequestBuilder';

const Index = (props) => {
    const [client, setClient] = useState(null);

    useEffect(() => {
        FHIR.oauth2.ready()
        .then(client => {
            setClient(client)
        })
      }, []);

    return (
        <div>
            {client ? <RequestBuilder client = {client}/> : "Getting Client"}
        </div>
    );
};

export default Index;
