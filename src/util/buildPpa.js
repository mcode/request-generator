import { v4 as uuidv4 } from 'uuid';
import { getDrugCodeableConceptFromMedicationRequest } from './fhir';

const quantityUnitOfMeasureFromDrugFormCode = dispenseRequest => {
  const code = dispenseRequest?.quantity?.code?.toUpperCase();
  switch (code) {
    case 'CAP':
      return 'C48480';
    case 'ORTROCHE':
      return 'C48506';
    case 'TAB':
      return 'C48542';
    default:
      return 'C38046';
  }
};

const normalizeNdcForNcpdp = value => {
  if (!value) return value;

  const raw = String(value).trim();
  const segments = raw.split('-').map(segment => segment.replace(/\D/g, ''));

  if (segments.length === 3) {
    const [labeler, product, packageCode] = segments;
    if (labeler.length === 4 && product.length === 4 && packageCode.length === 2) {
      return `${labeler.padStart(5, '0')}${product}${packageCode}`;
    }
    if (labeler.length === 5 && product.length === 3 && packageCode.length === 2) {
      return `${labeler}${product.padStart(4, '0')}${packageCode}`;
    }
    if (labeler.length === 5 && product.length === 4 && packageCode.length === 1) {
      return `${labeler}${product}${packageCode.padStart(2, '0')}`;
    }
  }

  return raw.replace(/\D/g, '');
};

export const getMedicationCodings = medicationRequest =>
  getDrugCodeableConceptFromMedicationRequest(medicationRequest)?.coding ?? [];

export const getNdcCoding = medicationRequest =>
  getMedicationCodings(medicationRequest).find(coding =>
    coding?.system?.toLowerCase().endsWith('/ndc')
  );

export const getRxNormCoding = medicationRequest =>
  getMedicationCodings(medicationRequest).find(coding =>
    coding?.system?.toLowerCase().includes('rxnorm')
  );

export const getMedicationDisplay = medicationRequest =>
  getMedicationCodings(medicationRequest).find(coding => coding?.display)?.display ||
  medicationRequest?.medicationReference?.display ||
  'Medication';

export const buildPpaRequest = ({
  patient,
  practitioner,
  medicationRequest,
  pharmacy,
  substitutionAllowed,
  patientPreferenceState,
  patientPreferencePostalCode,
  overrideProduct
}) => {
  const ndcCoding = overrideProduct?.ndc
    ? { code: overrideProduct.ndc, display: overrideProduct.display }
    : getNdcCoding(medicationRequest);
  const rxNormCoding = getRxNormCoding(medicationRequest);
  const dispenseRequest = medicationRequest?.dispenseRequest;
  const quantityValue = String(dispenseRequest?.quantity?.value || 1);
  const display = overrideProduct?.display || ndcCoding?.display || getMedicationDisplay(medicationRequest);
  const practitionerId = practitioner?.identifier?.find(identifier =>
    identifier?.system?.includes('us-npi')
  )?.value;

  return {
    Message: {
      '@TransactionDomain': 'PPA',
      '@TransactionVersion': '2.0',
      Header: {
        To: pharmacy.id,
        From: practitionerId || practitioner?.id || 'RequestGenerator',
        MessageID: uuidv4(),
        SentTime: new Date().toISOString(),
        SenderSoftware: {
          SenderSoftwareDeveloper: 'REMS Prototype',
          SenderSoftwareProduct: 'Request Generator',
          SenderSoftwareVersionRelease: '1',
          SenderSoftwareOperator: 'EHR'
        }
      },
      Body: {
        PPARequest: {
          MedicationPrescribed: {
            DrugDescription: display,
            Product: {
              DrugCoded: {
                NDC: normalizeNdcForNcpdp(ndcCoding?.code),
                ProductCode: rxNormCoding
                  ? {
                      Code: rxNormCoding.code,
                      Qualifier: 'RXNORM'
                    }
                  : undefined
              }
            },
            Quantity: {
              QuantityValue: quantityValue,
              QuantityCodeListQualifier: '38',
              QuantityUnitOfMeasure: {
                Code: quantityUnitOfMeasureFromDrugFormCode(dispenseRequest)
              }
            },
            Substitution: substitutionAllowed ? '0' : '1'
          },
          PatientPreference: {
            StateProvince:
              patientPreferenceState ||
              patient?.address?.[0]?.state ||
              'MA',
            PostalCode: patientPreferencePostalCode || patient?.address?.[0]?.postalCode || undefined
          }
        }
      }
    }
  };
};

export const getSelectedProductFromPpaResponse = (ppaResponse, requestedProduct) => {
  const body = (ppaResponse?.Message || ppaResponse?.MessageType)?.Body;
  const approved = body?.PPAResponse?.Response?.Approved;
  const denied = body?.PPAResponse?.Response?.Denied;
  const response = approved || denied;
  const extension = Array.isArray(response?.Extension)
    ? response.Extension.find(item => item.URL?.includes('selected-product'))
    : null;

  return {
    approved: Boolean(approved),
    reasonCode: response?.ReasonCode || body?.Error?.TransactionErrorCode,
    selectedProduct: {
      ndc: extension?.NDC || requestedProduct?.ndc,
      display: extension?.DrugDescription || requestedProduct?.display,
      pharmacyId: extension?.PharmacyID || requestedProduct?.pharmacyId,
      pharmacyName: extension?.PharmacyName || requestedProduct?.pharmacyName,
      remsAdminHint: extension?.REMSAdminHint
    },
    raw: ppaResponse
  };
};

export const applySelectedProductToMedicationRequest = (medicationRequest, selectedProduct) => {
  if (!selectedProduct?.ndc) return medicationRequest;

  const originalCodings = getMedicationCodings(medicationRequest);
  const nonNdcCodings = originalCodings.filter(
    coding => !coding?.system?.toLowerCase().endsWith('/ndc')
  );

  return {
    ...medicationRequest,
    medicationReference: undefined,
    medicationCodeableConcept: {
      coding: [
        {
          system: 'http://hl7.org/fhir/sid/ndc',
          code: selectedProduct.ndc,
          display: selectedProduct.display
        },
        ...nonNdcCodings
      ],
      text: selectedProduct.display
    }
  };
};
