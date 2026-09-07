export const formatINR = (amount: number | string): string => {
  const num = Number(amount);
  if (isNaN(num)) return 'Rs. 0';
  return 'Rs. ' + num.toLocaleString('en-IN');
};

export const formatPercent = (val: number): string => {
  return `${Math.round(val)}%`;
};
