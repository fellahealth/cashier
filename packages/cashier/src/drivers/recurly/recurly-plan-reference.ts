export const RECURLY_CODE_PREFIX = 'code-';

export const toRecurlyPlanReference = (
  planIdOrCode: string,
): { planId: string } | { planCode: string } =>
  planIdOrCode.startsWith(RECURLY_CODE_PREFIX)
    ? { planCode: planIdOrCode.slice(RECURLY_CODE_PREFIX.length) }
    : { planId: planIdOrCode };
