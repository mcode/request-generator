# Request Generator

This project provides a testing tool for the REMS workflow that is capable of generating CDS Hooks requests and displaying the CDS Hooks cards that are provided as a response. The Request Generator also handles various other tasks like patient selection, sending medication requests to the pharmacy system, managing in-progress Questionnaire forms, and launching SMART apps. Typically, capabilities provided by the Request Generator would be handled by an EHR in a production environment.

This project is written in JavaScript with React and runs in [node.js](https://nodejs.org/en/).

## Initialization

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

This should open a browser window directed to the value set in `VITE_URL` followed by the string `/request-generator`. The request-generator assumes the REMS Admin is running on the default value set for `VITE_SERVER`. This can be changed in the properties file [.env](./.env). [The following section](./README.md#how-to-override-defaults) lists the default values for these environment variables.

## Running with docker

Run the following commands

- `docker build -t reqgen .`
- `docker run -p 3000:3000 reqgen`

## Keys

Embedded in the application are the public and private keys used to generate and verify JSON Web Tokens (JWT) that are used to authenticate/authorize calls to a CDS-Hooks service. The public key is contained in the public/.well-known/jwks.json document. The private key is contained in src/keys/crdPrivateKey.js file. The keys were generated from https://mkjwk.org/. To update these keys you can generate a new key pair from this site, ensure that you request the Show X.509 option is set to yes. Once generated you can replace the public and private keys. You will also need to update the src/utils/auth.js file with the corresponding key information.

## Usage

To use the app, first you must launch it.  The Request Generator is a SMART on FHIR App, so it can either be launched standalone, by visiting the base url (http://localhost:3000), or EHR launched, which requires the app to be launched from an actual EHR system or a SMART App Launcher that mimics an EHR system.

### Using a SMART App Launcher

1. Go to a SMART app launcher, such as `https://launch.smarthealthit.org/`.
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

### Workflow

The Request Generator's main purpose is to provide the capability to send CDS hooks to and receive/display cards from a CDS service like the [REMS Admin](https://github.com/mcode/rems-admin). After launching the app, the main workflow consists of selecting a patient and then selecting a medication for that patient. The selected medication can be sent to the [pharmacy system](https://github.com/mcode/pims) to kick off the REMS workflow, though it is not necessary if you just want to explore.

The next step is to submit the patient and medication information to the REMS Admin.  The REMS admin will respond with a set of cards indicating whether the selected medication has a REMS program, with links to fill out necessary forms if it does have one. The workflow then continues from the request generator to the [REMS SMART on FHIR app](https://github.com/mcode/rems-smart-on-fhir), which handles filling out forms and fulfilling requirements. 

The Request Generator also manages tasks, which can be used to defer forms to be completed later, or to assign forms to specific parties. Tasks can be handled in the `tasks` tab and can be created from cards that are returned from the REMS Admin. Some cards will have a suggestion to create a task for completing a form, and clicking on the suggestion button will automatically create a task resource.

For patients, the Reqest Generator has a patient portal which allows users to view their in progress medications, tasks that are assigned to them, and information about their prescriptions. The patient portal is mainly used to allow patients to fill out required forms by launching them from a task or in-progress form into the REMS SMART on FHIR app. 

Information about the status of the prescription and the status of the REMS approval can be viewed directly in the Request Generator. Panels with the status information can be viewed in both the main app and the patient portal.


## Routes

The request generator has three distinct routes.

* `/` - The base route opens the main app page.  This is where a user can select a patient and send a CDS Hook, or launch a SMART app.

* `/patient-portal` - The patient portal allows patients to log into the EHR and see information about their pending medications or launch a SMART app from a task to complete a pending form.

* `/register` - The registration page allows users to add client ids and their associated FHIR server url to allow for connecting to different EHRs automatically.  This is useful for launching the request generator directly from an EHR or from a SMART sandbox, as opposed to visiting the base route directly.

## How to launch as a SMART on FHIR app


<!-- TODO: update step 4 once Zach does client registration ticket. This is the error when launching:

```
Error invalid_client
There was an error processing your request.

Client with id app-login was not found
```

-->

## How to launch a SMART on FHIR app from request-generator

See the [following guide](./How-To-Launch-SMART-on-FHIR-Apps.md) for more information.


### Environment Variables

The .env file contains the default URI paths, which can be overwritten from the start command in one of the following ways:
* By starting the app with the following comamand: `VITE_LAUNCH_URL=http://example.com PORT=6000 npm start`
* By specifying the environment variables and desired values in a `.env.local` file.

Following are a list of modifiable paths:

| URI Name                                                   | Default                                                                                              | Description          |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |-----------------------
| VITE_ALT_DRUG                                         | `true`                                                                                               | When set to true, allows the app to recieve alternate drug therapy cards from the REMS Admin.                |
| VITE_AUTH                                             | `http://localhost:8180`                                                                              | The base URL of the EHR auth server.                    |
| VITE_CDS_SERVICE                                      | `http://localhost:8090/cds-services`                                                                 | The base URL of the CDS Service.  This will typically be the REMS Admin.                     |
| VITE_CLIENT                                           | `app-login`                                                                                          | The default client to use for the SMART launch. Can be modified directly when launching the app.                     |
| VITE_CLIENT_SCOPES                                    | `launch offline_access openid profile user/Patient.read patient/Patient.read user/Practitioner.read` | The default scopes to use for the SMART launch. Can be modified directly when launching the app.                      |
| VITE_USE_DEFAULT_USER                                 | `false`                                                                                              | When true, override the logged in user with the default user.                     |
| VITE_DEFAULT_USER                                     | `pra1234`                                                                                            | The default user to log in as when SMART launching. It should be the FHIR id of a practitioner resource.                     |
| VITE_EHR_BASE                                         | `http://localhost:8080/test-ehr/r4`                                                                  | The default base url for the EHR. Can be modified directly when launching the app.                     |
| VITE_EHR_SERVER                                       | `http://localhost:8080/test-ehr/r4`                                                                  | The default base url for the EHR FHIR Server. Generally, this should be the same as the EHR_BASE.                     |
| VITE_EHR_SERVER_TO_BE_SENT_TO_REMS_ADMIN_FOR_PREFETCH | `http://localhost:8080/test-ehr/r4`                                                                  | The default base URL for the EHR FHIR server to be sent in the CDS Hook. This environment generally should match EHR_SERVER, except in edge cases when dealing with deployment.                     |
| VITE_GENERATE_JWT                                     | `true`                                                                                               | When true, the app will generate a JWT for authentication when sending the CDS Hook.  Can be set to false if using a REMS Admin CDS Service that is not secured.                      |
| VITE_GH_PAGES                                         | `false`                                                                                              | Should be set to `true` if the app is being hosted on github pages, and `false` otherwise.                     |
| VITE_LAUNCH_URL                                       | `http://localhost:4040/launch`                                                                       | The launch URL of the SMART app the request generator should use for standalone launches.  Note that this URL is only used outside of the context of the CDS Hooks workflow.  Normally, the SMART app launch URL will come from a link inside a card that is returned by the REMS Admin.                     |
| VITE_PASSWORD                                         | `alice`                                                                                              | The default password for logging in as the default user, defined by VITE_USER. This should be changed if using a different default user.                     |
| VITE_PATIENT_FHIR_QUERY                               | `Patient?_sort=identifier&_count=12`                                                                 | The FHIR query the app makes when searching for patients in the EHR. This should be modified if a different behavior is desired by the apps patient selection popup. This can also be modified directly in the app's settings.                     |
| VITE_PIMS_SERVER                                      | `http://localhost:5051/ncpdp/script`                                                       | The Pharmacy System endpoint for submitting medications. This should be changed depending on which pharmacy system you want to connect with.                     |
| VITE_PUBLIC_KEYS                                      | `http://localhost:3000/request-generator/.well-known/jwks.json`                                      | The endpoint which contains the public keys for authentication with the REMS admin.  Should be changed if the keys are moved elsewhere.                     |
| VITE_REALM                                            | `ClientFhirServer`                                                                                   | The Keycloak realm to use. Only relevant is using Keycloak as an authentication server. This only affects direct logins like through the Patient Portal, not SMART launches like opening the app normally.                     |
| VITE_RESPONSE_EXPIRATION_DAYS                         | `30`                                                                                                 | The number of days old a Questionnaire Response can be before it is ignored and filtered out.  This ensures the patient search excludes outdated or obsolete prior sessions from creating clutter.                     |
| VITE_SMART_LAUNCH_URL                                 | `http://localhost:4040/`                                                                             | The base url of the SMART app. This is used for opening the app directly, rather than doing an EHR SMART launch.                     |
| VITE_URL                                              | `http://localhost:3000`                                                                              | The base url of this app.  Should be modified if the port or domain change.                     |
| VITE_USER                                             | `alice`                                                                                              | The default user to login as when opening the app.                      |
| VITE_USE_INTERMEDIARY                                 | false                                                                                                | When true, the app will send all CDS Hooks and REMS ETASU check calls to the intermediary defined in VITE_INTERMEDIARY.                      |
| VITE_INTERMEDIARY                                     | `http:/localhost:3030`                                                                              | The base url of the intermediary.                      |
| VITE_USE_PHARMACY_IN_PREFETCH                         | true                                                                                                 | When true, the app will send pharmacy information to the rems admin in the CDS Hooks prefetch                     |
| VITE_PHARMACY_ID                                     | `pharm0111`                                                                              | The pharmacy ID to use in the CDS Hooks Prefetch                      | 

# Data Rights
This repository has been forked from the [HL7-DaVinci/crd-request-generator](https://github.com/HL7-DaVinci/crd-request-generator) repository. As such, the following data rights apply to all changes made on this fork of the repository, starting with release 0.1 and onward.

<div style="text-align:center">
<b>NOTICE</b>
</div>

This (software/technical data) was produced for the U. S. Government under Contract Number 75FCMC18D0047/75FCMC23D0004, and is subject to Federal Acquisition Regulation Clause 52.227-14, Rights in Data-General.


No other use other than that granted to the U. S. Government, or to those acting on behalf of the U. S. Government under that Clause is authorized without the express written permission of The MITRE Corporation.


For further information, please contact The MITRE Corporation, Contracts Management Office, 7515 Colshire Drive, McLean, VA 22102-7539, (703) 983-6000.

<div style="text-align:center">
<b>&copy;2025 The MITRE Corporation.</b>
</div>

<br />

Licensed under the Apache License, Version 2.0 (the "License"); use of this repository is permitted in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
