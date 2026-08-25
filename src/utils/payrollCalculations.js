// src/utils/payrollCalculations.js
//
// All statutory rates and overtime multipliers live here, in one place.
// When SHA / NSSF / the Employment Act change their numbers (they do,
// periodically, by government notice), this is the only file that
// should need editing — nothing in the components should hardcode a
// rate or a band.

export const PAYROLL_CONFIG = {
  sha: {
    rate: 0.0275,      // 2.75% of gross pay
    minimum: 300,      // floor — nobody pays less than this
  },
  nssf: {
    rate: 0.06,          // 6% each side, per tier
    tier1Limit: 9000,    // Tier I covers gross pay up to this amount
    tier2Limit: 108000,  // Tier II covers gross pay between tier1Limit and this amount
  },
  overtime: {
    standardDaysPerMonth: 26,
    standardHoursPerDay: 8,
    ordinaryMultiplier: 1.5,  // extra hours on a normal working day
    restDayMultiplier: 2,     // hours worked on a rest day / public holiday
  },
};

/**
 * SHA (Social Health Authority / SHIF) contribution.
 * Flat percentage of gross pay, employee-side only, with a minimum floor.
 */
export function calculateSHA(grossPay, config = PAYROLL_CONFIG.sha) {
  const gross = Number(grossPay) || 0;
  const computed = gross * config.rate;
  return Math.round(Math.max(computed, config.minimum));
}

/**
 * NSSF contribution — two-tier structure, 6% per side per tier.
 * Returns both the employee and employer portions since payroll
 * cost reporting needs the employer side too, even though only the
 * employee side appears on the payslip deduction line.
 */
export function calculateNSSF(grossPay, config = PAYROLL_CONFIG.nssf) {
  const gross = Number(grossPay) || 0;

  const tier1Pay = Math.min(gross, config.tier1Limit);
  const tier2Pay = Math.max(0, Math.min(gross, config.tier2Limit) - config.tier1Limit);

  const tier1 = Math.round(tier1Pay * config.rate);
  const tier2 = Math.round(tier2Pay * config.rate);

  return {
    tier1,
    tier2,
    employee: tier1 + tier2, // employer contributes an equal matching amount
  };
}

/**
 * Overtime pay from actual hours worked, split into ordinary overtime
 * (1.5x) and rest-day/public-holiday overtime (2x), derived from an
 * hourly rate based on basic salary.
 */
export function calculateOvertimePay(
  basicSalary,
  ordinaryHours = 0,
  restDayHours = 0,
  config = PAYROLL_CONFIG.overtime
) {
  const basic = Number(basicSalary) || 0;
  const oHours = Number(ordinaryHours) || 0;
  const rHours = Number(restDayHours) || 0;

  const hourlyRate = basic / config.standardDaysPerMonth / config.standardHoursPerDay;

  const ordinaryPay = oHours * hourlyRate * config.ordinaryMultiplier;
  const restDayPay = rHours * hourlyRate * config.restDayMultiplier;

  return {
    hourlyRate: Math.round(hourlyRate * 100) / 100,
    ordinaryPay: Math.round(ordinaryPay),
    restDayPay: Math.round(restDayPay),
    total: Math.round(ordinaryPay + restDayPay),
  };
}