function fhir(resource, ehrUrl, patient, auth) {
  const headers = {
    'Content-Type': 'application/json'
  };
  if (patient) {
    fetch(`${ehrUrl}${resource}?subject=Patient/${patient}`, {
      method: 'GET',
      headers: headers
    })
      .then(response => {
        return response.json();
      })
      .then(json => {
        console.log(json);
      });
  }
}

function getAge(dateString) {
  var today = new Date();
  var birthDate = new Date(dateString);
  var age = today.getFullYear() - birthDate.getFullYear();
  var m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/*
* Retrieve the CodeableConcept for the medication from the medicationCodeableConcept if available.
* Read CodeableConcept from contained Medication matching the medicationReference otherwise.
*/
function getDrugCodeableConceptFromMedicationRequest(medicationRequest) {
  if (medicationRequest) {
    if (medicationRequest?.medicationCodeableConcept) {
      console.log('Get Medication code from CodeableConcept');
      return medicationRequest?.medicationCodeableConcept;
    } else if (medicationRequest?.medicationReference) {
      const reference = medicationRequest?.medicationReference;
      let coding = undefined;
      medicationRequest?.contained?.every(e => {
        if (e.resourceType + '/' + e.id === reference.reference) {
          if (e.resourceType === 'Medication') {
            console.log('Get Medication code from contained resource');
            coding = e.code;
          }
        }
      });
      return coding; 
    }
  }
  return undefined;
 }
 
 /*
 * Retrieve the coding for the medication from the medicationCodeableConcept if available.
 * Read coding from contained Medication matching the medicationReference otherwise.
 */
function getDrugCodeFromMedicationRequest(medicationRequest) {
  const codeableConcept = getDrugCodeableConceptFromMedicationRequest(medicationRequest);
  return codeableConcept?.coding?.[0];
 }

export { fhir, getAge, getDrugCodeableConceptFromMedicationRequest, getDrugCodeFromMedicationRequest };
