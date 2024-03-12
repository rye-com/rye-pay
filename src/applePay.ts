import { CartService } from './cartService';
import {
  APPLE_PAY_MERCHANT_IDENTIFIER,
  APPLE_PAY_SCRIPT_URL,
  APPLE_PAY_SERVER_URL,
  APPLE_PAY_VERSION,
} from './constants';
import {
  ApplePayInputParams,
  InitParams,
  SpreedlyAdditionalFields,
  SubmitCartParams,
} from './rye-pay';
import { ShippingMethod, RyeStore } from './types';

export type ApplePayParams = {
  cartApiEndpoint: string;
  applePayInputParams: ApplePayInputParams;
  submitCart: (params: SubmitCartParams) => Promise<any>;
  onCartSubmitted: InitParams['onCartSubmitted'];
  log: (...args: any) => void;
};

type RyeAppleShippingMethod = ApplePayJS.ApplePayShippingMethod & {
  shipping: {
    amount: number;
  };
  taxes: {
    amount: string;
  };
  total: {
    amount: string;
  };
};

/* The ApplePay class is responsible for handling Apple Pay transactions, including initializing Apple
Pay, validating the merchant, selecting shipping options, selecting shipping methods, and
authorizing payment. */
export class ApplePay {
  private cartApiEndpoint: string;
  private applePayInputParams: ApplePayInputParams;
  private onCartSubmitted: InitParams['onCartSubmitted'];
  private log: (...args: any) => void;
  private applePaySession: ApplePaySession | undefined;
  private shippingOptions: RyeAppleShippingMethod[] = [];
  private selectedShippingMethod: ApplePayJS.ApplePayShippingMethod | undefined;
  private cartService: CartService;
  private cartSubtotal: number | undefined;
  private cartCurrency: string = 'USD';
  private cartHasMultipleStores: boolean = false;
  private cartShippingMethods: ShippingMethod[] = [];
  private cartId: string = '';

  constructor({ cartApiEndpoint, applePayInputParams, onCartSubmitted, log }: ApplePayParams) {
    this.cartApiEndpoint = cartApiEndpoint;
    this.applePayInputParams = applePayInputParams;
    this.onCartSubmitted = onCartSubmitted;
    this.log = log;
    this.cartService = CartService.getInstance(this.cartApiEndpoint);
  }

  /**
   * Load Apple Pay and fetch the cart subtotal and currency
   */

  loadApplePay = async () => {
    const { cartId, variantId, shopperIp } = this.applePayInputParams;

    if (!cartId && !variantId) {
      this.log('Cart ID or Variant ID must be provided');
      return;
    }

    try {
      // Create cart if cartID was not provided and variantID was provided, otherwise fetch cart with the cartID
      const cartResponse = cartId
        ? await this.cartService.getCart(cartId, shopperIp)
        : await this.cartService.createCart(variantId!, shopperIp);

      this.cartSubtotal = Number(cartResponse.cart.cost.subtotal.value) / 100;
      this.cartCurrency = cartResponse.cart.cost.subtotal.currency;

      this.cartHasMultipleStores = cartResponse.cart.stores.length > 1;
      this.cartId = cartId ?? cartResponse.cart.id;

      const storeWithoutShippingMethod =
        cartResponse.cart.stores.find((store: RyeStore) => !store.offer.selectedShippingMethod) ??
        null;

      // Cart has multiple stores and at least one store does not have a shipping method selected
      if (this.cartHasMultipleStores && storeWithoutShippingMethod) {
        this.log(
          'Shipping methods need to be selected for all stores in cart to display Apple Pay button.'
        );
      } else {
        this.loadApplePayScript();
      }
    } catch (error) {
      this.log(`Error ${cartId ? 'fetching' : 'creating'} cart: ${error}`);
    }
  };

  loadApplePayScript = () => {
    const applePayScript = document.createElement('script');
    applePayScript.src = APPLE_PAY_SCRIPT_URL;
    document.head.appendChild(applePayScript);
    applePayScript.onload = () => {
      this.initializeApplePay();
    };
  };

  /**
   * Initialize Apple Pay by checking if the device supports it and creating an Apple Pay
   * button if it does.
   */
  private initializeApplePay = () => {
    if ('ApplePaySession' in window) {
      ApplePaySession.canMakePaymentsWithActiveCard(APPLE_PAY_MERCHANT_IDENTIFIER).then(
        (canMakePayments) => {
          if (canMakePayments) {
            // Create Apple Pay button
            const buttonContainer = document.getElementById('rye-apple-pay');
            const button = document.createElement('apple-pay-button');
            button.setAttribute(
              'buttonstyle',
              `${this.applePayInputParams.applePayButtonStyles?.buttonColor ?? 'black'}`
            );
            button.setAttribute(
              'type',
              `${this.applePayInputParams.applePayButtonStyles?.buttonType ?? 'buy'}`
            );
            this.setApplePayStyles();
            button.onclick = async () => await this.onApplePayClicked();

            if (buttonContainer) {
              buttonContainer.appendChild(button);
            } else {
              this.log('Apple Pay button container not found');
            }
          }
        }
      );
    }
  };

  /**
   * The function handles the process of initiating an Apple Pay session and performing various
   * actions during the session, such as validating the merchant, selecting shipping options, selecting
   * shipping methods, and authorizing payment.
   * @returns: void
   */
  private onApplePayClicked = () => {
    // Check for ApplePaySession availability
    if (typeof ApplePaySession === 'undefined') {
      this.log('Apple Pay is not available on this device/browser.');
      return;
    }
    // Define the Apple Pay payment request
    const merchantCapabilities: ApplePayJS.ApplePayMerchantCapability[] = ['supports3DS'];

    const emptyShippingFields =
      this.cartHasMultipleStores || !this.applePayInputParams.displayShippingAddress;

    const requiredShippingContactFields: ApplePayJS.ApplePayContactField[] = emptyShippingFields
      ? []
      : ['email', 'name', 'phone', 'postalAddress'];
    const paymentRequest: ApplePayJS.ApplePayPaymentRequest = {
      countryCode: 'US',
      currencyCode: this.cartCurrency,
      supportedNetworks: ['visa', 'masterCard', 'amex', 'discover'],
      merchantCapabilities,
      total: {
        label: this.applePayInputParams.merchantDisplayName ?? '',
        amount: `${this.cartSubtotal}`,
      },
      requiredShippingContactFields,
      requiredBillingContactFields: ['email', 'name', 'phone', 'postalAddress'],
      shippingMethods: [],
    };

    // Create an ApplePaySession
    this.applePaySession = new ApplePaySession(APPLE_PAY_VERSION, paymentRequest);

    // Validate merchant
    this.applePaySession.onvalidatemerchant = (event) => this.onValidateMerchant(event);

    if (!this.cartHasMultipleStores) {
      // Fetch shipping options when shipping contact is selected or changed
      this.applePaySession.onshippingcontactselected = (event) =>
        this.onShippingContactSelected(event);

      // Update shipping method when shipping method is selected or changed
      this.applePaySession.onshippingmethodselected = (event) =>
        this.onShippingMethodSelected(event);
    }

    // Authorize payment
    this.applePaySession.onpaymentauthorized = (event) => this.onPaymentAuthorized(event);

    // Start the Apple Pay session
    try {
      this.applePaySession.begin();
    } catch (error) {
      this.log('Apple Pay session failed:', error);
    }
  };

  /**
   * The `onValidateMerchant` function handles the validation of a merchant for Apple Pay.
   * @param event - The `event` parameter in the `onValidateMerchant` function is of type
   * `ApplePayJS.ApplePayValidateMerchantEvent`. This event is triggered when the Apple Pay session
   * needs to validate the merchant.
   */
  private onValidateMerchant = async (event: ApplePayJS.ApplePayValidateMerchantEvent) => {
    try {
      const result = await fetch(APPLE_PAY_SERVER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          mode: 'cors',
        },
        body: JSON.stringify({
          appleValidationUrl: event.validationURL,
          merchantDisplayName: this.applePayInputParams.merchantDisplayName,
          merchantDomain: this.applePayInputParams.merchantDomain,
        }),
      });

      const merchantValidationResult = await result.json();
      this.applePaySession?.completeMerchantValidation(merchantValidationResult);
    } catch (e) {
      this.log('Merchant validation failed:', e);
    }
  };

  /**
   * The function `onShippingContactSelected` handles the event when a shipping contact is selected in
   * an Apple Pay session, retrieves shipping options based on the selected address, and completes the
   * shipping contact selection process.
   * @param event - The event parameter is of type ApplePayJS.ApplePayShippingContactSelectedEvent. It
   * represents the event that is triggered when the user selects a shipping contact during the Apple
   * Pay checkout process.
   */
  private onShippingContactSelected = async (
    event: ApplePayJS.ApplePayShippingContactSelectedEvent
  ) => {
    const shippingAddress = event.shippingContact;
    this.shippingOptions = await this.getAppleShippingOptions(shippingAddress);
    const newTotal = {
      label: this.applePayInputParams.merchantDisplayName ?? '',
      amount: `${this.cartSubtotal}`,
    };

    this.applePaySession?.completeShippingContactSelection(
      ApplePaySession.STATUS_SUCCESS,
      this.shippingOptions,
      newTotal,
      [] // Apple Pay Line items to display on the pay sheet
    );
  };

  /**
   * The `onShippingMethodSelected` function handles the event when a shipping method is selected in an
   * Apple Pay session.
   * @param event - The event parameter is of type ApplePayJS.ApplePayShippingMethodSelectedEvent. It
   * represents the event that is triggered when a shipping method is selected by the user during the
   * Apple Pay checkout process.
   * @returns nothing (void).
   */
  private onShippingMethodSelected = (event: ApplePayJS.ApplePayShippingMethodSelectedEvent) => {
    this.selectedShippingMethod = event.shippingMethod;
    const selectedShippingOption =
      this.shippingOptions.find(
        (option) => option.identifier === this.selectedShippingMethod?.identifier
      ) ?? this.shippingOptions?.at(0);

    const finalAmount = selectedShippingOption?.total.amount;

    if (!finalAmount) {
      this.log('Error calculating total cost including shipping method');
      return;
    }

    const newTotal = {
      label: this.applePayInputParams.merchantDisplayName ?? '',
      amount: finalAmount,
    };

    console.log(selectedShippingOption);

    const newLineItems = [
      {
        type: 'final' as ApplePayJS.ApplePayLineItemType,
        label: 'Subtotal',
        amount: `${this.cartSubtotal}`,
      },
      {
        type: 'final' as ApplePayJS.ApplePayLineItemType,
        label: 'Shipping',
        amount: `${selectedShippingOption.shipping.amount}`,
      },
      {
        type: 'final' as ApplePayJS.ApplePayLineItemType,
        label: 'Taxes',
        amount: `${selectedShippingOption.taxes.amount}`,
      },
    ];

    this.applePaySession?.completeShippingMethodSelection(
      ApplePaySession.STATUS_SUCCESS,
      newTotal,
      newLineItems
    );
  };

  /**
   * The `onPaymentAuthorized` function handles the authorization of an Apple Pay payment and submits
   * the cart with the payment details.
   * @param event - The `event` parameter is of type `ApplePayJS.ApplePayPaymentAuthorizedEvent`. It
   * represents the event that is triggered when the payment is authorized in Apple Pay.
   */
  private onPaymentAuthorized = async (event: ApplePayJS.ApplePayPaymentAuthorizedEvent) => {
    const address = event.payment.billingContact ?? event.payment.shippingContact;
    let selectedShippingOptions = [];

    // BuyerIdentity for cart is only required if the cart has multiple stores.
    // If cart has multiple stores, all shipping options must have already been selected, no reason to update buyer identity again.
    if (!this.cartHasMultipleStores) {
      const updateBuyerIdentityResponse = await this.cartService.updateBuyerIdentity(
        this.cartId,
        event.payment.shippingContact!,
        this.applePayInputParams.shopperIp
      );
      const selectedShippingOptionId = this.selectedShippingMethod?.identifier;

      selectedShippingOptions =
        updateBuyerIdentityResponse.data.updateCartBuyerIdentity.cart.stores.map(
          (store: RyeStore) => {
            const option = store.offer.shippingMethods.find(
              (shippingMethod: ShippingMethod) => shippingMethod.id === selectedShippingOptionId
            );
            return {
              store: store.store,
              shippingId: option?.id,
            };
          }
        );
    }

    const paymentToken = event.payment.token.paymentData;
    const paymentDetails: SpreedlyAdditionalFields = {
      first_name: address?.givenName ?? '',
      last_name: address?.familyName ?? '',
      phone_number: event?.payment?.shippingContact?.phoneNumber ?? '',
      month: '', // For Apple Pay we don't need to pass in CC month
      year: '', // For Apple Pay we don't need to pass in CC year
      address1: address?.addressLines?.at(0) ?? '',
      address2: address?.addressLines?.at(1) ?? '',
      city: address?.locality ?? '',
      state: address?.administrativeArea ?? '',
      zip: address?.postalCode ?? '',
      country: address?.countryCode ?? '',
      metadata: {
        cartId: this.cartId,
        selectedShippingOptions: JSON.stringify(
          this.cartHasMultipleStores ? this.cartShippingMethods : selectedShippingOptions
        ),
        shopperIp: this.applePayInputParams.shopperIp,
      },
    };

    const result = await this.cartService.submitCart({
      applePayToken: paymentToken,
      paymentDetails,
    });

    this.onCartSubmitted?.(result.submitCart, result.errors, 'APPLE_PAY');
    const failedStore = result.submitCart.cart.stores[0].status === 'PAYMENT_FAILED';

    this.applePaySession?.completePayment(
      result.error || failedStore ? ApplePaySession.STATUS_FAILURE : ApplePaySession.STATUS_SUCCESS
    );
  };

  /**
   * The function `getAppleShippingOptions` retrieves shipping options for an Apple Pay transaction
   * based on the provided shipping address.
   * @param shippingAddress - The `shippingAddress` parameter is of type
   * `ApplePayJS.ApplePayPaymentContact` and represents the shipping address provided by the user
   * during the Apple Pay checkout process.
   * @returns an array of shipping options. Each shipping option is an object with properties such as
   * identifier, label, detail, amount, and total.
   */
  private getAppleShippingOptions = async (shippingAddress: ApplePayJS.ApplePayPaymentContact) => {
    const content = await this.cartService.updateBuyerIdentity(
      this.cartId,
      shippingAddress,
      this.applePayInputParams.shopperIp
    );
    const shippingOptions =
      content?.data?.updateCartBuyerIdentity?.cart?.stores
        ?.at(0)
        ?.offer?.shippingMethods?.map((shippingMethod: ShippingMethod) => ({
          identifier: shippingMethod.id,
          label: shippingMethod.label,
          detail: `${shippingMethod.price.displayValue} ${shippingMethod.price.currency ?? 'USD'}`,
          amount: Number(shippingMethod.price.value) / 100,
          shipping: {
            amount: Number(shippingMethod.price.value) / 100,
          },
          taxes: {
            amount: Number(shippingMethod.taxes.value) / 100,
          },
          total: {
            amount: Number(shippingMethod.total.value) / 100,
          },
        })) ?? [];
    return shippingOptions;
  };

  private setApplePayStyles = () => {
    const style = document.createElement('style');
    const appliedStyles = this.applePayInputParams?.applePayButtonStyles;
    style.type = 'text/css';
    style.textContent = `
      apple-pay-button {
        --apple-pay-button-width: ${appliedStyles?.widthPixels ?? '150px'};
        --apple-pay-button-height: ${appliedStyles?.heightPixels ?? '30px'};
        --apple-pay-button-border-radius: ${appliedStyles?.borderRadiusPixels ?? '3px'};
        --apple-pay-button-padding: ${appliedStyles?.paddingPixels ?? '0px 0 px'};
      }
    `;
    document.head.appendChild(style);
  };
}
