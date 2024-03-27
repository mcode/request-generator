import React from 'react';
import './smart.css';
import env from 'env-var';

const EHRLaunchBox = () => {
  return (
    <div>
      <div className="header">EHR Launch Settings</div>
      <div>
        <label className="ehr-setting">Select EHR: </label>
        <select>
          <option value={env.get('VITE_EHR_LINK').asString()}>Local</option>
        </select>
        <div className="ehr-setting">
          Note: Only the local EHR is supported at this time for EHR launch
        </div>
        <label className="ehr-setting">Username:</label>
        <input></input>

        <label className="ehr-setting">Password:</label>
        <input type="password"></input>
      </div>
    </div>
  );
};

export default EHRLaunchBox;
