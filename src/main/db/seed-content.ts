import type { SectionKey } from '../../shared/types'

// ============================================================================
// The MCAT content outline, seeded once into `content_topics`.
// Organized by section -> subject -> topics. This mirrors the AAMC outline at
// a study-tracking granularity (foundational concept / high-yield topic level).
// ============================================================================

export interface SeedTopic {
  section: SectionKey
  subject: string
  name: string
}

interface SubjectBlock {
  section: SectionKey
  subject: string
  topics: string[]
}

const BLOCKS: SubjectBlock[] = [
  // ---- Biological & Biochemical Foundations (B/B) ----
  {
    section: 'bb',
    subject: 'Biology',
    topics: [
      'Cell theory & cell structure',
      'Membranes & transport',
      'The cell cycle & mitosis',
      'Meiosis & genetic variability',
      'Mendelian genetics & inheritance',
      'Eukaryotic chromosome organization',
      'Gene expression & regulation',
      'Microbiology: viruses & prokaryotes',
      'Nervous system',
      'Endocrine system',
      'Circulatory system',
      'Respiratory system',
      'Digestive system',
      'Renal system',
      'Immune system',
      'Reproductive system & development',
      'Musculoskeletal system',
      'Skin & homeostasis'
    ]
  },
  {
    section: 'bb',
    subject: 'Biochemistry',
    topics: [
      'Amino acids & peptide bonds',
      'Protein structure (1°–4°)',
      'Protein folding & denaturation',
      'Enzyme kinetics (Michaelis–Menten)',
      'Enzyme regulation & inhibition',
      'Carbohydrate structure',
      'Glycolysis',
      'Gluconeogenesis & glycogen metabolism',
      'Citric acid cycle',
      'Oxidative phosphorylation & ETC',
      'Pentose phosphate pathway',
      'Fatty acid & lipid metabolism',
      'Amino acid metabolism',
      'Lipids & membranes',
      'Nucleotide & nucleic acid biochemistry',
      'Bioenergetics & thermodynamics'
    ]
  },
  {
    section: 'bb',
    subject: 'Organic Chemistry',
    topics: [
      'Nomenclature & functional groups',
      'Stereochemistry & isomerism',
      'Spectroscopy (IR, NMR, MS)',
      'Separations & purification',
      'Aldehydes & ketones',
      'Carboxylic acids & derivatives',
      'Alcohols & substitution/elimination'
    ]
  },
  // ---- Chemical & Physical Foundations (C/P) ----
  {
    section: 'cp',
    subject: 'General Chemistry',
    topics: [
      'Atomic structure & periodic trends',
      'Bonding & molecular structure',
      'Stoichiometry & reactions',
      'Gases (ideal & kinetic theory)',
      'Solutions & solubility',
      'Acids & bases / titrations',
      'Buffers & equilibrium',
      'Thermochemistry',
      'Kinetics',
      'Electrochemistry'
    ]
  },
  {
    section: 'cp',
    subject: 'Physics',
    topics: [
      'Kinematics',
      'Forces & Newtonian mechanics',
      'Work, energy & power',
      'Momentum & collisions',
      'Fluids & hydrostatics',
      'Thermodynamics',
      'Electrostatics & circuits',
      'Magnetism',
      'Waves & periodic motion',
      'Sound',
      'Light & geometric optics',
      'Atomic & nuclear phenomena'
    ]
  },
  {
    section: 'cp',
    subject: 'Organic & Biochem (C/P context)',
    topics: [
      'Bonding & intermolecular forces',
      'Lab techniques & spectroscopy',
      'Enzyme & metabolism applications'
    ]
  },
  // ---- CARS ----
  {
    section: 'cars',
    subject: 'Critical Analysis & Reasoning',
    topics: [
      'Main idea & author tone',
      'Inference & implication questions',
      'Reasoning beyond the text (application)',
      'Strengthen / weaken arguments',
      'Passage mapping & active reading',
      'Humanities passage strategy',
      'Social sciences passage strategy',
      'Timing & pacing'
    ]
  },
  // ---- Psychological, Social & Biological Foundations (P/S) ----
  {
    section: 'ps',
    subject: 'Psychology',
    topics: [
      'Sensation & perception',
      'Learning & conditioning',
      'Memory & cognition',
      'Consciousness & sleep',
      'Motivation & emotion',
      'Personality theories',
      'Psychological disorders',
      'Attitudes & behavior',
      'Identity & self-concept',
      'Biological bases of behavior'
    ]
  },
  {
    section: 'ps',
    subject: 'Sociology',
    topics: [
      'Social structures & institutions',
      'Demographics & population',
      'Social stratification & inequality',
      'Culture & socialization',
      'Social interaction & groups',
      'Theoretical approaches (functionalism, conflict, etc.)',
      'Healthcare disparities & access'
    ]
  },
  {
    section: 'ps',
    subject: 'Biology (P/S context)',
    topics: ['Neurons & neurotransmission', 'Brain anatomy & function', 'The endocrine–behavior link']
  }
]

export const SEED_TOPICS: SeedTopic[] = BLOCKS.flatMap((b) =>
  b.topics.map((name) => ({ section: b.section, subject: b.subject, name }))
)
