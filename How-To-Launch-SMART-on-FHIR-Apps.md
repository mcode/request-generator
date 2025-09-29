# How to launch external SMART on FHIR apps from mcode/request-generator

## Setup

### In mcode/rems-admin

Overwrite `SMART_ENDPOINT` in the `.env`. Overwriting environment variables in a `.env.local` does not work (this is a bug). For example, if you are using a registered app in a Meld Sandbox, your `SMART_ENDPOINT` may look like this:

```.env
SMART_ENDPOINT = https://smartlauncher.interop.community/sample-app/launch?client_id=sampleapp&platform=meld
```

### In mcode/request-generator

Set these environment variables in your `.env.local` to overwrite the default values in the `.env`. You must be added to the REMS sandbox on Meld to log in and authenticate when running request-generator locally.

```.env
VITE_CLIENT = ed8b940e-4aaa-4209-b17d-69dfe67543b9
VITE_EHR_BASE = https://gw.interop.community/REMS/data
VITE_EHR_SERVER_TO_BE_SENT_TO_REMS_ADMIN_FOR_PREFETCH = https://gw.interop.community/REMS/data
VITE_EHR_SERVER = https://gw.interop.community/REMS/data
VITE_SMART_LAUNCH_URL = https://smartlauncher.interop.community/sample-app/launch?client_id=sampleapp&platform=meld
```

### Where to grab the environment variable values if using a Meld Sandbox

1. `VITE_CLIENT`: This is taken from Apps > Request Generator > Settings > Registered App Details > Client Id. Request Generator refers to the registered mcode/request-generator app in your Meld sandbox.
2. `VITE_EHR_BASE`, `VITE_EHR_SERVER_TO_BE_SENT_TO_REMS_ADMIN_FOR_PREFETCH`, `VITE_EHR_SERVER`: These are taken from your Meld sandbox's sidebar, under Settings > Sandbox > Secured FHIR Server URL.
3. `VITE_SMART_LAUNCH_URL`, `SMART_ENDPOINT`: This is taken from Apps > Sample App > Settings > Registered App Details > App Launch URI\*.

## How to run

1. Start request-generator normally and go to `http://localhost:3000/`. Click the "Authorize" button.
2. Start rems-admin normally.
3. In request-generator, click the "Select a Patient" button.
4. Select John Snow (id: 130803).
5. Click the "Launch SMART on FHIR app" button. This opens the SMART on FHIR app launch page provided as values to the `VITE_SMART_LAUNCH_URL` and `SMART_ENDPOINT` environment variables.
6. Click the "Authorize" button.
7. You should see the expected SMART on FHIR app launch properly.
8. Go back to request-generator and issue an order-sign hook, and click on the "Patient Enrollment Form" button.
9. You should see the expected SMART on FHIR app launch.

## Running other Registered SMART on FHIR Apps from Meld

Log in to Meld at https://meld.interop.community/. Go to My Sandboxes > REMS > Apps to try out the other Registered Apps. The example above manually tests (1). You can try the remaining options after (2) just by changing the `VITE_SMART_LAUNCH_URL` and `SMART_ENDPOINT` environment variables.
