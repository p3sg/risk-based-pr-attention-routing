import type { Tier } from '@p3sg/pr-attention-router';

export type RiskTier = Tier;

export interface TierDefinition {
  readonly tier: RiskTier;
  readonly label: string;
  readonly routing: string;
  readonly guidance: string;
}

export const tierDefinitions: readonly TierDefinition[] = [
  {
    tier: 'LOW',
    label: 'Focused change',
    routing: 'Team merge eligible',
    guidance:
      'Any authorized team member may merge without separate review after required checks, repository protections, and policy authorization pass.',
  },
  {
    tier: 'MEDIUM',
    label: 'Shared surface',
    routing: 'Developer familiar with the affected area',
    guidance: 'Standard developer review is required.',
  },
  {
    tier: 'HIGH',
    label: 'Sensitive change',
    routing: 'Tech Lead or relevant SME',
    guidance: 'Tech Lead or SME review is required.',
  },
] as const;
