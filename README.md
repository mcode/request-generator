# CRD Request Generator
This subproject provides a small web application that is capable of generating CRD requests and displaying the CDS Hooks cards that are provided as a response. This project is written in JavaScript and runs in [node.js](https://nodejs.org/en/).  

## Running the request generator standalone
1. Install node.js
2. Clone the repository
  * `git clone https://github.com/mcode/crd-request-generator.git`
3. Install the dependencies
  * `cd request-generator`
  * `npm install`
4. Run the application
  * `npm start`

This should open a browser window directed to http://localhost:3000. The request-generator assumes the CRD server is running on `localhost:8090`. This can be changed in the properties file [properties.json](src/properties.json).

## Versions
This application requires node v20.0 or greater.

### How To Override Defaults
The .env file contains the default URI paths, these can be overwritten from the start command as follows:
 `REACT_APP_REMS_HOOKS_PATH=http://example.com PORT=6000 npm start`
 
Following are a list of modifiable paths: 

| URI Name      | Default |
| ----------- | ----------- |
| LAUNCH_URL  | `http://localhost:3000`  |
| URL_FILTER  | `http://localhost:3000/*`        |
| EHR_SERVER  | `http://localhost:8080/ehr-server/`  |
| HOME_PAGE   | `http://localhost:8080`  |
| WORKER      | `/service-worker.js`  |

* Might not need this note, depends on if double checking reveals a need to rename
 *Note that .env values can only be accessed by react app starting with `REACT_APP_`*
