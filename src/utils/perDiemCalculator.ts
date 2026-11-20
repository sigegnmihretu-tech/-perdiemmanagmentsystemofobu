import { StaffTier, DestinationTier, TransportMode, PerDiemBreakdown } from '../types/perdiem';

export const STAFF_RATES: Record<StaffTier, { label: string; dailyMeal: number; lodging: number }> = {
  SENIOR_ACADEMIC: {
    label: 'Senior Academic / Dean / Professor',
    dailyMeal: 1200,
    lodging: 1800,
  },
  LECTURER_RESEARCHER: {
    label: 'Lecturer / Researcher',
    dailyMeal: 900,
    lodging: 1400,
  },
  ADMIN_SUPPORT: {
    label: 'Administrative & Support Staff',
    dailyMeal: 600,
    lodging: 1000,
  },
};

export const DESTINATION_TIERS: Record<DestinationTier, { label: string; multiplier: number; example: string }> = {
  CAPITAL: {
    label: 'Category 1: Federal Capital (Addis Ababa)',
    multiplier: 1.25,
    example: 'Addis Ababa (Higher living & lodging cost index)',
  },
  REGIONAL_CITY: {
    label: 'Category 2: Regional Cities / Zones',
    multiplier: 1.0,
    example: 'Chiro, Adama, Dire Dawa, Harar, Hawassa',
  },
  REMOTE_WOREDA: {
    label: 'Category 3: Field / Remote Research Sites',
    multiplier: 1.15,
    example: 'Rural Woredas, Agricultural Research Stations (Hardship allowance)',
  },
};

export const TRANSPORT_ALLOWANCE: Record<TransportMode, { label: string; allowance: number }> = {
  UNIVERSITY_VEHICLE: {
    label: 'University Vehicle (Official Fleet)',
    allowance: 0,
  },
  PUBLIC_TRANSPORT: {
    label: 'Public Intercity Bus / Minibus',
    allowance: 600,
  },
  FLIGHT: {
    label: 'Domestic Flight (Shuttle/Transit Allowance)',
    allowance: 350,
  },
  PERSONAL_CAR: {
    label: 'Personal Car (Approved Fuel Reimbursement)',
    allowance: 1200,
  },
};

export function calculatePerDiem(
  staffTier: StaffTier,
  destinationTier: DestinationTier,
  transportMode: TransportMode,
  days: number
): PerDiemBreakdown {
  const safeDays = Math.max(1, days);
  const tierConfig = STAFF_RATES[staffTier] || STAFF_RATES.LECTURER_RESEARCHER;
  const destConfig = DESTINATION_TIERS[destinationTier] || DESTINATION_TIERS.REGIONAL_CITY;
  const transportConfig = TRANSPORT_ALLOWANCE[transportMode] || TRANSPORT_ALLOWANCE.PUBLIC_TRANSPORT;

  const baseDailyRate = tierConfig.dailyMeal + tierConfig.lodging;
  const incidentalsPerDay = 200; // Communication, supplies, minor transit

  const dailyMealAdjusted = Math.round(tierConfig.dailyMeal * destConfig.multiplier);
  const lodgingAdjusted = Math.round(tierConfig.lodging * destConfig.multiplier);
  const totalDaily = dailyMealAdjusted + lodgingAdjusted;

  const subtotalAllowance = totalDaily * safeDays;
  const totalIncidentals = incidentalsPerDay * safeDays;
  const transportAllowance = transportConfig.allowance;

  const totalPerDiem = subtotalAllowance + totalIncidentals + transportAllowance;

  return {
    days: safeDays,
    dailyAllowanceRate: dailyMealAdjusted,
    lodgingAllowanceRate: lodgingAdjusted,
    transportAllowance,
    incidentals: totalIncidentals,
    totalDaily,
    subtotalAllowance,
    destinationMultiplier: destConfig.multiplier,
    totalPerDiem,
    currency: 'ETB',
  };
}

export function formatCurrency(amount: number, currency: string = 'ETB'): string {
  return `${amount.toLocaleString()} ${currency}`;
}
