import React, { memo, useState, useEffect } from 'react';
import FHIR from 'fhirclient';
import env from 'env-var';
import queryString from 'querystring';

const Launch = props => {
  useEffect(() => {
    // this is a workaround for the fhir client not being able to pull values out of the
    // hash. Regex will look for different permutations of a hashrouter url /#/launch /#launch #launch /#launch
    const params = queryString.parse((window.location.hash || '').replace(/\/?#\/?launch\?/, ''));

    // if these are null then the client will pull them out of the browsers query string
    // so we don't need to do that here.
    const iss = params.iss;
    const launch = params.launch;

    FHIR.oauth2.authorize({
      clientId: env.get('REACT_APP_CLIENT').asString(),
      scope: env.get('REACT_APP_CLIENT_SCOPES').asString(),
      redirectUri: props.redirect,
      iss: iss,
      launch: launch
    });
  }, []);

  return <div>Launching</div>;
};

export default memo(Launch);
