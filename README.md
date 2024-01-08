# Request Generator

This project provides a small web application that is capable of generating requests and displaying the CDS Hooks cards that are provided as a response. This project is written in JavaScript and runs in [node.js](https://nodejs.org/en/).

## Running the request generator standalone

1. Install node.js v14 (using [`nvm`](https://github.com/nvm-sh/nvm) is optional, but easier)

- `nvm install 14`
- `nvm use 14`

2. Clone the repository

- `git clone https://github.com/mcode/request-generator.git`

3. Install the dependencies

- `cd request-generator`
- `npm install`

4. Run the application

- `npm start`

This should open a browser window directed to the value set in `REACT_APP_URL` followed by the string `/request-generator`. The request-generator assumes the REMS Admin is running on the default value set for `REACT_APP_SERVER`. This can be changed in the properties file [.env](./.env). [The following section](./README.md#how-to-override-defaults) lists the default values for these environment variables.

## Keys

Embedded in the application are the public and private keys used to generate and verify JSON Web Tokens (JWT) that are used to authenticate/authorize calls to a CDS-Hooks service. The public key is contained in the public/.well-known/jwks.json document. The private key is contained in src/keys/crdPrivateKey.js file. The keys were generated from https://mkjwk.org/. To update these keys you can generate a new key pair from this site, ensure that you request the Show X.509 option is set to yes. Once generated you can replace the public and private keys. You will also need to update the src/utils/auth.js file with the corresponding key information.

### How To Override Defaults

The .env file contains the default URI paths, which can be overwritten from the start command as follows:
a) `REACT_APP_LAUNCH_URL=http://example.com PORT=6000 npm start` or b) by specifying the environment variables and desired values in a `.env.local`.

Following are a list of modifiable paths:

| URI Name                                                   | Default                                                                                              |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| HTTPS                                                      | `false`                                                                                              |
| HTTPS_CERT_PATH                                            | `server.cert`                                                                                        |
| HTTPS_KEY_PATH                                             | `server.key`                                                                                         |
| REACT_APP_ALT_DRUG                                         | `true`                                                                                               |
| REACT_APP_AUTH                                             | `http://localhost:8180`                                                                              |
| REACT_APP_CDS_SERVICE                                      | `http://localhost:8090/cds-services`                                                                 |
| REACT_APP_CLIENT                                           | `app-login`                                                                                          |
| REACT_APP_CLIENT_SCOPES                                    | `launch offline_access openid profile user/Patient.read patient/Patient.read user/Practitioner.read` |
| REACT_APP_DEFAULT_USER                                     | `pra1234`                                                                                            |
| REACT_APP_EHR_BASE                                         | `http://localhost:8080/test-ehr/r4`                                                                  |
| REACT_APP_EHR_LINK                                         | `http://localhost:8080/ehr-server/`                                                                  |
| REACT_APP_EHR_SERVER                                       | `http://localhost:8080/test-ehr/r4`                                                                  |
| REACT_APP_EHR_SERVER_TO_BE_SENT_TO_REMS_ADMIN_FOR_PREFETCH | `http://localhost:8080/test-ehr/r4`                                                                  |
| REACT_APP_GENERATE_JWT                                     | `true`                                                                                               |
| REACT_APP_GH_PAGES                                         | `false`                                                                                              |
| REACT_APP_HOMEPAGE                                         | `http://localhost:8080`                                                                              |
| REACT_APP_LAUNCH_URL                                       | `http://localhost:4040/launch`                                                                       |
| REACT_APP_ORDER_SELECT                                     | `rems-order-select`                                                                                  |
| REACT_APP_ORDER_SIGN                                       | `rems-order-sign`                                                                                    |
| REACT_APP_PASSWORD                                         | `alice`                                                                                              |
| REACT_APP_PATIENT_FHIR_QUERY                               | `Patient?_sort=identifier&_count=12`                                                                 |
| REACT_APP_PATIENT_VIEW                                     | `rems-patient-view`                                                                                  |
| REACT_APP_PIMS_SERVER                                      | `http://localhost:5051/doctorOrders/api/addRx`                                                       |
| REACT_APP_PUBLIC_KEYS                                      | `http://localhost:3000/request-generator/.well-known/jwks.json`                                      |
| REACT_APP_REALM                                            | `ClientFhirServer`                                                                                   |
| REACT_APP_RESPONSE_EXPIRATION_DAYS                         | `30`                                                                                                 |
| REACT_APP_SERVER                                           | `http://localhost:8090`                                                                              |
| REACT_APP_SMART_LAUNCH_URL                                 | `http://localhost:4040/`                                                                             |
| REACT_APP_URL                                              | `http://localhost:3000`                                                                              |
| REACT_APP_URL_FILTER                                       | `http://localhost:3000/*`                                                                            |
| REACT_APP_USER                                             | `alice`                                                                                              |

## How to launch as a SMART on FHIR app

### Using a SMART App Launcher

1. Go to a SMART app launcher, such as `http://moonshot-dev.mitre.org:4001/index.html` (MITRE) or `https://launch.smarthealthit.org/` (open to public).
2. For the App Launch URL, provide `http://localhost:3000/launch`.

### Using Meld or a real EHR

1. If you'd like to launch from Meld, [log in to Meld](https://meld.interop.community/) and follow steps 2-3.
2. The log in page will bring you to the My Sandboxes page. Go to your sandbox.
3. You will land on the Registered Apps page. Click on the circular plus button in the top-right corner and register the request-generator app manually with these settings:

   - Client Type: `Public Client`
   - App Launch URI: `http://localhost:3000/launch`
   - App Redirect URIs: `http://localhost:3000/#/index, http://localhost:4040/register,http://localhost:3000/index, http://localhost:4040/index`
   - Scopes: `launch openid user/*.* offline_access profile`

4. After registering request-generator, hover over it and click Launch.

<!-- TODO: update step 4 once Zach does client registration ticket. This is the error when launching:

```
Error invalid_client
There was an error processing your request.

Client with id app-login was not found
```

-->

## How to launch a SMART on FHIR app from request-generator

See the [following guide](./How-To-Launch-SMART-on-FHIR-Apps.md) for more information.
