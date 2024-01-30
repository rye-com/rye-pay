import Papa from 'papaparse';

const POSTAL_CODE_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; // List of possible letters in Canada / UK postal codes
const POSTAL_CODE_DIGITS = '0123456789'; // List of possible digits in Canada / UK postal codes

export function isApplePayAddress(
  address: google.payments.api.Address | ApplePayJS.ApplePayPaymentContact
): address is ApplePayJS.ApplePayPaymentContact {
  return 'givenName' in address;
}

export function isGooglePayAddress(
  address: google.payments.api.Address | ApplePayJS.ApplePayPaymentContact
): address is google.payments.api.Address {
  return 'name' in address;
}

/***
This function is required for Canada and UK for Apple Pay and Google Pay.

Reason:
When the Apple/Google Pay sheet is loading, the payment sheet has access to a redacted postal code (the first three digits).
For Canada -> It has access to only the forward sortation area (FSA) of the postal code (the first three letters).
For UK -> It has access to only the outward code of the postal code (the first half of the postal code).
To get Shipping options, the full postal code is required.

This function initally generates a random Local Delivery Unit (LDU) for Canada and a random sector and unit for UK.
Once the payment is authorized, the real postal code can be accessed, so the delivery will still always go to the real postal code.
***/
export async function generateFullPostalCode(
  postalCode: string,
  countryCode: string
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
 * The function `findFirstZipCode` takes a URL and a prefix as input, downloads a CSV file from the
 * URL, and returns the first zip code in the file that starts with the given prefix, or null if no
 * matching zip code is found.
 * @param {string} url - The `url` parameter is a string that represents the URL from which the zip
 * code data will be fetched. This URL should point to a CSV file that contains the zip code data.
 * @param {string} prefix - The `prefix` parameter is a string that represents the desired prefix of
 * the zip code. The function will search for the first zip code in the data that starts with this
 * prefix.
 * @returns The function `findFirstZipCode` returns a `Promise` that resolves to a `string` if a
 * matching zip code is found, or `null` if no matching zip code is found.
 */
async function findFirstZipCode(url: string, prefix: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true,
      complete: (results) => {
        const data = results.data as string[][];
        for (const row of data) {
          const zipCode = row[0];
          if (zipCode && zipCode.startsWith(prefix)) {
            resolve(zipCode);
            return;
          }
        }
        resolve(null); // No matching zip code found
      },
      error: (error) => reject(error),
    });
  });
}

/**
 * The function `getFullPostalCodeForUK` retrieves the full postal code for a given partial postal code
 * in the UK, using the Postcodes.io API, and returns a fallback postal code if the API call fails.
 * @param {string} postalCode - The `postalCode` parameter is a string representing a partial postal code in the UK.
 * @returns a Promise that resolves to complete postal code string.
 */
async function getFullPostalCodeForUK(postalCode: string): Promise<string> {
  const postalCodeUrl = `https://api.postcodes.io/postcodes/${postalCode}/autocomplete`;
  const sector = getRandomChar(POSTAL_CODE_DIGITS);
  const unit = getRandomChar(POSTAL_CODE_LETTERS) + getRandomChar(POSTAL_CODE_LETTERS);
  const fallbackPostalCode = postalCode + ' ' + sector + unit;

  try {
    const rawResponse = await fetch(postalCodeUrl, {
      method: 'GET',
    });
    const validPostalCodes = await rawResponse.json();
    return validPostalCodes.result[0] ?? fallbackPostalCode;
  } catch (error) {
    return fallbackPostalCode;
  }
}

/**
 * The function `getFullPostalCodeForCanada` retrieves the full postal code for a given postal code in
 * Canada, using a CSV file of Canadian postal codes.
 * @param {string} postalCode - The `postalCode` parameter is a string representing a partial postal code for Canada.
 * @returns a Promise that resolves to a complete postal code string.
 */
async function getFullPostalCodeForCanada(postalCode: string): Promise<string> {
  const canadianPostalCodesCsv =
    'https://raw.githubusercontent.com/ccnixon/postalcodes/master/CanadianPostalCodes.csv';
  const ldu =
    getRandomChar(POSTAL_CODE_LETTERS) +
    getRandomChar(POSTAL_CODE_DIGITS) +
    getRandomChar(POSTAL_CODE_LETTERS); // Local Delivery Unit
  const fallbackPostalCode = postalCode + ' ' + ldu;
  try {
    const fullPostalCode = await findFirstZipCode(canadianPostalCodesCsv, postalCode);
    return fullPostalCode ?? fallbackPostalCode;
  } catch (error) {
    return fallbackPostalCode;
  }
}
