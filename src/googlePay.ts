import { CartService } from './cartService';
import { GOOGLE_PAY_SCRIPT_URL } from './constants';
import type { Logger } from './logger';
import { GooglePayInputParams, InitParams, SpreedlyAdditionalFields } from './rye-pay';

import type { RyeStore, ShippingMethod } from './types';

export type GooglePayParams = {
  cartService: CartService;
  googlePayInputParams: GooglePayInputParams;
  logger: Logger;
  spreedlyEnvironmentKey: string;
  onCartSubmitted: InitParams['onCartSubmitted'];
};

/* The GooglePay class is responsible for handling the integration of Google Pay into a web
application, including loading the Google Pay script, initializing Google Pay, and handling payment
data changes and user interactions. */
export class GooglePay {
  private onCartSubmitted: InitParams['onCartSubmitted'];
  private spreedlyEnvironmentKey: string;
  private cartService: CartService;
  private googlePayInputParams: GooglePayInputParams;
  private googlePayFinalPrice: number = 0;
  private googlePayFinalCurrency: string = 'USD';
  private googlePayShippingOptions: any[] = [];
  private logger: Logger;
  private cartSubtotal: number | undefined;
  private cartCurrency: string = 'USD';
  private cartHasMultipleStores: boolean = false;
  private cartShippingMethods: ShippingMethod[] = [];

  constructor({
    cartService,
    googlePayInputParams,
    logger,
    spreedlyEnvironmentKey,
  }: GooglePayParams) {
    this.cartService = cartService;
    this.googlePayInputParams = googlePayInputParams;
    this.spreedlyEnvironmentKey = spreedlyEnvironmentKey;
    this.logger = logger;
  }

  /**
   * The function loads the Google Pay script and initializes Google Pay after fetching the cart cost.
   */
  loadGooglePay = async () => {
    try {
      const getCartResponse = await this.cartService.getCart(this.googlePayInputParams.cartId);

      this.cartSubtotal = Number(getCartResponse.cart.cost.subtotal.value) / 100;
      this.cartCurrency = getCartResponse.cart.cost.subtotal.currency;
      this.cartHasMultipleStores = getCartResponse.cart.stores.length > 1;
      const storeWithoutShippingMethod =
        getCartResponse.cart.stores.find(
          (store: RyeStore) => !store.offer.selectedShippingMethod,
        ) ?? null;

      if (this.cartHasMultipleStores && storeWithoutShippingMethod) {
        this.logger.error(
          'Shipping methods need to be selected for all stores in cart to display Google Pay button.',
        );
      } else {
        // Show the Apple Pay button
        const googlePayScript = document.createElement('script');
        googlePayScript.src = GOOGLE_PAY_SCRIPT_URL;
        googlePayScript.async = true;
        document.head.appendChild(googlePayScript);

        googlePayScript.onload = () => {
          this.initializeGooglePay();
        };
      }
    } catch (error) {
      this.logger.error(`Error fetching cart cost: ${error}`);
    }
  };

  /**
   * The function initializes the Google Pay API by creating a PaymentsClient and a button, and then
   * appends the button to a specified container element.
   */
  private initializeGooglePay = () => {
    let config = {};
    // If cart has multiple stores, we do not want to let users update shipping address or shipping options
    // So there's no need to pass the onPaymentDataChanged callback
    if (!this.cartHasMultipleStores) {
      config = {
        paymentDataCallbacks: {
          onPaymentDataChanged: this
            .onPaymentDataChanged as google.payments.api.PaymentDataChangedHandler,
        },
      };
    }

    const paymentsClient = new google.payments.api.PaymentsClient({
      environment: 'TEST', // TODO: needs to be updated to production when approval is granted
      ...config,
    });
    const button = paymentsClient.createButton({
      onClick: async () => await this.onGooglePayClicked(paymentsClient),
    });

    const buttonContainer = document.getElementById('rye-google-pay');

    if (buttonContainer) {
      buttonContainer.appendChild(button);
    } else {
      this.logger.warn('Google Pay button container not found');
    }
  };

  /**
   * The function `getGooglePayShippingOptions` retrieves shipping options for Google Pay based on the
   * provided shipping address.
   * @param shippingAddress - The `shippingAddress` parameter is an object of type
   * `google.payments.api.Address` that represents the shipping address provided by the user.
   * @returns an array of shipping options. Each shipping option has the following properties: id,
   * label, description, finalValue, and currency.
   */
  private getGooglePayShippingOptions = async (shippingAddress: google.payments.api.Address) => {
    const content = await this.cartService.updateBuyerIdentity(
      this.googlePayInputParams.cartId,
      shippingAddress!,
    );

    return (
      content?.data?.updateCartBuyerIdentity?.cart?.stores
        ?.at(0)
        ?.offer?.shippingMethods?.map((shippingMethod: ShippingMethod) => ({
          id: shippingMethod.id,
          label: shippingMethod.label,
          description: `${shippingMethod.price.displayValue} ${
            shippingMethod.price.currency ?? 'USD'
          }`,
          finalValue: Number(shippingMethod.total.value) / 100,
          currency: shippingMethod.total.currency ?? 'USD',
        })) ?? []
    );
  };

  /**
   * The function `onPaymentDataChanged` handles different callback triggers and performs specific
   * actions based on the trigger type.
   * @param intermediatePaymentData - The parameter `intermediatePaymentData` is an object of type
   * `google.payments.api.IntermediatePaymentData`. It contains information about the payment data and
   * the trigger that caused the callback.
   * @returns a Promise that resolves to a `google.payments.api.PaymentDataRequestUpdate` object or an empty object ({}) if none of the conditions are met.
   */
  private onPaymentDataChanged = async (
    intermediatePaymentData: google.payments.api.IntermediatePaymentData,
  ): Promise<google.payments.api.PaymentDataRequestUpdate> => {
    // If cart has multiple stores, we do not want to let users update shipping address or shipping options
    if (this.cartHasMultipleStores) {
      return {};
    }

    if (intermediatePaymentData.callbackTrigger === 'SHIPPING_OPTION') {
      return this.onShippingOptionChanged(intermediatePaymentData);
    }

    if (
      (intermediatePaymentData.callbackTrigger === 'INITIALIZE' ||
        intermediatePaymentData.callbackTrigger === 'SHIPPING_ADDRESS') &&
      intermediatePaymentData.shippingAddress
    ) {
      return await this.onShippingAddressChanged(intermediatePaymentData);
    }

    return {};
  };

  /**
   * The `onGooglePayClicked` function handles the payment process using Google Pay, including
   * extracting payment information, updating buyer identity, selecting shipping options, and
   * submitting the cart.
   * @param paymentsClient - The `paymentsClient` parameter is an instance of the
   * `google.payments.api.PaymentsClient` class. It is used to interact with the Google Pay API and
   * perform payment-related operations, such as loading payment data and initiating payment
   * transactions.
   */
  private onGooglePayClicked = async (paymentsClient: google.payments.api.PaymentsClient) => {
    try {
      const paymentData = await paymentsClient.loadPaymentData(
        this.getGooglePayPaymentDataRequest(),
      );

      // Extract payment token from paymentData
      const paymentToken = paymentData.paymentMethodData.tokenizationData.token;
      const shippingAddress = paymentData.shippingAddress;

      let selectedShippingOptions = [];

      // BuyerIdentity for cart is only required if the cart has multiple stores.
      // If cart has multiple stores, all shipping options must have already been selected, no reason to update buyer identity again.
      if (!this.cartHasMultipleStores) {
        // Update buyer identity with the complete shipping address
        const updateBuyerIdentityResponse = await this.cartService.updateBuyerIdentity(
          this.googlePayInputParams.cartId,
          shippingAddress!,
        );

        // Get the selected shipping option
        const selectedShippingOptionId = paymentData.shippingOptionData?.id;
        selectedShippingOptions =
          updateBuyerIdentityResponse.data.updateCartBuyerIdentity.cart.stores.map((store: any) => {
            const option = store.offer.shippingMethods.find(
              (shippingMethod: any) => shippingMethod.id === selectedShippingOptionId,
            );
            return {
              store: store.store,
              shippingId: option.id,
            };
          });
      }

      const paymentDetails: SpreedlyAdditionalFields = {
        first_name: shippingAddress?.name?.split(' ')[0] ?? '',
        last_name: shippingAddress?.name?.split(' ')[1] ?? '',
        phone_number: shippingAddress?.phoneNumber,
        month: '', // Empty values for month because Google Pay does not provide this information
        year: '', // Empty values for year because Google Pay does not provide this information
        address1: shippingAddress?.address1 ?? '',
        address2: shippingAddress?.address2 ?? '',
        city: shippingAddress?.locality ?? '',
        state: shippingAddress?.administrativeArea ?? '',
        zip: shippingAddress?.postalCode ?? '',
        country: shippingAddress?.countryCode ?? '',
        metadata: {
          cartId: this.googlePayInputParams.cartId,
          selectedShippingOptions: JSON.stringify(
            this.cartHasMultipleStores ? this.cartShippingMethods : selectedShippingOptions,
          ),
        },
      };

      const result = await this.cartService.submitCart({
        googlePayToken: JSON.parse(paymentToken),
        paymentDetails,
      });
      this.onCartSubmitted?.(result.submitCart, result.errors, 'GOOGLE_PAY');
    } catch (error) {
      // Handle any errors that occur during the payment process
      this.logger.error('Payment failed: ', JSON.stringify(error));
    }
  };

  /**
   * The function calculates the new total price based on the selected shipping option and returns an
   * updated payment data request.
   * @param intermediatePaymentData - The `intermediatePaymentData` parameter is an object of type
   * `google.payments.api.IntermediatePaymentData`. It contains information about the selected shipping
   * option, such as the ID of the option (`shippingOptionData?.id`).
   * @returns a Promise that resolves to a `google.payments.api.PaymentDataRequestUpdate` object.
   */
  private onShippingOptionChanged = (
    intermediatePaymentData: google.payments.api.IntermediatePaymentData,
  ): google.payments.api.PaymentDataRequestUpdate => {
    // Calculate new total price based on selected shipping option
    this.googlePayFinalPrice = this.googlePayShippingOptions.find(
      (option: any) => option.id === intermediatePaymentData.shippingOptionData?.id,
    )?.finalValue;

    if (!this.googlePayFinalPrice) {
      this.logger.error('Unexpected error calculating updated price.');
    }

    return {
      newTransactionInfo: {
        totalPriceStatus: 'FINAL',
        totalPrice: String(this.googlePayFinalPrice),
        currencyCode: this.googlePayFinalCurrency ?? 'USD',
      },
    };
  };

  /**
   * The `onShippingAddressChanged` function updates the shipping options and transaction information
   * based on the selected address in Google Pay.
   * @param intermediatePaymentData - The `intermediatePaymentData` parameter is an object of type
   * `google.payments.api.IntermediatePaymentData`. It contains information about the intermediate
   * payment data, including the shipping address selected by the user.
   * @returns a Promise that resolves to a `google.payments.api.PaymentDataRequestUpdate` object.
   */
  private onShippingAddressChanged = async (
    intermediatePaymentData: google.payments.api.IntermediatePaymentData,
  ): Promise<google.payments.api.PaymentDataRequestUpdate> => {
    // Update shipping options based on the selected address
    const updatedShippingOptions = await this.getGooglePayShippingOptions(
      intermediatePaymentData.shippingAddress!,
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
  };

  /**
   * The function returns a Google Pay payment data request object with specific parameters and
   * configurations.
   * @returns {google.payments.api.PaymentDataRequest}
   */
  private getGooglePayPaymentDataRequest = (): google.payments.api.PaymentDataRequest => {
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
              gatewayMerchantId: this.spreedlyEnvironmentKey,
            },
          },
        },
      ],
      transactionInfo: {
        totalPriceStatus: 'FINAL',
        totalPrice: `${Number(this.cartSubtotal)}`,
        currencyCode: this.cartCurrency ?? 'USD',
      },
      shippingAddressRequired: !this.cartHasMultipleStores,
      shippingAddressParameters: {
        phoneNumberRequired: !this.cartHasMultipleStores,
      },
      shippingOptionRequired: !this.cartHasMultipleStores,
      merchantInfo: {
        merchantId: this.spreedlyEnvironmentKey,
      },
      callbackIntents: this.cartHasMultipleStores
        ? undefined
        : ['SHIPPING_ADDRESS', 'SHIPPING_OPTION'],
    };
  };
}
