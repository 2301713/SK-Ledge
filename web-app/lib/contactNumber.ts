export const PH_MOBILE_PATTERN = /^09[0-9]{9}$/;

/** Normalizes PH mobile numbers (e.g. +63917…, 917…, 0917…) to 09XXXXXXXXX. */
export const normalizeContactNumber = (value: string) => {
  const digits = value.replace(/[^0-9]/g, "");
  if (/^639[0-9]{9}$/.test(digits)) return `0${digits.slice(2)}`;
  if (/^9[0-9]{9}$/.test(digits)) return `0${digits}`;
  return digits;
};

export const isValidContactNumber = (value: string) =>
  PH_MOBILE_PATTERN.test(value);
