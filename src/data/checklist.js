// Structured checklist data transcribed from the hospital's
// Pre-Employment Medical Examination Report.

export const medicalHistoryColumns = [
  {
    heading: 'General & Chronic',
    items: [
      { id: 'mh_nose_throat', label: 'Nose or Throat trouble' },
      { id: 'mh_ear', label: 'Ear troubles / Deafness' },
      { id: 'mh_asthma', label: 'Asthma' },
      { id: 'mh_tb', label: 'Tuberculosis' },
      { id: 'mh_lung', label: 'Other Lung Disease' },
      { id: 'mh_hpn', label: 'High Blood Pressure' },
      { id: 'mh_heart', label: 'Heart disease' },
      { id: 'mh_rheumatic_fever', label: 'Rheumatic Fever' },
      { id: 'mh_diabetes', label: 'Diabetes Mellitus' },
      { id: 'mh_endocrine', label: 'Endocrine Disease' },
    ],
  },
  {
    heading: 'Injuries & Systemic',
    items: [
      { id: 'mh_head_neck_injury', label: 'Head / Neck Injury' },
      { id: 'mh_hernia', label: 'Hernia' },
      { id: 'mh_rheumatism', label: 'Rheumatism' },
      { id: 'mh_typhoid', label: 'Typhoid Fever' },
      { id: 'mh_visual', label: 'Visual disorders' },
      { id: 'mh_ulcer', label: 'Ulcer / Abdominal Pain' },
      { id: 'mh_kidney', label: 'Kidney / Bladder Problem' },
      { id: 'mh_std', label: 'Sexually Transmitted Disease' },
    ],
  },
  {
    heading: 'Other Conditions',
    items: [
      { id: 'mh_genetic', label: 'Genetic / Familial Disorder' },
      { id: 'mh_malaria', label: 'Malaria (specify date if yes)' },
      { id: 'mh_surgical', label: 'Surgical Operations' },
      { id: 'mh_tropical', label: 'Tropical Diseases' },
      { id: 'mh_chronic_cough', label: 'Chronic Cough' },
      { id: 'mh_epilepsy', label: 'Epilepsy / Seizure Disorders' },
      { id: 'mh_headaches', label: 'Frequent Headaches' },
      { id: 'mh_dizzy', label: 'Dizzy Spells' },
      { id: 'mh_drug', label: 'Drug Usage / Dependence' },
    ],
  },
]

// Personal & Social History, shown as its own column inside the
// Medical History section.
export const personalSocialHistoryColumns = [
  {
    heading: 'Personal / Social History',
    items: [
      { id: 'ph_smoker', label: 'Smoker (cigarette / vape)' },
      { id: 'ph_alcohol', label: 'Alcohol Drinker' },
      { id: 'ph_illicit_drug', label: 'Illicit Drug User' },
      { id: 'ph_exercise', label: 'Regular Exercise' },
      { id: 'ph_family_history', label: 'Family History of Illness' },
      { id: 'ph_prior_employment_injury', label: 'Prior Work-Related Injury' },
      { id: 'ph_current_medication', label: 'Currently Taking Medication' },
      { id: 'ph_allergy', label: 'Known Allergies' },
    ],
  },
]

export const physicalExamColumns = [
  {
    heading: 'General',
    items: [
      { id: 'pe_skin', label: 'Skin' },
      { id: 'pe_head_neck_scalp', label: 'Head, Neck, Scalp' },
      { id: 'pe_eyes_pupils', label: 'Eyes / Pupils' },
      { id: 'pe_ears', label: 'Ears' },
      { id: 'pe_nose_sinuses', label: 'Nose / Sinuses' },
      { id: 'pe_mouth_throat', label: 'Mouth / Throat' },
      { id: 'pe_neck_ln_thyroid', label: 'Neck, LN, Thyroid' },
      { id: 'pe_lungs', label: 'Lungs' },
      { id: 'pe_chest_breast_axilla', label: 'Chest, Breast, Axilla' },
      { id: 'pe_heart', label: 'Heart' },
    ],
  },
  {
    heading: 'Systemic',
    items: [
      { id: 'pe_abdomen', label: 'Abdomen' },
      { id: 'pe_back_chest', label: 'Back, Chest' },
      { id: 'pe_anus_rectum', label: 'Anus, Rectum' },
      { id: 'pe_gu_system', label: 'G-U System' },
      { id: 'pe_reflexes', label: 'Reflexes' },
      { id: 'pe_extremities', label: 'Extremities' },
    ],
  },
]

export const xrayLabItems = [
  { id: 'lab_chest_xray', label: 'Chest X-Ray' },
  { id: 'lab_ecg', label: 'ECG 12-Lead' },
  { id: 'lab_cbc', label: 'Complete Blood Count' },
  { id: 'lab_urinalysis', label: 'Routine Urinalysis' },
  { id: 'lab_fecalysis', label: 'Routine Fecalysis' },
  { id: 'lab_others', label: 'Others' },
]

export const screeningTests = [
  { id: 'test_hav_igm', label: 'Anti-HAV IgM' },
  { id: 'test_hbsag', label: 'Hepatitis B sAg' },
  { id: 'test_preg', label: 'Pregnancy Test' },
  { id: 'test_aids', label: 'AIDS Test' },
  { id: 'test_bdrug', label: 'B-Drug Test' },
]

// Disposition categories requested for the pre-employment result.
// Limited to the four employability classes used by the clinic.
export const dispositionCategories = [
  {
    id: 'class_a',
    shortLabel: 'Class A',
    label: 'Class A: Fit to Work W/O Restriction',
    description: 'No findings that would prevent employment.',
  },
  {
    id: 'class_b',
    shortLabel: 'Class B',
    label: 'Class B: Fit to Work W/ Minor Defect',
    description: 'Cleared for work with a minor, non-limiting defect.',
    requiresNote: true,
    noteLabel: 'Minor defect details',
  },
  {
    id: 'class_c',
    shortLabel: 'Class C',
    label: 'Class C: Employable but W/ Significant Conditions that May Interfere w/ Work',
    description: 'Employable, but significant conditions may affect duties.',
    requiresNote: true,
    noteLabel: 'Significant condition(s)',
  },
  {
    id: 'class_d',
    shortLabel: 'Class D',
    label: 'Class D: Unfit',
    description: 'Medical findings are disqualifying for this role.',
    requiresNote: true,
    noteLabel: 'Reason',
  },
]
