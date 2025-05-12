/**
 * Format verification response to be more readable
 * @param productId ID of product that was verified
 * @param verificationResponse Raw verification response
 * @returns Simplified verification response
 */
export function formatVerificationResponse(productId: string, verificationResponse: any): any {
  // Extract only the most important information
  const { success, message, product, consensusResult } = verificationResponse;
  
  // Format verifications in a more readable way
  const verifications = product.verifications?.map((v: any) => {
    return {
      userRole: v.userRole,
      passed: v.passed,
      qualityScore: v.details?.qualityScore || 'Not provided',
      timestamp: new Date(v.timestamp).toLocaleString(),
      issues: v.issues || []
    };
  }) || [];
  
  // Calculate average quality score from all verifications
  let avgQualityScore = 0;
  let totalScores = 0;
  
  verifications.forEach((v: any) => {
    if (typeof v.qualityScore === 'number') {
      avgQualityScore += v.qualityScore;
      totalScores++;
    }
  });
  
  if (totalScores > 0) {
    avgQualityScore = parseFloat((avgQualityScore / totalScores).toFixed(2));
  }
  
  // Create simplified response
  return {
    success,
    productId,
    message,
    status: product.status,
    qualityScore: avgQualityScore,
    verifications,
    consensusStatus: {
      achieved: consensusResult.achieved,
      verifiedRoles: consensusResult.verifiedRoles,
      missingRoles: consensusResult.missingRoles,
      positiveVerifications: consensusResult.positiveVerifications,
      negativeVerifications: consensusResult.negativeVerifications
    }
  };
}