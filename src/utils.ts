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
