import { AuthService } from './authService';
import { CartService } from './cartService';
import { InitParams, SpreedlyAdditionalFields, SubmitCartParams } from './rye-pay';

export type ApplePayParams = {
  cartApiEndpoint: string;
  cartId: string;
  shopperIp: string;
  updateBuyerIdentityMutation: string;
  ryeShopperIpHeaderKey: string;
  submitCart: (params: SubmitCartParams) => Promise<any>;
  onCartSubmitted: InitParams['onCartSubmitted'];
  log: (...args: any) => void;
};

export class ApplePay {
  private readonly applePayScriptUrl =
    'https://applepay.cdn-apple.com/jsapi/v1.1.0/apple-pay-sdk.js';

  private cartApiEndpoint: string;
  private cartId: string;
  private shopperIp: string;
  private updateBuyerIdentityMutation: string;
  private ryeShopperIpHeaderKey: string;
  private onCartSubmitted: InitParams['onCartSubmitted'];
  private log: (...args: any) => void;

  private applePaySession: ApplePaySession | undefined;
  private shippingOptions: ApplePayJS.ApplePayShippingMethod[] = [];
  private selectedShippingMethod: ApplePayJS.ApplePayShippingMethod | undefined;
  private authService = AuthService.getInstance();
  private cartService: CartService;

  constructor({
    cartApiEndpoint,
    cartId,
    shopperIp,
    updateBuyerIdentityMutation,
    ryeShopperIpHeaderKey,
    onCartSubmitted,
    log,
  }: ApplePayParams) {
    this.cartApiEndpoint = cartApiEndpoint;
    this.cartId = cartId;
    this.shopperIp = shopperIp;
    this.updateBuyerIdentityMutation = updateBuyerIdentityMutation;
    this.ryeShopperIpHeaderKey = ryeShopperIpHeaderKey;
    this.onCartSubmitted = onCartSubmitted;
    this.log = log;
    this.cartService = CartService.getInstance(this.cartApiEndpoint);
  }

  loadApplePay() {
    const applePayScript = document.createElement('script');
    applePayScript.src = this.applePayScriptUrl;
    document.head.appendChild(applePayScript);

    applePayScript.onload = () => {
      this.initializeApplePay();
    };
  }

  private initializeApplePay() {
    if ((window as any).ApplePaySession) {
      var merchantIdentifier = 'merchant.app.ngrok.14e94dd56b77';
      var promise = ApplePaySession.canMakePaymentsWithActiveCard(merchantIdentifier);
      promise.then((canMakePayments) => {
        if (canMakePayments) {
          // Create Apple Pay button
          const buttonContainer = document.getElementById('rye-apple-pay');
          const button = document.createElement('apple-pay-button');
          button.setAttribute('buttonstyle', 'black');
          button.setAttribute('type', 'buy');
          button.onclick = () => this.onApplePayClicked();

          if (buttonContainer) {
            buttonContainer.appendChild(button);
          } else {
            this.log('Apple Pay button container not found');
          }
        }
      });
    }
  }

  private async updateAppleBuyerIdentity(shippingAddress: ApplePayJS.ApplePayPaymentContact) {
    const headers: RequestInit['headers'] = {
      'Content-Type': 'application/json',
      Authorization: await this.authService.getAuthHeader(),
    };

    headers[this.ryeShopperIpHeaderKey] = this.shopperIp;

    let buyerIdentity: any = {
      provinceCode: shippingAddress.administrativeArea ?? '',
      countryCode: shippingAddress?.countryCode ?? '',
      postalCode: shippingAddress?.postalCode ?? '',
    };

    if (shippingAddress.givenName) {
      buyerIdentity = {
        firstName: shippingAddress.givenName ?? '',
        lastName: shippingAddress.familyName ?? '',
        phone: shippingAddress?.phoneNumber,
        address1: shippingAddress?.addressLines?.at(0) ?? '',
        address2: shippingAddress?.addressLines?.at(1) ?? '',
        city: shippingAddress?.locality ?? '',
        provinceCode: shippingAddress?.administrativeArea ?? '',
        countryCode: shippingAddress?.countryCode ?? '',
        postalCode: shippingAddress?.postalCode ?? '',
      };
    }

    const rawResponse = await fetch(this.cartApiEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: this.updateBuyerIdentityMutation,
        variables: {
          input: {
            id: this.cartId,
            buyerIdentity: buyerIdentity,
          },
        },
      }),
    });

    return await rawResponse.json();
  }

  private async getAppleShippingOptions(shippingAddress: ApplePayJS.ApplePayPaymentContact) {
    const content = await this.updateAppleBuyerIdentity(shippingAddress);
    const shippingOptions =
      content?.data?.updateCartBuyerIdentity?.cart?.stores
        ?.at(0)
        ?.offer?.shippingMethods?.map((shippingMethod: any) => ({
          identifier: shippingMethod.id,
          label: shippingMethod.label,
          detail: `${shippingMethod.price.displayValue} ${shippingMethod.price.currency ?? 'USD'}`,
          amount: Number(shippingMethod.total.value) / 100,
        })) ?? [];
    return shippingOptions;
  }

  private async onValidateMerchant(event: ApplePayJS.ApplePayValidateMerchantEvent) {
    try {
      const applePayServerUrl = 'https://apple-pay-server-ggymj6kjkq-uc.a.run.app';
      const result = await fetch(applePayServerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          mode: 'cors',
        },
        body: JSON.stringify({
          appleValidationUrl: event.validationURL,
          merchantDisplayName: 'Rye',
          merchantDomain: 'applepay.ngrok.app',
        }),
      });

      const merchantValidationResult = await result.json();
      this.applePaySession?.completeMerchantValidation(merchantValidationResult);
    } catch (e) {
      this.log('Merchant validation failed:', e);
    }
  }

  private async onShippingContactSelected(event: ApplePayJS.ApplePayShippingContactSelectedEvent) {
    const shippingAddress = event.shippingContact;
    this.shippingOptions = await this.getAppleShippingOptions(shippingAddress);
    const newTotal = {
      label: 'Your Merchant Name',
      amount: '10.00',
    };

    this.applePaySession?.completeShippingContactSelection(
      ApplePaySession.STATUS_SUCCESS,
      this.shippingOptions,
      newTotal,
      []
    );
  }

  private async onShippingMethodSelected(event: ApplePayJS.ApplePayShippingMethodSelectedEvent) {
    this.selectedShippingMethod = event.shippingMethod;
    const newTotal = {
      label: this.selectedShippingMethod.label,
      amount: this.selectedShippingMethod.amount,
    };

    this.applePaySession?.completeShippingMethodSelection(
      ApplePaySession.STATUS_SUCCESS,
      newTotal,
      []
    );
  }

  private async onPaymentAuthorized(event: ApplePayJS.ApplePayPaymentAuthorizedEvent) {
    const shippingAddress = event.payment.shippingContact;
    const updateBuyerIdentity = await this.updateAppleBuyerIdentity(shippingAddress!);
    const selectedShippingOptionId = this.selectedShippingMethod?.identifier;

    const selectedShippingOptions =
      updateBuyerIdentity.data.updateCartBuyerIdentity.cart.stores.map((store: any) => {
        const option = store.offer.shippingMethods.find(
          (shippingMethod: any) => shippingMethod.id === selectedShippingOptionId
        );
        return {
          store: store.store,
          shippingId: option.id,
        };
      });

    const paymentToken = event.payment.token.paymentData;
    const paymentDetails: SpreedlyAdditionalFields = {
      first_name: shippingAddress?.givenName ?? '',
      last_name: shippingAddress?.familyName ?? '',
      phone_number: shippingAddress?.phoneNumber ?? '',
      month: '',
      year: '',
      address1: shippingAddress?.addressLines?.at(0) ?? '',
      address2: shippingAddress?.addressLines?.at(1) ?? '',
      city: shippingAddress?.locality ?? '',
      state: shippingAddress?.administrativeArea ?? '',
      zip: shippingAddress?.postalCode ?? '',
      country: shippingAddress?.countryCode ?? '',
      metadata: {
        cartId: this.cartId,
        selectedShippingOptions: JSON.stringify(selectedShippingOptions),
        shopperIp: this.shopperIp,
      },
    };

    // Step 7: Submit the Cart
    const result = await this.cartService.submitCart({
      applePayToken: paymentToken,
      paymentDetails,
    });
    this.onCartSubmitted?.(result.submitCart, result.errors);

    // Complete the payment session
    if (false) {
      this.applePaySession?.completePayment(ApplePaySession.STATUS_SUCCESS);
    }
  }

  private onApplePayClicked() {
    // Check for ApplePaySession availability
    if (typeof ApplePaySession === 'undefined') {
      this.log('Apple Pay is not available on this device/browser.');
      return;
    }

    // Define the Apple Pay payment request
    const paymentRequest = {
      countryCode: 'US',
      currencyCode: 'USD',
      supportedNetworks: ['visa', 'masterCard', 'amex', 'discover'],
      merchantCapabilities: ['supports3DS'] as ApplePayJS.ApplePayMerchantCapability[],
      total: {
        label: 'Your Merchant Name',
        amount: '10.00', // Example amount
      },
      requiredShippingContactFields: [
        'email',
        'name',
        'phone',
        'postalAddress',
      ] as ApplePayJS.ApplePayContactField[],
      shippingMethods: [],
    };

    // Create an ApplePaySession
    this.applePaySession = new ApplePaySession(3, paymentRequest);

    // Validate merchant
    this.applePaySession.onvalidatemerchant = (event) => this.onValidateMerchant(event);

    // Fetch shipping options when shipping contact is selected or changed
    this.applePaySession.onshippingcontactselected = (event) =>
      this.onShippingContactSelected(event);

    // Update shipping method when shipping method is selected or changed
    this.applePaySession.onshippingmethodselected = (event) => this.onShippingMethodSelected(event);

    // Authorize payment
    this.applePaySession.onpaymentauthorized = (event) => this.onPaymentAuthorized(event);

    // Start the Apple Pay session
    try {
      this.applePaySession.begin();
    } catch (error) {
      this.log('Apple Pay session failed:', error);
    }
  }
}
