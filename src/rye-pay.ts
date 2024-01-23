// Original Spreedly interface (only used api covered)
interface Spreedly {
  init: (envToken: string, params: SpreedlyInitParams) => void;
  tokenizeCreditCard: (options: SpreedlyAdditionalFields) => void;
  on: (event: SpreedlyEvent, callback: (...args: any) => void) => void;
  validate: () => void;
  reload: () => void;
  setStyle: (field: string, style: string) => void;
  setFieldType: (field: FrameField, type: FieldType) => void;
  setLabel: (field: FrameField, label: string) => void;
  setTitle: (field: FrameField, title: string) => void;
  setPlaceholder: (field: FrameField, placeholder: string) => void;
  setValue: (field: FrameField, value: number) => void;
  transferFocus: (field: FrameField) => void;
  toggleAutoComplete: () => void;
  setNumberFormat: (format: NumberFormat) => void;
  removeHandlers: () => void;
}

// Params for Spreedly init method
interface SpreedlyInitParams {
  numberEl: string;
  cvvEl: string;
}

// Represents Spreedly error object
interface SpreedlyError {
  attribute: string;
  key: string;
  message: string;
}

// Represents error object thrown by iFrame
interface FrameError {
  msg: string;
  url: string;
  line: number;
  col: number;
}

interface GraphQLError {
  message: string;
}

// iFrame field properties used for validation and tracking changes
interface InputProperties {
  cardType: string; // The type (brand) of the card. One of supported card identifiers.
  validNumber: boolean; // This will check if the supplied card number is a supported brand and expected length. If the brand has an algorithm check, it validates that the algorithm passes. Will return either true or false.
  validCvv: boolean; // This will check if the supplied CVV matches the expected length based on the card type, and is comprised of only numbers. Will return either true or false.
  numberLength: number; // The length of the value entered into the number field
  cvvLength: number; // The length of the value entered into the CVV field
}

// Auxiliary types used in Spreedly
type SpreedlyEvent =
  | 'ready'
  | 'paymentMethod'
  | 'errors'
  | 'fieldEvent'
  | 'validation'
  | 'consoleError';
type FrameField = 'number' | 'cvv';
type FieldType = 'number' | 'text' | 'tel';
type NumberFormat = 'prettyFormat' | 'maskedFormat';
type FrameEventType =
  | 'focus'
  | 'blur'
  | 'mouseover'
  | 'mouseout'
  | 'input'
  | 'enter'
  | 'escape'
  | 'tab'
  | 'shiftTab';
type Environment = 'prod' | 'stage' | 'local';

// RyePay params for init method
interface InitParams extends SpreedlyInitParams {
  apiKey?: string;
  generateJWT?: () => Promise<string>;
  numberEl: string;
  cvvEl: string;
  onReady?: (spreedly: Spreedly) => void;
  onErrors?: (errors: SpreedlyError[]) => void;
  onCartSubmitted?: (submitCartResult?: SubmitCartResult, errors?: GraphQLError[]) => void;
  onIFrameError?: (error: FrameError) => void;
  onFieldChanged?: (
    name: FrameField,
    type: FrameEventType,
    activeEl: FrameField,
    inputProperties: Partial<InputProperties>
  ) => void;
  onValidate?: (inputProperties: InputProperties) => void;
  enableLogging?: boolean;
  environment?: Environment;
  cartId?: string;
  shopperIp?: string;
}

interface SubmitAdditionalFields {
  first_name: string;
  last_name: string;
  phone_number?: string;
  month: string;
  year: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface RyeSubmitAdditionalFields extends SubmitAdditionalFields {
  cartId: string;
  selectedShippingOptions?: SelectedShippingOption[];
  shopperIp?: string;
  experimentalPromoCodes?: StorePromoCodes[];
}

// Additional fields that can be submitted together with credit card details
interface SpreedlyAdditionalFields extends SubmitAdditionalFields {
  metadata: {
    cartId: string;
    selectedShippingOptions?: string;
    shopperIp?: string;
    experimentalPromoCodes?: string;
  };
}

interface StorePromoCodes {
  store: string;
  promoCodes: string[];
}

interface CartApiSubmitInput {
  id: string;
  token: string;
  applePayToken?: ApplePayToken;
  billingAddress: BillingAddress;
  selectedShippingOptions?: SelectedShippingOption[];
  experimentalPromoCodes?: StorePromoCodes[];
}

interface SubmitCartParams {
  token?: string;
  paymentDetails: SpreedlyAdditionalFields;
  applePayToken?: ApplePayToken;
}

interface ApplePayToken {
  version: string;
  data: string;
  signature: string;
  header: {
    ephemeralPublicKey: string;
    publicKeyHash: string;
    transactionId: string;
  };
}

export interface SelectedShippingOption {
  store: string;
  shippingId: string;
}

interface BillingAddress {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  provinceCode: string;
  countryCode: string;
  postalCode: string;
  phone?: string;
}

export interface EnvTokenResult {
  token: string;
}

export interface SubmitCartResult {
  cart: {
    id: string;
    stores: SubmitStoreResult[];
  };
  errors: SubmitCartResultError[];
}

export interface SubmitStoreResult {
  store: Store;
  status: SubmitStoreStatus;
  requestId?: string;
  errors: SubmitStoreResultError[];
}

export interface SubmitCartResultError {
  code: SubmitCartResultErrorCode;
  message: string;
}
export interface SubmitStoreResultError {
  code: SubmitStoreResultErrorCode;
  message: string;
}

export enum SubmitStoreResultErrorCode {
  SUBMIT_STORE_FAILED = 'SUBMIT_STORE_FAILED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
}

export enum SubmitCartResultErrorCode {
  SUBMIT_CART_FAILED = 'SUBMIT_CART_FAILED',
  BUYER_IDENTITY_MISSING = 'BUYER_IDENTITY_MISSING',
  BUYER_IDENTITY_INVALID_FIRST_NAME = 'BUYER_IDENTITY_INVALID_FIRST_NAME',
  BUYER_IDENTITY_INVALID_LAST_NAME = 'BUYER_IDENTITY_INVALID_LAST_NAME',
  BUYER_IDENTITY_INVALID_ADDRESS = 'BUYER_IDENTITY_INVALID_ADDRESS',
  BUYER_IDENTITY_INVALID_CITY = 'BUYER_IDENTITY_INVALID_CITY',
  BUYER_IDENTITY_INVALID_PROVINCE = 'BUYER_IDENTITY_INVALID_PROVINCE',
  BUYER_IDENTITY_INVALID_COUNTRY = 'BUYER_IDENTITY_INVALID_COUNTRY',
  BUYER_IDENTITY_INVALID_POSTAL_CODE = 'BUYER_IDENTITY_INVALID_POSTAL_CODE',
  BUYER_IDENTITY_INVALID_PHONE = 'BUYER_IDENTITY_INVALID_PHONE',
  BUYER_IDENTITY_INVALID_EMAIL = 'BUYER_IDENTITY_INVALID_EMAIL',
  BILLING_ADDRESS_INVALID_FIRST_NAME = 'BILLING_ADDRESS_INVALID_FIRST_NAME',
  BILLING_ADDRESS_INVALID_LAST_NAME = 'BILLING_ADDRESS_INVALID_LAST_NAME',
  BILLING_ADDRESS_INVALID_ADDRESS = 'BILLING_ADDRESS_INVALID_ADDRESS',
  BILLING_ADDRESS_INVALID_CITY = 'BILLING_ADDRESS_INVALID_CITY',
  BILLING_ADDRESS_INVALID_PROVINCE = 'BILLING_ADDRESS_INVALID_PROVINCE',
  BILLING_ADDRESS_INVALID_COUNTRY = 'BILLING_ADDRESS_INVALID_COUNTRY',
  BILLING_ADDRESS_INVALID_PHONE = 'BILLING_ADDRESS_INVALID_PHONE',
  BILLING_ADDRESS_INVALID_POSTAL_CODE = 'BILLING_ADDRESS_INVALID_POSTAL_CODE',
}

export type Store = AmazonStore | ShopifyStore;

export interface AmazonStore {
  store: string;
  cartLines: AmazonCartLine[];
}

export interface ShopifyStore {
  store: string;
  cartLines: ShopifyCartLine[];
}

export interface AmazonCartLine {
  quantity: number;
  product: AmazonProduct;
}

export interface AmazonProduct {
  id: string;
}

export interface ShopifyCartLine {
  quantity: number;
  variant: ShopifyVariant;
}

export interface ShopifyVariant {
  id: string;
}

export enum SubmitStoreStatus {
  COMPLETED = 'COMPLETED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  FAILED = 'FAILED',
}

export enum Marketplace {
  AMAZON = 'AMAZON',
  SHOPIFY = 'SHOPIFY',
}

const prodCartApiEndpoint =
  process.env.CART_API_PRODUCTION_URL ?? 'https://graphql.api.rye.com/v1/query';
const stageCartApiEndpoint =
  process.env.CART_API_STAGING_URL ?? 'https://staging.beta.graphql.api.rye.com/v1/query';
const localCartApiEndpoint = 'https://2997c85f5fe1.ngrok.app/v1/query';
const ryeShopperIpHeaderKey = 'x-rye-shopper-ip';

const cartSubmitResponse = `
cart {
  id,
  stores {
    status,
    requestId
    store {
      ... on AmazonStore {
        store
        cartLines {
          quantity,
          product {
            id
          }
        }
      }
      ... on ShopifyStore {
        store
        cartLines {
          quantity,
          variant {
            id
          }
        }
      }
    }
    errors {
      code
      message
    }
  }
}
errors {
  code
  message
}
`;

export class RyePay {
  private initializing = false;
  private readonly spreedlyScriptUrl = 'https://core.spreedly.com/iframe/iframe-v1.min.js';
  private readonly googlePayScriptUrl = 'https://pay.google.com/gp/p/js/pay.js';
  private readonly applePayScriptUrl = 'https://applepay.cdn-apple.com/jsapi/v1.1.0/apple-pay-sdk.js';
  private readonly submitCartMutation = `mutation submitCart($input: CartSubmitInput!) { submitCart(input: $input) { ${cartSubmitResponse} } } `;
  private readonly updateBuyerIdentityMutation = `mutation ($input: CartBuyerIdentityUpdateInput!) { updateCartBuyerIdentity(input: $input) { cart { id stores { ... on AmazonStore { store offer { subtotal { value displayValue currency } shippingMethods { id label price { value displayValue currency } taxes { value displayValue currency } total { value displayValue currency } } } } ... on ShopifyStore { store offer { subtotal { value displayValue currency } shippingMethods { id label price { value displayValue currency } taxes { value displayValue currency } total { value displayValue currency } } } } } } } }`;
  private readonly envTokenQuery = `query {
    environmentToken {
       token
    }
  }`;
  private cartApiEndpoint = prodCartApiEndpoint;
  private spreedly!: Spreedly;
  private apiKey?: string;
  private generateJWT?: () => Promise<string>;
  private enableLogging: boolean = false;
  private googlePayConfig: any;
  private googlePayFinalPrice: number = 0;
  private googlePayFinalCurrency: string = 'USD';
  private googlePayShippingOptions: any[] = [];
  private cartId = '';
  private shopperIp = '';

  private getGooglePayConfig(spreedlyEnvironmentKey: string) {
    return {
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: [
        {
          type: 'CARD',
          parameters: {
            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
            allowedCardNetworks: ['AMEX', 'DISCOVER', 'JCB', 'MASTERCARD', 'VISA'],
          },
          tokenizationSpecification: {
            type: 'PAYMENT_GATEWAY',
            parameters: {
              gateway: 'spreedly',
              gatewayMerchantId: spreedlyEnvironmentKey,
            },
          },
        },
      ],
    };
  }

  /**
   * Indicates whether the RyePay has been initialized.
   */
  public initialized = false;

  private initParams: InitParams | undefined;

  /**
   * Initializes RyePay. This method should be called before calling any other methods of RyePay.
   */
  init(params: InitParams) {
    this.initParams = params;
    const {
      apiKey,
      generateJWT,
      numberEl,
      cvvEl,
      onErrors,
      enableLogging = false,
      environment = 'prod',
    } = params;
    if (this.initializing) {
      return;
    }
    if (this.initialized) {
      this.reload();
      return;
    }
    this.initializing = true;
    this.cartId = params.cartId ?? '';
    this.shopperIp = params.shopperIp ?? '';

    if (!apiKey && !generateJWT) {
      const errorMsg = 'Either apiKey or generateJWT must be provided';
      if (onErrors) {
        onErrors([
          {
            attribute: 'apiKey',
            key: 'errors.blank',
            message: errorMsg,
          },
          {
            attribute: 'generateJWT',
            key: 'errors.blank',
            message: errorMsg,
          },
        ]);
        return;
      }
      throw new Error(errorMsg);
    }

    if (this.hasSpreedlyGlobal()) {
      return;
    }

    this.apiKey = apiKey;
    this.generateJWT = generateJWT;
    this.enableLogging = enableLogging;
    this.cartApiEndpoint = this.getCartApiEndpoint(environment);

    const script = document.createElement('script');
    document.head.appendChild(script);

    const scriptLoadingErrorMsg = 'error loading Spreedly';
    script.onerror = () => {
      throw new Error(scriptLoadingErrorMsg);
    };
    script.onload = async () => {
      if (!this.hasSpreedlyGlobal()) {
        throw new Error(scriptLoadingErrorMsg);
      }

      this.spreedly = (globalThis as any).Spreedly;
      const envToken = await this.getEnvToken();
      this.log(`envToken: ${envToken}`);
      this.googlePayConfig = this.getGooglePayConfig(envToken);

      this.subscribeToEvents(params);

      this.spreedly.init(envToken, {
        numberEl,
        cvvEl,
      });

      this.initializing = false;
      this.initialized = true;
      this.log('Spreedly initialized');
    };

    // trigger script loading
    script.src = this.spreedlyScriptUrl;

    this.log('RyePay initialized');

    // Initialize GooglePay if the button is present
    if (document.getElementById('rye-google-pay')) {
      this.loadAndInitializeGooglePay(params.onCartSubmitted);
    }

    // Initialize GooglePay if the button is present
    if (document.getElementById('rye-apple-pay')) {
      this.loadAndInitializeApplePay(params.onCartSubmitted);
    }
  }

  private loadAndInitializeApplePay(onCartSubmitted: InitParams['onCartSubmitted']) {
    const applePayScript = document.createElement('script');
    applePayScript.src = this.applePayScriptUrl;
    document.head.appendChild(applePayScript);

    applePayScript.onload = () => {
      this.initializeApplePay(onCartSubmitted);
    };
  }

  private initializeApplePay(onCartSubmitted: InitParams['onCartSubmitted']) {
    if ((window as any).ApplePaySession) {
      var merchantIdentifier = 'merchant.app.ngrok.14e94dd56b77';
      var promise = ApplePaySession.canMakePaymentsWithActiveCard(merchantIdentifier);
      promise.then((canMakePayments) => {
         if (canMakePayments) {
          // Display Apple Pay button here.
          const buttonContainer = document.getElementById('rye-apple-pay');
          const button = document.createElement('apple-pay-button');
          button.setAttribute('buttonstyle', 'black');
          button.setAttribute('type', 'buy');
          button.onclick = () => this.onApplePayClicked(onCartSubmitted);

          if (buttonContainer) {
            buttonContainer.appendChild(button);
          } else {
            console.log('Apple Pay button container not found');
          }
         }
      });
    }
  }

  private async updateAppleBuyerIdentity(shippingAddress: ApplePayJS.ApplePayPaymentContact) {
    const headers: RequestInit['headers'] = {
      'Content-Type': 'application/json',
      Authorization: await this.getAuthHeader(),
    };

    headers[ryeShopperIpHeaderKey] = '10.10.101.215';

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
      content.data.updateCartBuyerIdentity.cart.stores[0].offer.shippingMethods.map(
        (shippingMethod: any) => ({
          identifier: shippingMethod.id,
          label: shippingMethod.label,
          detail: `${shippingMethod.price.displayValue} ${
            shippingMethod.price.currency ?? 'USD'
          }`,
          amount: Number(shippingMethod.total.value) / 100,
        })
      );
    return shippingOptions;
  }


  private onApplePayClicked(onCartSubmitted: InitParams['onCartSubmitted']) {
    // Check for ApplePaySession availability
    if (typeof ApplePaySession === 'undefined') {
        console.error('Apple Pay is not available on this device/browser.');
        return;
    }

    // Define the Apple Pay payment request
    const paymentRequest = {
        // Example payment request data
        countryCode: 'US',
        currencyCode: 'USD',
        supportedNetworks: ['visa', 'masterCard', 'amex', 'discover'],
        merchantCapabilities: ['supports3DS'],
        total: {
            label: 'Your Merchant Name',
            amount: '10.00', // Example amount
        },
        requiredShippingContactFields: ["email", "name", "phone", "postalAddress"],
        shippingMethods: []
    };  

    // Create an ApplePaySession
    const session = new ApplePaySession(3, paymentRequest as any);
    let selectedShippingMethod: ApplePayJS.ApplePayShippingMethod;

    // Merchant Validation
    session.onvalidatemerchant = async (event) => {
      try {
        const result = await fetch("https://apple-pay-server-ggymj6kjkq-uc.a.run.app/", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'mode': 'cors'
          },
          body: JSON.stringify({
            appleValidationUrl: event.validationURL,
            merchantDisplayName: "Rye",
            merchantDomain: "applepay.ngrok.app"
          })
        });

        const merchantValidationResult = await result.json();
        session.completeMerchantValidation(merchantValidationResult);
      } catch (error) {
        console.error('Merchant validation failed:', error);
      }
    };

    // Get shipping options when we have access to user address
    let shippingOptions: ApplePayJS.ApplePayShippingMethod[];
    session.onshippingcontactselected = async (event) => {
      const shippingAddress = event.shippingContact;
      shippingOptions = await this.getAppleShippingOptions(shippingAddress);
      const newTotal = {
        label: 'Your Merchant Name',
        amount: '10.00', 
      };

      session.completeShippingContactSelection(ApplePaySession.STATUS_SUCCESS, shippingOptions, newTotal, []);
    }

    // On Select shipping method
    session.onshippingmethodselected = function(event) {
      selectedShippingMethod = event.shippingMethod;
      const newTotal = {
        label: selectedShippingMethod.label,
        amount: selectedShippingMethod.amount,
      };

      session.completeShippingMethodSelection(ApplePaySession.STATUS_SUCCESS, newTotal, []);
    }

    // Step 6: Complete Payment
    session.onpaymentauthorized = async (event) => {
        const shippingAddress = event.payment.shippingContact;
        const updateBuyerIdentity = await this.updateAppleBuyerIdentity(shippingAddress!);
        console.log(shippingAddress);


        const selectedShippingOptionId = selectedShippingMethod.identifier;
        console.log(selectedShippingOptionId);

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
        const result = await this.submitCart({ applePayToken: paymentToken, paymentDetails });
        console.log(result);
        
        // Complete the payment session
        if (false) {
          session.completePayment(ApplePaySession.STATUS_SUCCESS);
        }
    };

    // Start the Apple Pay session
    try {
      console.log(session);
      session.begin();
    } catch (error) {
      console.error('Apple Pay session failed:', error);
    }
  }

  private loadAndInitializeGooglePay(onCartSubmitted: InitParams['onCartSubmitted']) {
    const googlePayScript = document.createElement('script');
    googlePayScript.src = this.googlePayScriptUrl;
    googlePayScript.async = true;
    document.head.appendChild(googlePayScript);

    googlePayScript.onload = () => {
      this.initializeGooglePay(onCartSubmitted);
    };
  }

  private initializeGooglePay(onCartSubmitted: InitParams['onCartSubmitted']) {
    const paymentsClient = new google.payments.api.PaymentsClient({
      environment: 'TEST',
      paymentDataCallbacks: {
        onPaymentDataChanged: this
          .onPaymentDataChanged as google.payments.api.PaymentDataChangedHandler,
      },
    });
    const button = paymentsClient.createButton({
      onClick: () => this.onGooglePayClicked(paymentsClient, onCartSubmitted),
    });

    const buttonContainer = document.getElementById('rye-google-pay');

    if (buttonContainer) {
      buttonContainer.appendChild(button);
    } else {
      this.log('Google Pay button container not found');
    }
  }

  private async updateBuyerIdentity(shippingAddress: google.payments.api.Address) {
    const headers: RequestInit['headers'] = {
      'Content-Type': 'application/json',
      Authorization: await this.getAuthHeader(),
    };

    headers[ryeShopperIpHeaderKey] = '10.10.101.215';

    let buyerIdentity: any = {
      provinceCode: shippingAddress?.administrativeArea ?? '',
      countryCode: shippingAddress?.countryCode ?? '',
      postalCode: shippingAddress?.postalCode ?? '',
    };

    if (shippingAddress.name) {
      buyerIdentity = {
        firstName: shippingAddress?.name?.split(' ')[0] ?? '',
        lastName: shippingAddress?.name?.split(' ')[1] ?? '',
        phone: shippingAddress?.phoneNumber,
        address1: shippingAddress?.address1 ?? '',
        address2: shippingAddress?.address2 ?? '',
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

  private async getShippingOptions(shippingAddress: google.payments.api.Address) {
    const content = await this.updateBuyerIdentity(shippingAddress);
    const shippingOptions =
      content.data.updateCartBuyerIdentity.cart.stores[0].offer.shippingMethods.map(
        (shippingMethod: any) => ({
          id: shippingMethod.id,
          label: shippingMethod.label,
          description: `${shippingMethod.price.displayValue} ${
            shippingMethod.price.currency ?? 'USD'
          }`,
          finalValue: Number(shippingMethod.total.value) / 100,
          currency: shippingMethod.total.currency ?? 'USD',
        })
      );
    return shippingOptions;
  }

  private onPaymentDataChanged = async (
    intermediatePaymentData: google.payments.api.IntermediatePaymentData
  ) => {
    if (intermediatePaymentData.callbackTrigger === 'SHIPPING_OPTION') {
      // Calculate new total price based on selected shipping option
      this.googlePayFinalPrice =
        this.googlePayShippingOptions.find(
          (option: any) => option.id === intermediatePaymentData.shippingOptionData?.id
        )?.finalValue ?? 0;

      return {
        newTransactionInfo: {
          totalPriceStatus: 'FINAL',
          totalPrice: String(this.googlePayFinalPrice),
          currencyCode: this.googlePayFinalCurrency ?? 'USD',
        },
      };
    }

    if (
      (intermediatePaymentData.callbackTrigger === 'INITIALIZE' ||
        intermediatePaymentData.callbackTrigger === 'SHIPPING_ADDRESS') &&
      intermediatePaymentData.shippingAddress
    ) {
      // Update shipping options based on the selected address
      const updatedShippingOptions = await this.getShippingOptions(
        intermediatePaymentData.shippingAddress
      );
      const defaultShipping = updatedShippingOptions[0];
      this.googlePayShippingOptions = updatedShippingOptions;
      this.googlePayFinalPrice = defaultShipping.finalValue;
      this.googlePayFinalCurrency = defaultShipping.currency ?? 'USD';

      return {
        newShippingOptionParameters: {
          defaultSelectedOptionId: defaultShipping.id ?? '',
          shippingOptions: updatedShippingOptions.map((option: any) => ({
            id: option.id,
            label: option.label,
            description: option.description,
          })),
        },
        newTransactionInfo: {
          totalPriceStatus: 'FINAL',
          totalPrice: String(this.googlePayFinalPrice),
          currencyCode: 'USD',
        },
      };
    }

    return {};
  };

  private onGooglePayClicked(
    paymentsClient: google.payments.api.PaymentsClient,
    onCartSubmitted: InitParams['onCartSubmitted']
  ) {
    // Define your Google Pay payment configuration here
    const paymentDataRequest = {
      ...this.googlePayConfig,
      transactionInfo: {
        totalPriceStatus: 'FINAL',
        totalPrice: '10.00',
        currencyCode: 'USD',
      },
      shippingAddressRequired: true,
      shippingAddressParameters: {
        phoneNumberRequired: true, // If you need the user's phone number
      },
      shippingOptionRequired: true,
      merchantInfo: {
        // Merchant information like merchant ID
      },
      callbackIntents: ['SHIPPING_ADDRESS', 'SHIPPING_OPTION'],
    };

    paymentsClient
      .loadPaymentData(paymentDataRequest)
      .then(async (paymentData) => {
        // Extract payment token from paymentData
        const paymentToken = paymentData.paymentMethodData.tokenizationData.token;
        const shippingAddress = paymentData.shippingAddress;
        const updateBuyerIdentity = await this.updateBuyerIdentity(shippingAddress!);
        const selectedShippingOptionId = paymentData.shippingOptionData?.id;

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

        const paymentDetails: SpreedlyAdditionalFields = {
          first_name: shippingAddress?.name?.split(' ')[0] ?? '',
          last_name: shippingAddress?.name?.split(' ')[1] ?? '',
          phone_number: shippingAddress?.phoneNumber,
          month: '',
          year: '',
          address1: shippingAddress?.address1 ?? '',
          address2: shippingAddress?.address2 ?? '',
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

        const result = await this.submitCart({token: paymentToken, paymentDetails});
        onCartSubmitted?.(result.submitCart, result.errors);
      })
      .catch((error) => {
        // Handle any errors that occur during the payment process
        this.log('Payment failed: ', error);
      });
  }

  private subscribeToEvents({
    onReady,
    onFieldChanged,
    onValidate,
    onIFrameError,
    onErrors,
    onCartSubmitted,
  }: InitParams) {
    this.spreedly.removeHandlers();
    // Subscribe to optional events only if developers wants to handle them
    onReady && this.spreedly.on('ready', () => onReady(this.spreedly));
    onFieldChanged && this.spreedly.on('fieldEvent', onFieldChanged);
    onValidate && this.spreedly.on('validation', onValidate);
    onIFrameError && this.spreedly.on('consoleError', onIFrameError);
    onErrors && this.spreedly.on('errors', onErrors);

    // Triggers after tokenizeCreditCard was called
    this.spreedly.on(
      'paymentMethod',
      async (token: string, paymentDetails: SpreedlyAdditionalFields) => {
        this.log(`payment method token: ${token}`);
        const result = await this.submitCart({token, paymentDetails});
        onCartSubmitted?.(result.submitCart, result.errors);
      }
    );
  }

  /**
   * Submits payment details to Rye API. As an intermediate step, the method tokenizes credit card data using Spreedly service.
   * @param paymentDetails
   */
  submit(paymentDetails: RyeSubmitAdditionalFields) {
    if (!paymentDetails.cartId) {
      throw new Error('cartId must be provided');
    }

    this.spreedly.tokenizeCreditCard({
      ...paymentDetails,
      metadata: {
        cartId: paymentDetails.cartId,
        selectedShippingOptions: JSON.stringify(paymentDetails.selectedShippingOptions ?? []),
        shopperIp: paymentDetails.shopperIp,
        experimentalPromoCodes: JSON.stringify(paymentDetails.experimentalPromoCodes),
      },
    });
  }

  /**
   * Reload the iFrame library. This resets and re-initializes all iFrame elements and state and is a convenient way to quickly reset the form.
   * When reload is complete, the ready event will be fired, at which time the iFrame can be customized.
   */
  reload() {
    this.spreedly.reload();
    if (this.initParams) {
      this.subscribeToEvents(this.initParams);
    }
  }

  /**
   * Request iFrame fields to report their validation status. Useful for real-time validation functionality.
   */
  validate() {
    this.spreedly.validate();
  }

  // Field customization methods

  /**
   * Style iFrame fields using CSS.
   */
  setStyle(field: FrameField, style: string) {
    this.spreedly.setStyle(field, style);
  }

  /**
   * Set the input type of the iFrame fields. This is useful to when you want different keyboards to display on mobile devices.
   */
  setFieldType(field: FrameField, type: FieldType) {
    this.spreedly.setFieldType(field, type);
  }

  /**
   * Style iFrame fields’ label. Although the label for each iFrame field is not displayed, it is still used by screen readers and other accessibility devices.
   */
  setLabel(field: FrameField, label: string) {
    this.spreedly.setLabel(field, label);
  }

  /**
   * Set custom iFrame fields’ title attribute. Although the title for each iFrame field is not displayed,
   * it can still be used by screen readers and other accessibility devices.
   */
  setTitle(field: FrameField, title: string) {
    this.spreedly.setTitle(field, title);
  }

  /**
   * Style iFrame fields’ placeholder text.
   */
  setPlaceholder(field: FrameField, placeholder: string) {
    this.spreedly.setPlaceholder(field, placeholder);
  }

  /**
   * Set the value the iFrame fields to a known test value. Any values that are not on the allowed list will be silently rejected.
   */
  setValue(field: FrameField, value: number) {
    this.spreedly.setValue(field, value);
  }

  /**
   * Set the card number format. If set to prettyFormat, the card number value will include spaces in the credit card number as they appear on a physical card.
   * The number field must be set to type text or tel for pretty formatting to take effect.
   */
  setNumberFormat(format: NumberFormat) {
    this.spreedly.setNumberFormat(format);
  }

  /**
   * Toggle autocomplete functionality for card number and cvv fields.
   * By default, the autocomplete attribute is enabled, so the first call of this function will disable autocomplete
   */
  toggleAutoComplete() {
    this.spreedly.toggleAutoComplete();
  }

  /**
   * Set the cursor focus to one of the iFrame fields. This is useful if you want to load your form with the card number field already in focus,
   * or if you want to auto-focus one of the iFrame fields if they contain an input error.
   */
  transferFocus(field: FrameField) {
    this.spreedly.transferFocus(field);
  }

  private getEnvToken = async () => {
    const rawResponse = await fetch(this.cartApiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: await this.getAuthHeader(),
      },
      body: JSON.stringify({
        query: this.envTokenQuery,
      }),
    });
    const content = await rawResponse.json();
    const result: EnvTokenResult = content?.data?.environmentToken;
    return result.token;
  };


  private async submitCart({token, paymentDetails, applePayToken} : SubmitCartParams) {
    const input: CartApiSubmitInput = {
      token: token ?? 'apple_pay_token',
      applePayToken,
      id: paymentDetails.metadata.cartId,
      billingAddress: {
        firstName: paymentDetails.first_name,
        lastName: paymentDetails.last_name,
        address1: paymentDetails.address1,
        address2: paymentDetails.address2,
        city: paymentDetails.city,
        countryCode: paymentDetails.country,
        provinceCode: paymentDetails.state,
        postalCode: paymentDetails.zip,
        phone: paymentDetails.phone_number,
      },
      selectedShippingOptions: paymentDetails.metadata.selectedShippingOptions
        ? JSON.parse(paymentDetails.metadata.selectedShippingOptions)
        : [],
      experimentalPromoCodes: paymentDetails.metadata.experimentalPromoCodes
        ? JSON.parse(paymentDetails.metadata.experimentalPromoCodes)
        : undefined,
    };

    const headers: RequestInit['headers'] = {
      'Content-Type': 'application/json',
      Authorization: await this.getAuthHeader(),
    };

    if (paymentDetails.metadata.shopperIp) {
      headers[ryeShopperIpHeaderKey] = paymentDetails.metadata.shopperIp;
    }

    const rawResponse = await fetch(this.cartApiEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: this.submitCartMutation,
        variables: {
          input,
        },
      }),
    });
    const content = await rawResponse.json();
    const result = {
      submitCart: content?.data?.submitCart as SubmitCartResult,
      errors: content.errors as GraphQLError[],
    };
    return result;
  }

  private hasSpreedlyGlobal() {
    return !!(globalThis as any).Spreedly;
  }

  private async getAuthHeader() {
    if (this.apiKey) {
      return 'Basic ' + btoa(this.apiKey + ':');
    }

    const token = await this.generateJWT!();

    return `Bearer ${token}`;
  }

  private log = (...args: any) => {
    this.enableLogging && console.log(...args);
  };

  private getCartApiEndpoint(env: Environment) {
    switch (env) {
      case 'local':
        return localCartApiEndpoint;
      case 'stage':
        return stageCartApiEndpoint;
      default:
        return prodCartApiEndpoint;
    }
  }
}


// Create a server/webpage 
// Create all certificates and merchant IDs for this