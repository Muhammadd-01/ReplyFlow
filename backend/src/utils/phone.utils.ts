import { parsePhoneNumberWithError, CountryCode } from 'libphonenumber-js';

export const normalizePhoneNumber = (phone: string, defaultCountry: string = 'PK'): string | null => {
  try {
    // If the phone number already starts with '+', don't use default country
    const phoneStr = phone.toString().trim();
    if (!phoneStr) return null;
    
    let phoneNumber;
    if (phoneStr.startsWith('+')) {
      phoneNumber = parsePhoneNumberWithError(phoneStr);
    } else {
      phoneNumber = parsePhoneNumberWithError(phoneStr, defaultCountry as CountryCode);
    }

    if (phoneNumber.isValid()) {
      return phoneNumber.number; // E.164 format
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const isValidPhoneNumber = (phone: string, defaultCountry: string = 'PK'): boolean => {
  return normalizePhoneNumber(phone, defaultCountry) !== null;
};

export const toLocalFormat = (phone: string, defaultCountry: string = 'PK'): string => {
  try {
    const phoneStr = phone.toString().trim();
    if (!phoneStr) return phone;
    
    let phoneNumber;
    if (phoneStr.startsWith('+')) {
      phoneNumber = parsePhoneNumberWithError(phoneStr);
    } else {
      phoneNumber = parsePhoneNumberWithError(phoneStr, defaultCountry as CountryCode);
    }

    if (phoneNumber.isValid()) {
      // For Pakistan, National format is like "0300 1234567". We remove spaces to make it "03001234567"
      if (phoneNumber.country === 'PK') {
        return phoneNumber.formatNational().replace(/\s/g, '');
      }
      return phoneNumber.formatNational();
    }
    return phone;
  } catch (error) {
    return phone;
  }
};
