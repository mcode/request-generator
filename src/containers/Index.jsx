import { useState, useEffect } from 'react';
import FHIR from 'fhirclient';
import Home from '../components/RequestDashboard/Home';
import BackOffice from './BackOffice/BackOffice';


const Index = (props) => {
  const {backoffice} =  props 
  const [client, setClient] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  console.log(backoffice);
  const [isBackOffice, setBackOffice] = useState(backoffice || null);
  const parseJwt = (token) => {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  
    const jsonToken = JSON.parse(jsonPayload);
    setAuthToken(jsonToken);
    if (jsonToken.realm_access) {
      const roles = jsonToken.realm_access.roles;
      console.log(roles);
      if (roles.includes('BackOffice')) {
        setBackOffice(true);
      } else {
        setBackOffice(false);
      }
    } else {
      // if no realm_access set, default to not using the back office
      setBackOffice(false);
    }
    console.log('isBackOffice: ' + isBackOffice);
  }
  useEffect(() => {
    FHIR.oauth2.ready().then(client => {
      if(!isBackOffice) {
        parseJwt(client.state.tokenResponse.access_token)
      }
      setClient(client);
    });
  }, []);

  return (
    <div>
      {client && (isBackOffice !== null) ? (
        isBackOffice ? <BackOffice client = {client} token = {authToken} />  :
        <Home client={client} token = {authToken} />
      ) : (
        <div className="loading">
          <h1>Getting Client...</h1>
        </div>
      )}
    </div>
  );
};

export default Index;
