import { DomainCategory, SubDomain } from './types';

export interface PredefinedPS {
  ps_code: string;
  domain: DomainCategory;
  sub_domain: SubDomain | null;
}

// Exactly 30 PS Codes as mandated by Ideathon VVCE specifications
export const INITIAL_PROBLEM_STATEMENTS: PredefinedPS[] = [
  // DOMAIN 1: CSE / AIML (15 Codes)
  { ps_code: 'CS-01', domain: 'CSE_AIML', sub_domain: null },
  { ps_code: 'CS-02', domain: 'CSE_AIML', sub_domain: null },
  { ps_code: 'CS-03', domain: 'CSE_AIML', sub_domain: null },
  { ps_code: 'CS-04', domain: 'CSE_AIML', sub_domain: null },
  { ps_code: 'CS-05', domain: 'CSE_AIML', sub_domain: null },
  { ps_code: 'CS-06', domain: 'CSE_AIML', sub_domain: null },
  { ps_code: 'CS-07', domain: 'CSE_AIML', sub_domain: null },
  { ps_code: 'CS-08', domain: 'CSE_AIML', sub_domain: null },
  { ps_code: 'CS-09', domain: 'CSE_AIML', sub_domain: null },
  { ps_code: 'CS-10', domain: 'CSE_AIML', sub_domain: null },
  { ps_code: 'CS-11', domain: 'CSE_AIML', sub_domain: null },
  { ps_code: 'CS-12', domain: 'CSE_AIML', sub_domain: null },
  { ps_code: 'CS-13', domain: 'CSE_AIML', sub_domain: null },
  { ps_code: 'CS-14', domain: 'CSE_AIML', sub_domain: null },
  { ps_code: 'CS-15', domain: 'CSE_AIML', sub_domain: null },

  // DOMAIN 2: ELECTRONICS AND COMMUNICATION (10 Codes)
  { ps_code: 'EC-01', domain: 'ECE', sub_domain: null },
  { ps_code: 'EC-02', domain: 'ECE', sub_domain: null },
  { ps_code: 'EC-03', domain: 'ECE', sub_domain: null },
  { ps_code: 'EC-04', domain: 'ECE', sub_domain: null },
  { ps_code: 'EC-05', domain: 'ECE', sub_domain: null },
  { ps_code: 'EC-06', domain: 'ECE', sub_domain: null },
  { ps_code: 'EC-07', domain: 'ECE', sub_domain: null },
  { ps_code: 'EC-08', domain: 'ECE', sub_domain: null },
  { ps_code: 'EC-09', domain: 'ECE', sub_domain: null },
  { ps_code: 'EC-10', domain: 'ECE', sub_domain: null },

  // DOMAIN 3: MECHANICAL AND CIVIL (5 Codes total)
  // Mechanical Subcategory (3 Codes)
  { ps_code: 'ME-01', domain: 'MECH_CIVIL', sub_domain: 'MECHANICAL' },
  { ps_code: 'ME-02', domain: 'MECH_CIVIL', sub_domain: 'MECHANICAL' },
  { ps_code: 'ME-03', domain: 'MECH_CIVIL', sub_domain: 'MECHANICAL' },

  // Civil Subcategory (2 Codes)
  { ps_code: 'CE-01', domain: 'MECH_CIVIL', sub_domain: 'CIVIL' },
  { ps_code: 'CE-02', domain: 'MECH_CIVIL', sub_domain: 'CIVIL' },
];

export const DOMAIN_METADATA = {
  CSE_AIML: {
    id: 'CSE_AIML',
    name: 'CSE / AIML',
    shortName: 'CSE & AI/ML',
    description: 'Computer Science, Artificial Intelligence, Machine Learning & Software Systems',
    totalCodes: 15,
    badge: '15 Problem Statements',
  },
  ECE: {
    id: 'ECE',
    name: 'Electronics and Communication',
    shortName: 'ECE',
    description: 'Embedded Systems, IoT, Signal Processing, Robotics & Hardware Innovation',
    totalCodes: 10,
    badge: '10 Problem Statements',
  },
  MECH_CIVIL: {
    id: 'MECH_CIVIL',
    name: 'Mechanical and Civil',
    shortName: 'Mech & Civil',
    description: 'Smart Infrastructure, Sustainable Engineering, Automation & Structural Design',
    totalCodes: 5,
    badge: '5 Problem Statements (3 Mech + 2 Civil)',
  },
} as const;

