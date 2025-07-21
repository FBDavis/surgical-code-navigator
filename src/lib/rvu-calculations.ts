/**
 * Medicare Multiple Procedure Payment Reduction (MPPR) utility functions
 * 
 * The MPPR applies step-down reductions to multiple procedures performed on the same day:
 * - Highest RVU procedure: 100% payment
 * - Second highest RVU procedure: 50% payment  
 * - Third and subsequent procedures: 50% payment
 * 
 * This follows CMS guidelines for accurate reimbursement calculations.
 */

export interface CPTCodeWithRVU {
  code: string;
  rvu: number;
  description?: string;
  [key: string]: any;
}

/**
 * Calculate total RVUs with Medicare MPPR step-down applied
 * @param codes Array of CPT codes with RVU values
 * @returns Object containing adjusted total RVUs and breakdown
 */
export function calculateAdjustedRVUs(codes: CPTCodeWithRVU[]) {
  if (codes.length === 0) {
    return {
      totalRVUs: 0,
      unadjustedTotal: 0,
      breakdown: []
    };
  }

  // Sort codes by RVU value (highest first)
  const sortedCodes = [...codes].sort((a, b) => b.rvu - a.rvu);
  
  const breakdown = sortedCodes.map((code, index) => {
    let adjustmentFactor: number;
    let adjustmentDescription: string;
    
    if (index === 0) {
      // Highest RVU code gets 100%
      adjustmentFactor = 1.0;
      adjustmentDescription = "Primary procedure (100%)";
    } else {
      // All subsequent codes get 50% under MPPR
      adjustmentFactor = 0.5;
      adjustmentDescription = `Additional procedure (50%)`;
    }
    
    const adjustedRVU = code.rvu * adjustmentFactor;
    
    return {
      code: code.code,
      description: code.description,
      originalRVU: code.rvu,
      adjustmentFactor,
      adjustmentDescription,
      adjustedRVU,
      position: index + 1
    };
  });

  const unadjustedTotal = codes.reduce((sum, code) => sum + code.rvu, 0);
  const totalRVUs = breakdown.reduce((sum, item) => sum + item.adjustedRVU, 0);

  return {
    totalRVUs: Math.round(totalRVUs * 100) / 100, // Round to 2 decimal places
    unadjustedTotal: Math.round(unadjustedTotal * 100) / 100,
    breakdown,
    reductionAmount: Math.round((unadjustedTotal - totalRVUs) * 100) / 100
  };
}

/**
 * Calculate estimated value with MPPR adjustments
 * @param codes Array of CPT codes with RVU values
 * @param rvuRate Rate per RVU (typically around $65)
 * @returns Adjusted estimated value
 */
export function calculateAdjustedValue(codes: CPTCodeWithRVU[], rvuRate: number) {
  const { totalRVUs } = calculateAdjustedRVUs(codes);
  return Math.round(totalRVUs * rvuRate * 100) / 100;
}