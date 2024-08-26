import { headerDefinitions, medicationRequestToRemsAdmins, ORDER_SIGN } from '../../util/data';
import { v4 as uuidv4 } from 'uuid';

export const actionTypes = Object.freeze({
  updatePatient: 'update_patient', // {type, value}
  updateSetting: 'update_setting', // {type, settingId, value}
  flagStartup: 'flag_startup', // {type}
  deleteCdsHookSetting: 'DELETE_CDS_HOOK_SETTING', // {type, settingId}
  addCdsHookSetting: 'ADD_CDS_HOOK_SETTING', // {type}
  updateCdsHookSetting: 'UPDATE_CDS_HOOK_SETTING', // {type, settingId, value}
  resetSettings: 'RESET_SETTINGS' // {type}
});

const getNewStateWithoutCdsHookSetting = (state, settingId) => {
  const newState = { ...state, medicationRequestToRemsAdmins: {} };
  for (const key of Object.keys(state.medicationRequestToRemsAdmins)) {
    if (key !== settingId) {
      newState.medicationRequestToRemsAdmins[key] = state.medicationRequestToRemsAdmins[key];
    }
  }
  return newState;
};

const getNewStateWithNewCdsHookSetting = (state, settingId) => {
  const original = Object.entries(state.medicationRequestToRemsAdmins);
  const indexOfSiblingToInsertBelow = original.findIndex(([key, _value]) => key === settingId);
  const firstHalf =
    indexOfSiblingToInsertBelow === 0
      ? [original[0]]
      : original.slice(0, indexOfSiblingToInsertBelow + 1);
  const secondHalf =
    indexOfSiblingToInsertBelow === 0
      ? original.slice(indexOfSiblingToInsertBelow)
      : original.slice(indexOfSiblingToInsertBelow - 1);

  const newState = { ...state, medicationRequestToRemsAdmins: {} };

  for (const pair of firstHalf) {
    const [key, value] = pair;
    newState.medicationRequestToRemsAdmins[key] = value;
  }

  newState.medicationRequestToRemsAdmins[uuidv4()] = {
    rxnorm: 'Fill out Medication RxNorm Code',
    display: 'Fill out Medication Display Name',
    endpointType: ORDER_SIGN,
    remsAdmin: 'REMS Admin URL for CDS Hook'
  };

  for (const pair of secondHalf) {
    const [key, value] = pair;
    newState.medicationRequestToRemsAdmins[key] = value;
  }

  return newState;
};

// todo: add an enum that defines possible settings
export const reducer = (state, action) => {
  switch (action.type) {
    case actionTypes.deleteCdsHookSetting:
      return getNewStateWithoutCdsHookSetting(state, action.settingId);
    case actionTypes.addCdsHookSetting:
      return getNewStateWithNewCdsHookSetting(state, action.settingId);
    case actionTypes.updateCdsHookSetting:
      return {
        ...state,
        medicationRequestToRemsAdmins: {
          ...state.medicationRequestToRemsAdmins,
          [action.settingId]: {
            ...state.medicationRequestToRemsAdmins[action.settingId],
            ...action.value
          }
        }
      };
    case actionTypes.resetSettings:
      return { ...initialState, startup: true };
    case actionTypes.updateSetting:
      return {
        ...state,
        [action.settingId]: action.value
      };
    case actionTypes.updatePatient:
      return {
        ...state,
        patient: action.value
      };
    case actionTypes.flagStartup:
      return {
        ...state,
        startup: true
      };
    default:
      return state;
  }
};

export const initialState = (() => {
  let state = {
    patient: null,
    startup: false,
    redirect: '',
    medicationRequestToRemsAdmins: {}
  };

  Object.keys(headerDefinitions).forEach(key => {
    state[key] = headerDefinitions[key].default;
  });

  medicationRequestToRemsAdmins.forEach(row => {
    const { rxnorm, display, endpoints } = row;
    endpoints.forEach(({ endpointType, remsAdmin }) => {
      const key = `${rxnorm}_${endpointType}`;
      state.medicationRequestToRemsAdmins[key] = { rxnorm, display, endpointType, remsAdmin };
    });
  });
  return state;
})();
