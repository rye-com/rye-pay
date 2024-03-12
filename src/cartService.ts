import { AuthService } from './authService';
import {
  CartApiSubmitInput,
  GetCartResult,
  GraphQLError,
  SubmitCartParams,
  SubmitCartResult,
  cartSubmitResponse,
  ryeShopperIpHeaderKey,
} from './rye-pay';
import { generateFullPostalCode, isApplePayAddress, isGooglePayAddress } from './utils';

type SubmitCartMutationResult = {
  submitCart: SubmitCartResult;
  errors: GraphQLError[];
};

type GetCartQueryResult = {
  cart: GetCartResult;
  errors: GraphQLError[];
};

/* The `CartService` class is a TypeScript class that provides methods for interacting with a cart API,
including retrieving cart data and submitting a cart for payment. */
export class CartService {
  private static instance: CartService;
  private readonly submitCartMutation = `mutation submitCart($input: CartSubmitInput!) { submitCart(input: $input) { ${cartSubmitResponse} } } `;
  private readonly getCartQuery = `query ($id: ID!) { getCart(id: $id) { cart { id cost { subtotal { value currency } tax { value } shipping { value } total { value } } buyerIdentity { firstName lastName address1 address2 city provinceCode countryCode postalCode email phone } stores { ... on AmazonStore { errors { code message details { productIds } } store cartLines { quantity product { id } } offer { errors { code message details { ... on AmazonOfferErrorDetails { productIds } } } subtotal { value displayValue currency } margin { value displayValue currency } notAvailableIds selectedShippingMethod { id label price { value displayValue currency } } shippingMethods { id label price { value displayValue currency } taxes { value displayValue currency } total { value displayValue currency } } } } ... on ShopifyStore { errors { code message details { variantIds } } store cartLines { quantity variant { id } } offer { errors { code message details { ... on ShopifyOfferErrorDetails { variantIds } } } subtotal { value displayValue currency } margin { value displayValue currency } notAvailableIds selectedShippingMethod { id label price { value displayValue currency } } shippingMethods { id label price { value displayValue currency } taxes { value displayValue currency } total { value displayValue currency } } } } } } errors { code message } } }`;
  private readonly updateBuyerIdentityMutation = `mutation ($input: CartBuyerIdentityUpdateInput!) { updateCartBuyerIdentity(input: $input) { cart { id stores { ... on AmazonStore { store offer { subtotal { value displayValue currency } shippingMethods { id label price { value displayValue currency } taxes { value displayValue currency } total { value displayValue currency } } } } ... on ShopifyStore { store offer { subtotal { value displayValue currency } shippingMethods { id label price { value displayValue currency } taxes { value displayValue currency } total { value displayValue currency } } } } } } } }`;
  private readonly createCartMutation = `mutation ($input: CartCreateInput!) { createCart(input: $input) { cart { id cost { subtotal { value displayValue currency } tax { value displayValue currency } shipping { value displayValue } total { value displayValue } } buyerIdentity { firstName lastName address1 address2 city provinceCode countryCode postalCode email phone } stores { ... on AmazonStore { errors { code message details { productIds } } isSubmitted store cartLines { quantity product { id } } offer { errors { code message details { ... on AmazonOfferErrorDetails { productIds } } } subtotal { value displayValue currency } margin { value displayValue currency } notAvailableIds shippingMethods { id label price { value displayValue currency } taxes { value displayValue currency } total { value displayValue currency } } } } ... on ShopifyStore { errors { code message details { variantIds } } isSubmitted store cartLines { quantity variant { id } } offer { errors { code message details { ... on ShopifyOfferErrorDetails { variantIds } } } subtotal { value displayValue currency } margin { value displayValue currency } notAvailableIds shippingMethods { id label price { value displayValue currency } taxes { value displayValue currency } total { value displayValue currency } } } } } } errors { code message } } }`;
  private readonly authService: AuthService;
  private cartApiEndpoint;

  private constructor(cartApiEndpoint: string) {
    this.authService = AuthService.getInstance();
    this.cartApiEndpoint = cartApiEndpoint;
  }

  /**
   * The function returns an instance of the CartService class, creating it if it doesn't already
   * exist.
   * @param {string} cartApiEndpoint - The `cartApiEndpoint` parameter is a string that represents the
   * endpoint or URL of the cart API. It is used to initialize the `CartService` instance with the
   * specified API endpoint.
   * @returns The `CartService` instance is being returned.
   */
  public static getInstance(cartApiEndpoint: string): CartService {
    if (!CartService.instance) {
      CartService.instance = new CartService(cartApiEndpoint);
    }

    return CartService.instance;
  }

  /**
   * The function `createCart` returns the created cart data and any errors.
   * @param {string} variantId - The `variantId` parameter is a string that represents the unique identifier
   * of a product variant.
   * @param {string} shopperIp - The `shopperIp` parameter is the IP address of the shopper. It is used
   * as a header in the request to the cart API.
   * @returns {GetCartQueryResult} - the cart data and any potential errors.
   */
  public async createCart(variantId: string, shopperIp?: string): Promise<any> {
    const headers: RequestInit['headers'] = {
      'Content-Type': 'application/json',
      Authorization: await this.authService.getAuthHeader(),
    };

    if (shopperIp) {
      headers[ryeShopperIpHeaderKey] = shopperIp;
    }

    const rawResponse = await fetch(this.cartApiEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: this.createCartMutation,
        variables: {
          input: {
            items: {
              shopifyCartItemsInput: [
                {
                  // Currently only supporting Shopify for Apple Pay
                  quantity: 1,
                  variantId,
                },
              ],
            },
          },
        },
      }),
    });

    const content = await rawResponse.json();
    const result: GetCartQueryResult = {
      cart: content?.data?.createCart?.cart as GetCartResult,
      errors: content?.data?.createCart?.errors as GraphQLError[],
    };

    return result;
  }

  /**
   * The function `getCart` returns the cart data and any errors.
   * @param {string} cartId - The `cartId` parameter is a string that represents the unique identifier
   * of a cart. It is used to retrieve the cart information from the server.
   * @param {string} shopperIp - The `shopperIp` parameter is the IP address of the shopper. It is used
   * as a header in the request to the cart API.
   * @returns {GetCartQueryResult} - the cart data and any potential errors.
   */
  public async getCart(cartId: string, shopperIp?: string): Promise<any> {
    const headers: RequestInit['headers'] = {
      'Content-Type': 'application/json',
      Authorization: await this.authService.getAuthHeader(),
    };

    if (shopperIp) {
      headers[ryeShopperIpHeaderKey] = shopperIp;
    }

    const rawResponse = await fetch(this.cartApiEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: this.getCartQuery,
        variables: {
          id: cartId,
        },
      }),
    });

    const content = await rawResponse.json();
    const result: GetCartQueryResult = {
      cart: content?.data?.getCart?.cart as GetCartResult,
      errors: content?.data?.getCart?.errors as GraphQLError[],
    };

    return result;
  }

  /**
   * The function `updateBuyerIdentity` updates the buyer's identity information in a shopping cart
   * based on the provided parameters.
   * @param {string} cartId - The `cartId` parameter is a string that represents the ID of the shopping
   * cart.
   * @param {string} shopperIp - The `shopperIp` parameter is the IP address of the shopper making the
   * purchase. It is used for tracking and security purposes.
   * @param {google.payments.api.Address | ApplePayJS.ApplePayPaymentContact} shippingAddress - The
   * `shippingAddress` parameter is an object that represents the shipping address of the buyer. It can
   * be either a `google.payments.api.Address` object or an `ApplePayJS.ApplePayPaymentContact` object,
   * depending on the payment type.
   * @returns the response from the API call as a JSON object.
   */
  public async updateBuyerIdentity(
    cartId: string,
    shippingAddress: google.payments.api.Address | ApplePayJS.ApplePayPaymentContact,
    shopperIp?: string
  ) {
    const headers: RequestInit['headers'] = {
      'Content-Type': 'application/json',
      Authorization: await this.authService.getAuthHeader(),
    };

    if (shopperIp) {
      headers[ryeShopperIpHeaderKey] = shopperIp;
    }

    const countryCode = shippingAddress?.countryCode ?? '';
    const postalCode = await generateFullPostalCode(shippingAddress?.postalCode ?? '', countryCode);

    let buyerIdentity: any = {
      provinceCode: shippingAddress.administrativeArea ?? '',
      countryCode,
      postalCode,
    };

    if (isApplePayAddress(shippingAddress) && shippingAddress.givenName) {
      // For Apple Pay
      buyerIdentity = {
        ...buyerIdentity,
        email: shippingAddress.emailAddress ?? '',
        firstName: shippingAddress.givenName ?? '',
        lastName: shippingAddress.familyName ?? '',
        phone: shippingAddress?.phoneNumber,
        address1: shippingAddress?.addressLines?.at(0) ?? '',
        address2: shippingAddress?.addressLines?.at(1) ?? '',
        city: shippingAddress?.locality ?? '',
      };
    } else if (isGooglePayAddress(shippingAddress) && shippingAddress.name) {
      // For Google Pay
      buyerIdentity = {
        ...buyerIdentity,
        firstName: shippingAddress?.name?.split(' ')[0] ?? '',
        lastName: shippingAddress?.name?.split(' ')[1] ?? '',
        phone: shippingAddress?.phoneNumber,
        address1: shippingAddress?.address1 ?? '',
        address2: shippingAddress?.address2 ?? '',
        city: shippingAddress?.locality ?? '',
      };
    }

    const rawResponse = await fetch(this.cartApiEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: this.updateBuyerIdentityMutation,
        variables: {
          input: {
            id: cartId,
            buyerIdentity: buyerIdentity,
          },
        },
      }),
    });

    return await rawResponse.json();
  }

  /**
   * The `submitCart` function submits a cart for payment with the provided payment details and returns
   * the result.
   * @param {SubmitCartParams}  - - `token`: A string representing the payment token. If not provided,
   * it defaults to 'payment_token'.
   * @returns {SubmitCartMutationResult} - the submitCart result and any potential errors.
   */
  public async submitCart({
    token,
    paymentDetails,
    applePayToken,
    googlePayToken,
  }: SubmitCartParams): Promise<any> {
    const input: CartApiSubmitInput = {
      token: token ?? 'payment_token',
      applePayToken,
      googlePayPaymentTokenInput: googlePayToken,
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
      Authorization: await this.authService.getAuthHeader(),
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
    const result: SubmitCartMutationResult = {
      submitCart: content?.data?.submitCart,
      errors: content.errors,
    };
    return result;
  }
}
