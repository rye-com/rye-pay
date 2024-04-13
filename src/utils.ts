import canadaPostalCodes from './canadaPostalCodes.json';

const POSTAL_CODE_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; // List of possible letters in Canada / UK postal codes
const POSTAL_CODE_DIGITS = '0123456789'; // List of possible digits in Canada / UK postal codes

export function isApplePayAddress(
  address: google.payments.api.Address | ApplePayJS.ApplePayPaymentContact,
): address is ApplePayJS.ApplePayPaymentContact {
  return 'givenName' in address;
}

export function isGooglePayAddress(
  address: google.payments.api.Address | ApplePayJS.ApplePayPaymentContact,
): address is google.payments.api.Address {
  return 'name' in address;
}

/***
This function is required for Canada and UK for Apple Pay and Google Pay.

Reason:
When the Apple/Google Pay sheet is loading, the payment sheet has access to a redacted postal code for UK and Canada (the first three digits).
For Canada -> It has access to only the forward sortation area (FSA) of the postal code (the first three letters).
For UK -> It has access to only the outward code of the postal code (the first half of the postal code).
To get Shipping options, the full postal code is required.

This function initally generates a random Local Delivery Unit (LDU) for Canada and a random sector and unit for UK.
Once the payment is authorized, the real postal code can be accessed, so the delivery will still always go to the real postal code.
***/
export async function generateFullPostalCode(
  postalCode: string,
  countryCode: string,
): Promise<string> {
  if (countryCode === 'CA') {
    return await getFullPostalCodeForCanada(postalCode);
  } else if (countryCode === 'GB') {
    return await getFullPostalCodeForUK(postalCode);
  }

  return postalCode;
}

// Function to get a random character from a string
function getRandomChar(str: string): string {
  return str.charAt(Math.floor(Math.random() * str.length));
}

/**
 * The function `getFullPostalCodeForUK` retrieves the full postal code for a given partial postal code
 * in the UK, using the Postcodes.io API, and returns a fallback postal code if the API call fails.
 * @param {string} postalCode - The `postalCode` parameter is a string representing a partial postal code in the UK.
 * @returns a Promise that resolves to complete postal code string.
 */
async function getFullPostalCodeForUK(postalCode: string): Promise<string> {
  const postalCodeUrl = `https://api.postcodes.io/postcodes/${postalCode}/autocomplete`;
  try {
    const rawResponse = await fetch(postalCodeUrl, {
      method: 'GET',
    });
    const validPostalCodes = await rawResponse.json();
    return validPostalCodes.result[0] ?? generateFallbackPostalCodeForUK(postalCode);
  } catch (error) {
    return generateFallbackPostalCodeForUK(postalCode);
  }
}

/**
 * The function `getFullPostalCodeForCanada` retrieves the full postal code for a given partial postal code
 * in Canada, using a JSON object containing Canadian postal codes, and returns a fallback postal code if
 * the JSON object does not contain the partial postal code.
 * @param {string} postalCode - The `postalCode` parameter is a string representing a partial postal code in Canada.
 * @returns complete postal code string.
 */
function getFullPostalCodeForCanada(postalCode: string): string {
  if (postalCode.length === 6) {
    return postalCode;
  }

  try {
    const fullPostalCode = (
      canadaPostalCodes as {
        [key: string]: string;
      }
    )[postalCode];

    return fullPostalCode ?? generateFallbackPostalCodeForCanada(postalCode);
  } catch (error) {
    return generateFallbackPostalCodeForCanada(postalCode);
  }
}

/**
 * Generates a fallback postal code by appending a randomly generated sector and unit to the given partial postal code.
 * @param {string} postalCode - The partial postal code to which the sector and unit will be appended.
 * @returns {string} - The complete fallback postal code.
 */
function generateFallbackPostalCodeForUK(postalCode: string): string {
  const sector = getRandomChar(POSTAL_CODE_DIGITS);
  const unit = getRandomChar(POSTAL_CODE_LETTERS) + getRandomChar(POSTAL_CODE_LETTERS);
  return postalCode + ' ' + sector + unit;
}

/**
 * Generates a fallback postal code by appending a randomly generated LDU to the given partial postal code.
 * @param {string} postalCode - The partial postal code to which the LDU will be appended.
 * @returns {string} - The complete fallback postal code.
 */
function generateFallbackPostalCodeForCanada(postalCode: string): string {
  const ldu =
    getRandomChar(POSTAL_CODE_LETTERS) +
    getRandomChar(POSTAL_CODE_DIGITS) +
    getRandomChar(POSTAL_CODE_LETTERS); // Local Delivery Unit
  return postalCode + ' ' + ldu;
}
