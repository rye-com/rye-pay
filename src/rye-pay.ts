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
  apiKey: string;
  numberEl: string;
  cvvEl: string;
  onReady?: () => void;
  onErrors?: (errors: SpreedlyError[]) => void;
  onCartSubmitted?: (cart: SubmitCartResult) => void;
  onIFrameError?: (error: FrameError) => void;
  onFieldChanged?: (
    name: FrameField,
    type: FrameEventType,
    activeEl: FrameField,
    inputProperties: InputProperties
  ) => void;
  onValidate?: (inputProperties: InputProperties) => void;
  enableLogging?: boolean;
  environment?: Environment;
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
  shopperIp: string;
  // promoCodes: PromoCode[]; TODO: uncomment once promo codes are supported by backend
}

// Additional fields that can be submitted together with credit card details
interface SpreedlyAdditionalFields extends SubmitAdditionalFields {
  metadata: {
    cartId: string;
    selectedShippingOptions?: string;
    shopperIp: string;
    // promoCodes?: string; TODO: uncomment once promo codes are supported by backend
  };
}

interface PromoCode {
  store: string;
  code: string;
}

interface CartApiSubmitInput {
  id: string;
  token: string;
  billingAddress: BillingAddress;
  selectedShippingOptions?: SelectedShippingOption[];
  // promoCodes?: PromoCode[]; TODO: uncomment once promo codes are supported by backend
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

export interface SubmitCartResult {
  id: string;
  stores: SubmitStoreResult[];
}

export interface SubmitStoreResult {
  store: Store;
  status: SubmitStoreStatus;
  requestId?: string;
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
  process.env.CART_API_PRODUCTION_URL ??
  'https://cart-core-subgraph-ggymj6kjkq-uc.a.run.app/graphql';
const stageCartApiEndpoint =
  process.env.CART_API_STAGING_URL ?? 'https://cart-core-subgraph-l46hfxmk6q-uc.a.run.app/graphql';
const localCartApiEndpoint = 'http://localhost:3000/graphql';
const ryeShopperIpHeaderKey = 'x-rye-shopper-ip';

const cartSubmitResponse = `
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
}`;

export class RyePay {
  private initialized = false;
  private readonly spreedlyScriptUrl = 'https://core.spreedly.com/iframe/iframe-v1.min.js';
  private readonly submitCartMutation = `mutation submitCart($input: CartSubmitInput!) { submitCart(input: $input) { ${cartSubmitResponse} } } `;
  private cartApiEndpoint = prodCartApiEndpoint;
  private spreedly!: Spreedly;
  private apiKey!: string;
  private enableLogging: boolean = false;

  init({
    apiKey,
    numberEl,
    cvvEl,
    onReady,
    onErrors,
    onFieldChanged,
    onIFrameError,
    onValidate,
    onCartSubmitted,
    enableLogging = false,
    environment = 'prod',
  }: InitParams) {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    if (!apiKey) {
      const errorMsg = "apiKey can't be blank";
      if (onErrors) {
        onErrors([
          {
            attribute: 'apiKey',
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

      // Subscribe to optional events only if developers wants to handle them
      onReady && this.spreedly.on('ready', onReady);
      onFieldChanged && this.spreedly.on('fieldEvent', onFieldChanged);
      onValidate && this.spreedly.on('validation', onValidate);
      onIFrameError && this.spreedly.on('consoleError', onIFrameError);
      onErrors && this.spreedly.on('errors', onErrors);

      // Triggers after tokenizeCreditCard was called
      this.spreedly.on(
        'paymentMethod',
        async (token: string, paymentDetails: SpreedlyAdditionalFields) => {
          this.log(`payment method token: ${token}`);
          const result = await this.submitCart(token, paymentDetails);
          onCartSubmitted?.(result);
        }
      );

      this.spreedly.init(envToken, {
        numberEl,
        cvvEl,
      });

      this.log('Spreedly initialized');
    };

    // trigger script loading
    script.src = this.spreedlyScriptUrl;

    this.log('RyePay initialized');
  }

  submit(paymentDetails: RyeSubmitAdditionalFields) {
    if (!paymentDetails.cartId) {
      throw new Error('cartId must be provided');
    }

    if (!paymentDetails.shopperIp) {
      throw new Error('shopperIp must be provided');
    }

    this.spreedly.tokenizeCreditCard({
      ...paymentDetails,
      metadata: {
        cartId: paymentDetails.cartId,
        selectedShippingOptions: JSON.stringify(paymentDetails.selectedShippingOptions ?? []),
        shopperIp: paymentDetails.shopperIp,
        // promoCodes: JSON.stringify(paymentDetails.promoCodes), TODO: uncomment once promo codes are supported by backend
      },
    });
  }

  reload() {
    this.spreedly.reload();
  }

  validate() {
    this.spreedly.validate();
  }

  // Field customization methods
  setStyle(field: FrameField, style: string) {
    this.spreedly.setStyle(field, style);
  }

  setFieldType(field: FrameField, type: FieldType) {
    this.spreedly.setFieldType(field, type);
  }

  setLabel(field: FrameField, label: FieldType) {
    this.spreedly.setLabel(field, label);
  }

  setTitle(field: FrameField, title: FieldType) {
    this.spreedly.setTitle(field, title);
  }

  setPlaceholder(field: FrameField, placeholder: FieldType) {
    this.spreedly.setPlaceholder(field, placeholder);
  }
  setValue(field: FrameField, value: number) {
    this.spreedly.setValue(field, value);
  }

  setNumberFormat(format: NumberFormat) {
    this.spreedly.setNumberFormat(format);
  }

  toggleAutoComplete() {
    this.spreedly.toggleAutoComplete();
  }

  transferFocus(field: FrameField) {
    this.spreedly.transferFocus(field);
  }

  private getEnvToken = async () => {
    const origin = new URL(this.cartApiEndpoint).origin;
    const url = `${origin}/v1/spreedly/env-token`;
    const rawResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.getBasicAuthHeader(),
      },
    });
    const content = await rawResponse.json();
    return content?.token;
  };

  private async submitCart(token: string, paymentDetails: SpreedlyAdditionalFields) {
    const input: CartApiSubmitInput = {
      token,
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
      // promoCodes: paymentDetails.metadata.promoCodes
      //   ? JSON.parse(paymentDetails.metadata.promoCodes)
      //   : undefined, TODO: uncomment once promo codes are supported by backend
    };

    const rawResponse = await fetch(this.cartApiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.getBasicAuthHeader(),
        [ryeShopperIpHeaderKey]: paymentDetails.metadata.shopperIp,
      },
      body: JSON.stringify({
        query: this.submitCartMutation,
        variables: {
          input,
        },
      }),
    });
    const content = await rawResponse.json();
    const result: SubmitCartResult = content?.data?.submitCart;
    return result;
  }

  private hasSpreedlyGlobal() {
    return !!(globalThis as any).Spreedly;
  }

  private getBasicAuthHeader() {
    return 'Basic ' + btoa(this.apiKey + ':');
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
