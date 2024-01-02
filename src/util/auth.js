import privKey from '../keys/crdPrivateKey.js';
import KJUR, { KEYUTIL } from 'jsrsasign';
import { v4 as uuidv4 } from 'uuid';
import env from 'env-var';

function login() {
  const tokenUrl =
    env.get('REACT_APP_AUTH').asString() +
    '/realms/' +
    env.get('REACT_APP_REALM').asString() +
    '/protocol/openid-connect/token';
  let params = {
    grant_type: 'password',
    username: env.get('REACT_APP_USER').asString(),
    password: env.get('REACT_APP_PASSWORD').asString(),
    client_id: env.get('REACT_APP_CLIENT').asString()
  };

  // Encodes the params to be compliant with
  // x-www-form-urlencoded content type.
  const searchParams = Object.keys(params)
    .map(key => {
      return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
    })
    .join('&');
  // We get the token from the url
  return fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: searchParams
  });
}

/**
 * Generates a JWT for a CDS service call, given the audience (the URL endpoint). The JWT is signed using a private key stored on the repository.
 *
 * Note: In production environments, the JWT should be signed on a secured server for best practice. The private key is exposed on the repository
 * as it is an open source client-side project and tool.
 * @param {*} audience - URL endpoint acting as the audience
 */
function createJwt(baseUrl, audience) {
  const jwtPayload = JSON.stringify({
    iss: baseUrl,
    aud: audience,
    exp: Math.round(Date.now() / 1000 + 300),
    iat: Math.round(Date.now() / 1000),
    jti: uuidv4()
  });

  const jwtHeader = JSON.stringify({
    alg: 'ES384',
    typ: 'JWT',
    kid: 'zGe023HzCFfY7NPb04EGvRDP1oYsTOtLNCNjDgr66AI',
    jku: env.get('REACT_APP_PUBLIC_KEYS').asString()
  });

  return KJUR.jws.JWS.sign(null, jwtHeader, jwtPayload, privKey);
}

export { createJwt, login };
