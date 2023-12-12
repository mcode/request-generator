# How to launch external SMART on FHIR apps via Meld Environment from mcode/request-generator

## Setup

### In mcode/rems-admin

Overwrite `SMART_ENDPOINT` in the `.env`. Overwriting environment variables in a `.env.local` does not work (this is a bug).

```.env
SMART_ENDPOINT = https://smartlauncher.interop.community/sample-app/launch?client_id=sampleapp&platform=meld
```

### In mcode/request-generator

Set these environment variables in your `.env.local` to overwrite the default values in the `.env`. You must be added to the REMS sandbox on Meld to log in and authenticate when running request-generator locally.

```.env
REACT_APP_CLIENT = ed8b940e-4aaa-4209-b17d-69dfe67543b9
REACT_APP_EHR_BASE = https://gw.interop.community/REMS/data
REACT_APP_EHR_SERVER_TO_BE_SENT_TO_REMS_ADMIN_FOR_PREFETCH = https://gw.interop.community/REMS/data
REACT_APP_EHR_SERVER = https://gw.interop.community/REMS/data
REACT_APP_SMART_LAUNCH_URL = https://smartlauncher.interop.community/sample-app/launch?client_id=sampleapp&platform=meld
```

#### Where to grab the environment variable values

1. `REACT_APP_CLIENT`: This is taken from Apps > Request Generator > Settings > Registered App Details > Client Id. Request Generator refers to the registered mcode/request-generator app in your Meld sandbox.
2. `REACT_APP_EHR_BASE`, `REACT_APP_EHR_SERVER_TO_BE_SENT_TO_REMS_ADMIN_FOR_PREFETCH`, `REACT_APP_EHR_SERVER`: These are taken from your Meld sandbox's sidebar, under Settings > Sandbox > Secured FHIR Server URL.
3. `REACT_APP_SMART_LAUNCH_URL`, `SMART_ENDPOINT`: This is taken from Apps > Sample App > Settings > Registered App Details > App Launch URI\*.

## How to run

1. Start request-generator normally and go to `http://localhost:3000/`. Click the "Authorize" button.
2. Start rems-admin normally.
3. In request-generator, click the "Select a Patient" button.
4. Select Jon Snow (id: 130803).
5. Click the "Launch SMART on FHIR app" button. This opens the SMART on FHIR app launch page provided as values to the `REACT_APP_SMART_LAUNCH_URL` and `SMART_ENDPOINT` environment variables.
6. Click the "Authorize" button.
7. You should see the expected SMART on FHIR app launch properly.
8. Go back to request-generator and issue an order-sign hook, and click on the "Patient Enrollment Form" button.
9. You should see the expected SMART on FHIR app launch.

## Running other Meld-sandbox-registered SMART on FHIR Apps

Log in to Meld at https://meld.interop.community/. Go to My Sandboxes > REMS > Apps to try out the other Registered Apps. The example above manually tests (1). You can try the remaining options after (2) just by changing the `REACT_APP_SMART_LAUNCH_URL` and `SMART_ENDPOINT` environment variables.

1. Sample App - launches for (7) without needing to modify any of the supported CDS Hooks. You will get the following error at (9) unless you replace the `appContext` returned by the `src/hooks/rems.ordersign.ts` hook's `createSmartLink` function with a short string, e.g. `"hello"`.

```
HttpError: 500 Server Error
URL: https://iol2auth.interop.community/token
server_error: Exception [EclipseLink-4002] (Eclipse Persistence Services - 2.5.1.v20130918-f2b9fc5): org.eclipse.persistence.exceptions.DatabaseException
Internal Exception: com.mysql.cj.jdbc.exceptions.MysqlDataTruncation: Data truncation: Data too long for column &#39;value&#39; at row 1
Error Code: 1406
Call: INSERT INTO launch_context (name, value) VALUES (?, ?)
```

This is just a bug with using Meld and not something we can fix; it is because the `appContext` string is too long.

2. Bilirubin Risk Chart - launches for (7) and (9) without needing to modify any of the supported CDS Hooks. However, for (9) above, there will be a 500 error in the DevTools console, unless you modify the `appContext` as mentioned above.
3. CDS Hooks Sandbox - launches for (7) and (9) without needing to modify any of the supported CDS Hooks. However, you will run into 500 and 404 errors for (9) above if you do not modify the `appContext` above. Note that the order-select hook won't return any cards, but the patient-view hook does.
4. Cuestionario - launches without needing to modify any of the supported CDS Hooks. However, you probably won't be able to search for a "Task Number" without knowing one beforehand. Seems to work for both (7) and (9) above.
5. My Web App - Not launchable for (7) and (9). The ISS supplied for `REACT_APP_EHR_BASE` from the Meld sandbox seems to be incorrect.
6. Recetario - It launches for both (7) and (9), but you will be stuck on the "Logging in..." page.
7. REMS Smart App - It is launchable for (7). You will be redirected to the register page. The ISS will be filled in and you will need to populate the Client Id field with the value from Apps > RENS Smart on FHIR > Settings > Registered App Details > Client Id. Click Authorize. You should be able to send CDS hooks as normal. For (9), you will run into a few 500 errors- one is related to a token and the other is related to the launch context. Modifying the `appContext` as mentioned above will let you launch, but the CDS hooks' requests and responses will not appear in the Network tab.
