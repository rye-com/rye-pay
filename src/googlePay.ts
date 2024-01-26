import { CartService } from './cartService';
import { GOOGLE_PAY_SCRIPT_URL, PAYMENT_TYPE } from './constants';
import { GooglePayInputParams, InitParams, SpreedlyAdditionalFields } from './rye-pay';

export type GooglePayParams = {
  cartApiEndpoint: string;
  googlePayInputParams: GooglePayInputParams;
  spreedlyEnvironmentKey: string;
  onCartSubmitted: InitParams['onCartSubmitted'];
  log: (...args: any) => void;
};

export class GooglePay {
  private cartApiEndpoint: string;
  private onCartSubmitted: InitParams['onCartSubmitted'];
  private spreedlyEnvironmentKey: string;
  private cartService: CartService;
  private googlePayInputParams: GooglePayInputParams;
  private log: (...args: any) => void;

  private googlePayConfig: any;
  private googlePayFinalPrice: number = 0;
  private googlePayFinalCurrency: string = 'USD';
  private googlePayShippingOptions: any[] = [];

  constructor({
    cartApiEndpoint,
    googlePayInputParams,
    spreedlyEnvironmentKey,
    log,
  }: GooglePayParams) {
    this.cartApiEndpoint = cartApiEndpoint;
    this.googlePayInputParams = googlePayInputParams;
    this.spreedlyEnvironmentKey = spreedlyEnvironmentKey;
    this.log = log;
    this.cartService = CartService.getInstance(this.cartApiEndpoint);
  }

  loadGooglePay() {
    this.googlePayConfig = this.getGooglePayConfig();
    const googlePayScript = document.createElement('script');
    googlePayScript.src = GOOGLE_PAY_SCRIPT_URL;
    googlePayScript.async = true;
    document.head.appendChild(googlePayScript);

    googlePayScript.onload = () => {
      this.initializeGooglePay();
    };
  }

  private initializeGooglePay() {
    const paymentsClient = new google.payments.api.PaymentsClient({
      environment: 'TEST',
      paymentDataCallbacks: {
        onPaymentDataChanged: this
          .onPaymentDataChanged as google.payments.api.PaymentDataChangedHandler,
      },
    });
    const button = paymentsClient.createButton({
      onClick: () => this.onGooglePayClicked(paymentsClient),
    });

    const buttonContainer = document.getElementById('rye-google-pay');

    if (buttonContainer) {
      buttonContainer.appendChild(button);
    } else {
      this.log('Google Pay button container not found');
    }
  }

  private async getGooglePayShippingOptions(shippingAddress: google.payments.api.Address) {
    const content = await this.cartService.updateBuyerIdentity(
      this.googlePayInputParams.cartId,
      this.googlePayInputParams.shopperIp,
      shippingAddress!,
      PAYMENT_TYPE.GOOGLE_PAY
    );
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
      const updatedShippingOptions = await this.getGooglePayShippingOptions(
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

  private onGooglePayClicked(paymentsClient: google.payments.api.PaymentsClient) {
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
        const updateBuyerIdentity = await this.cartService.updateBuyerIdentity(
          this.googlePayInputParams.cartId,
          this.googlePayInputParams.shopperIp,
          shippingAddress!,
          PAYMENT_TYPE.GOOGLE_PAY
        );
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
            cartId: this.googlePayInputParams.cartId,
            selectedShippingOptions: JSON.stringify(selectedShippingOptions),
            shopperIp: this.googlePayInputParams.shopperIp,
          },
        };

        const result = await this.cartService.submitCart({ token: paymentToken, paymentDetails });
        this.onCartSubmitted?.(result.submitCart, result.errors);
      })
      .catch((error) => {
        // Handle any errors that occur during the payment process
        this.log('Payment failed: ', error);
      });
  }

  private getGooglePayConfig() {
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
    };
  }
}
