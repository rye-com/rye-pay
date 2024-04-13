import { ApplePay } from './applePay';
import { AuthService } from './authService';
import { CartService } from './cartService';
import { GooglePay } from './googlePay';
import { Logger } from './logger';

import { RyePayError } from './errors';

import type { GenerateJWTFunction, RyeStore } from './types';

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

export interface GraphQLError {
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

type PaymentTokenType = 'APPLE_PAY' | 'GOOGLE_PAY' | 'VAULT';

// RyePay params for init method
export interface InitParams extends SpreedlyInitParams {
  /**
   * This method should hit an endpoint on your backend which generates a valid JWT
   * for use in frontend requests to the Rye API.
   *
   * @see https://docs.rye.com/jwt-authentication
   */
  generateJWT: GenerateJWTFunction;
  numberEl: string;
  cvvEl: string;
  onReady?: (spreedly: Spreedly) => void;
  onErrors?: (errors: SpreedlyError[]) => void;
  onCartSubmitted?: (
    submitCartResult?: SubmitCartResult,
    errors?: GraphQLError[],
    paymentTokenType?: PaymentTokenType
  ) => void;
  onIFrameError?: (error: FrameError) => void;
  onFieldChanged?: (
    name: FrameField,
    type: FrameEventType,
    activeEl: FrameField,
    inputProperties: Partial<InputProperties>
  ) => void;
  onValidate?: (inputProperties: InputProperties) => void;
  /**
   * If `true`, then Rye Pay will log information to the console.
   *
   * Defaults to `true` when running in localhost; `false` otherwise.
   */
  enableLogging?: boolean;
  applePayInputParams?: ApplePayInputParams;
  googlePayInputParams?: GooglePayInputParams;
}

export interface ApplePayInputParams {
  cartId?: string;
  variantId?: string;
  merchantDisplayName: string; // The merchant display name that appears on the Apple Pay sheet.
  merchantDomain: string; // The domain on which the Apple Pay button will appear on.
  displayShippingAddress: boolean;
  applePayButtonStyles?: ApplePayButtonStyles;
}

type ApplePayButtonColor = 'black' | 'white' | 'white-outline';
type ApplePayButtonType =
  | 'plain'
  | 'buy'
  | 'donate'
  | 'check-out'
  | 'book'
  | 'subscribe'
  | 'reload'
  | 'add-money'
  | 'top-up'
  | 'order'
  | 'rent'
  | 'support'
  | 'contribute'
  | 'tip'
  | 'pay'
  | 'setup';

export type ApplePayButtonStyles = {
  buttonColor?: ApplePayButtonColor;
  buttonType?: ApplePayButtonType;
  widthPixels?: string;
  heightPixels?: string;
  borderRadiusPixels?: string;
  paddingPixels?: string;
};

export interface GooglePayInputParams {
  cartId: string;
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
  experimentalPromoCodes?: StorePromoCodes[];
}

// Additional fields that can be submitted together with credit card details
export interface SpreedlyAdditionalFields extends SubmitAdditionalFields {
  metadata: {
    cartId: string;
    selectedShippingOptions?: string;
    experimentalPromoCodes?: string;
  };
}

interface StorePromoCodes {
  store: string;
  promoCodes: string[];
}

export interface CartApiSubmitInput {
  id: string;
  token: string;
  applePayToken?: ApplePayToken;
  googlePayPaymentTokenInput?: GooglePayToken;
  billingAddress: BillingAddress;
  selectedShippingOptions?: SelectedShippingOption[];
  experimentalPromoCodes?: StorePromoCodes[];
}

export interface SubmitCartParams {
  token?: string;
  paymentDetails: SpreedlyAdditionalFields;
  applePayToken?: ApplePayToken;
  googlePayToken?: GooglePayToken;
}

interface GooglePayToken {
  signature: string;
  protocolVersion: string;
  signedMessage: string;
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

export interface GetCartResult {
  id: string;
  cost: {
    subtotal: {
      value: number;
      currency: string;
    };
  };
  stores: RyeStore[];
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

export const ryeShopperIpHeaderKey = 'x-rye-shopper-ip';

export const cartSubmitResponse = `
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
  private readonly submitCartMutation = `mutation submitCart($input: CartSubmitInput!) { submitCart(input: $input) { ${cartSubmitResponse} } } `;
  private readonly envTokenQuery = `query {
    environmentToken {
       token
    }
  }`;
  private spreedly!: Spreedly;
  private authService!: AuthService;
  private envToken = '';
  private logger = new Logger();

  /**
   * Indicates whether the Rye Pay has been initialized.
   */
  public initialized = false;

  private initParams: InitParams | undefined;

  /**
   * Initializes Rye Pay.
   *
   * This method should be called before calling any other methods of Rye Pay.
   */
  init(params: InitParams) {
    this.initParams = params;

    const {
      generateJWT,
      numberEl,
      cvvEl,
      onErrors,
      enableLogging,
      applePayInputParams,
      googlePayInputParams,
    } = params;

    if (this.initializing) {
      return;
    }
    if (this.initialized) {
      this.reload();
      return;
    }

    this.initializing = true;
    this.envToken = '';

    if (!generateJWT) {
      const errorMsg = 'The `generateJWT` must be provided when initializing Rye Pay.';
      if (onErrors) {
        onErrors([
          {
            attribute: 'generateJWT',
            key: 'errors.blank',
            message: errorMsg,
          },
        ]);
        return;
      }

      throw new RyePayError({
        code: 'INVALID_CONFIG',
        message: errorMsg,
      });
    }

    this.authService = AuthService.getInstance(generateJWT);

    if (this.hasSpreedlyGlobal()) {
      return;
    }

    if (typeof enableLogging === 'boolean') {
      this.logger.setEnabled(enableLogging);
    }

    const script = document.createElement('script');
    document.head.appendChild(script);

    const scriptLoadingErrorMsg = 'Error loading Spreedly';
    script.onerror = (error) => {
      throw new RyePayError({
        cause: error,
        code: 'LOAD_FAILED',
        message: scriptLoadingErrorMsg,
      });
    };
    script.onload = async () => {
      if (!this.hasSpreedlyGlobal()) {
        throw new RyePayError({
          code: 'LOAD_FAILED',
          message: scriptLoadingErrorMsg,
        });
      }

      this.spreedly = (globalThis as any).Spreedly;
      this.envToken = await this.getEnvToken();
      this.subscribeToEvents(params);

      this.spreedly.init(this.envToken, {
        numberEl,
        cvvEl,
      });

      this.initializing = false;
      this.initialized = true;
      this.logger.log('Spreedly initialized');
    };

    // trigger script loading
    script.src = this.spreedlyScriptUrl;

    const cartService = new CartService(this.authService);

    // Initialize GooglePay if the button is present
    if (document.getElementById('rye-google-pay')) {
      // If GooglePayInputParams are not set, google pay cannot be instantiated
      if (!googlePayInputParams) {
        this.logger.warn('googlePayInputParams must be provided');
      } else {
        const googlePay = new GooglePay({
          cartService,
          googlePayInputParams,
          logger: this.logger,
          spreedlyEnvironmentKey: this.envToken,
          onCartSubmitted: params.onCartSubmitted,
        });

        googlePay.loadGooglePay();
      }
    }

    // Initialize ApplePay if the button is present
    if (document.getElementById('rye-apple-pay')) {
      // If ApplePayInputParams are not set, apple pay cannot be instantiated
      if (!applePayInputParams) {
        this.logger.warn('applePayInputParams must be provided');
      } else {
        const applePay = new ApplePay({
          applePayInputParams,
          cartService,
          logger: this.logger,
          submitCart: this.submitCart,
          onCartSubmitted: params.onCartSubmitted,
        });

        applePay.loadApplePay();
      }
    }
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
        const result = await this.submitCart({ token, paymentDetails });
        onCartSubmitted?.(result.submitCart, result.errors, 'VAULT');
      }
    );
  }

  /**
   * Submits payment details to Rye API. As an intermediate step, the method tokenizes credit card data using Spreedly service.
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
    const requestOptions = await this.authService.makeRequestOptions();
    const rawResponse = await fetch(requestOptions.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...requestOptions.headers,
      },
      body: JSON.stringify({
        query: this.envTokenQuery,
      }),
    });
    const content = await rawResponse.json();
    const result: EnvTokenResult = content?.data?.environmentToken;
    return result.token;
  };

  private async submitCart({ token, paymentDetails, applePayToken }: SubmitCartParams) {
    const input: CartApiSubmitInput = {
      token: token ?? 'apple_pay_token', // Token is still a required param even if method is ApplePay even though it is not used, so we set it to a dummy value. Will be changed in the future.
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

    const requestOptions = await this.authService.makeRequestOptions();

    const rawResponse = await fetch(requestOptions.url, {
      method: 'POST',
      headers: {
        ...requestOptions.headers,
        'Content-Type': 'application/json',
      },
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
}
