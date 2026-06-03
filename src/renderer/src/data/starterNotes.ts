import type { NoteInput, SectionKey } from '@shared/types'

// Pre-loaded quick-reference sheets the user can add with one click.
export const STARTER_NOTES: Array<NoteInput & { section: SectionKey }> = [
  {
    title: 'Physics Equations Cheat Sheet',
    section: 'cp',
    topic: 'Physics',
    resource: null,
    pinned: true,
    tags: ['reference', 'formulas'],
    body: `# Core Physics Equations

## Kinematics
- v = v₀ + at
- x = x₀ + v₀t + ½at²
- v² = v₀² + 2a(x − x₀)

## Forces & Energy
- F = ma
- W = F·d·cosθ
- KE = ½mv²  ·  PE = mgh
- P = W/t = Fv

## Fluids
- P = ρgh  ·  continuity: A₁v₁ = A₂v₂
- Bernoulli: P + ½ρv² + ρgh = const

## Electricity
- V = IR  ·  P = IV = I²R
- Coulomb: F = kq₁q₂/r²`
  },
  {
    title: 'Biochem Pathways Map',
    section: 'bb',
    topic: 'Biochemistry',
    resource: null,
    pinned: true,
    tags: ['reference', 'metabolism'],
    body: `# Metabolism Quick Map

**Glycolysis** (cytoplasm): Glucose → 2 Pyruvate · net 2 ATP, 2 NADH
- Rate-limiting: PFK-1

**Pyruvate → Acetyl-CoA** (PDH, mitochondria)

**Citric Acid Cycle**: per acetyl-CoA → 3 NADH, 1 FADH₂, 1 GTP
- Rate-limiting: isocitrate dehydrogenase

**Oxidative Phosphorylation**: ETC + ATP synthase → ~32 ATP/glucose

**Storage/Mobilization**: Glycogenesis ↔ Glycogenolysis · Gluconeogenesis (liver)`
  },
  {
    title: 'Psych/Soc Theories',
    section: 'ps',
    topic: 'Psychology',
    resource: null,
    pinned: false,
    tags: ['reference', 'theories'],
    body: `# High-Yield Theories

## Development
- Piaget: sensorimotor → preoperational → concrete → formal
- Erikson: 8 psychosocial stages (trust vs mistrust, …)
- Kohlberg: pre-conventional → conventional → post-conventional

## Sociology
- Functionalism · Conflict theory · Symbolic interactionism
- Social Stratification: class, status, power (Weber)

## Memory
- Sensory → Short-term (7±2) → Long-term
- Encoding: elaborative > maintenance rehearsal`
  },
  {
    title: 'CARS Strategy Reminders',
    section: 'cars',
    topic: 'Passage mapping & active reading',
    resource: null,
    pinned: false,
    tags: ['reference', 'strategy'],
    body: `# CARS Playbook

1. Read for **structure & tone**, not memorization.
2. After each paragraph, summarize its purpose in 3–5 words.
3. Answer in the author's voice — avoid outside knowledge.
4. Eliminate extremes ("always", "never") unless supported.
5. Pace: ~10 min/passage. Don't fall behind on one.`
  }
]
