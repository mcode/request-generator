import env from 'env-var';

const defaultEquivalents = [
  {
    baseNdc: '65597-407-20',
    ndc: '99999-407-20',
    display: 'Pexidartinib Hydrochloride 200 MG Oral Capsule',
    medicationRequestIdTemplate: '{patientId}-mr-pexidartinib-generic',
    medicationId: 'med-pexidartinib-generic'
  }
];

const defaultProductMappings = [
  {
    ndc: '65597-407-20',
    display: 'Turalio 200 MG Oral Capsule',
    medicationRequestIdTemplate: '{patientId}-mr-turalio',
    medicationId: 'med-turalio'
  },
  {
    ndc: '99999-407-20',
    display: 'Pexidartinib Hydrochloride 200 MG Oral Capsule',
    medicationRequestIdTemplate: '{patientId}-mr-pexidartinib-generic',
    medicationId: 'med-pexidartinib-generic'
  }
];

const normalizeNdc = value => {
  if (!value) return '';

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

const parseEquivalentOverrides = () => {
  try {
    const parsed = JSON.parse(env.get('VITE_PPA_GENERIC_CANDIDATES').asString() || '');
    return Array.isArray(parsed) ? parsed : defaultEquivalents;
  } catch {
    return defaultEquivalents;
  }
};

const equivalents = parseEquivalentOverrides();
const productMappings = [...defaultProductMappings, ...equivalents];

export const getEquivalentPpaCandidates = baseNdc =>
  equivalents
    .filter(candidate => normalizeNdc(candidate.baseNdc) === normalizeNdc(baseNdc))
    .map(candidate => ({
      ndc: candidate.ndc,
      display: candidate.display,
      medicationRequestId: candidate.medicationRequestId,
      medicationRequestIdTemplate: candidate.medicationRequestIdTemplate,
      medicationId: candidate.medicationId
    }))
    .filter(candidate => candidate.ndc);

export const getPpaProductConfigByNdc = ndc =>
  productMappings.find(candidate => normalizeNdc(candidate.ndc) === normalizeNdc(ndc));
