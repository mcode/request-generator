import React, { memo, useState, useEffect } from 'react';
import FHIR from 'fhirclient';
import env from 'env-var';

const Launch = () => {
  useEffect(() => {
    FHIR.oauth2.authorize({
      clientId: env.get('REACT_APP_CLIENT').asString(),
      scope: env.get('REACT_APP_CLIENT_SCOPES').asString(),
      redirectUri: '/index'
    });
  }, []);

  return <div>Launching</div>;
};

export default memo(Launch);
