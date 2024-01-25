import { AuthService } from './authService';
import {
  CartApiSubmitInput,
  GraphQLError,
  SubmitCartParams,
  SubmitCartResult,
  cartSubmitResponse,
  ryeShopperIpHeaderKey,
} from './rye-pay';

export class CartService {
  private static instance: CartService;
  private readonly submitCartMutation = `mutation submitCart($input: CartSubmitInput!) { submitCart(input: $input) { ${cartSubmitResponse} } } `;
  private readonly getCartQuery = `query ($id: ID!) { getCart(id: $id) { cart { id cost { subtotal { value currency } tax { value } shipping { value } total { value } } buyerIdentity { firstName lastName address1 address2 city provinceCode countryCode postalCode email phone } stores { ... on AmazonStore { errors { code message details { productIds } } store cartLines { quantity product { id } } offer { errors { code message details { ... on AmazonOfferErrorDetails { productIds } } } subtotal { value displayValue currency } margin { value displayValue currency } notAvailableIds shippingMethods { id label price { value displayValue currency } taxes { value displayValue currency } total { value displayValue currency } } } } ... on ShopifyStore { errors { code message details { variantIds } } store cartLines { quantity variant { id } } offer { errors { code message details { ... on ShopifyOfferErrorDetails { variantIds } } } subtotal { value displayValue currency } margin { value displayValue currency } notAvailableIds shippingMethods { id label price { value displayValue currency } taxes { value displayValue currency } total { value displayValue currency } } } } } } errors { code message } } }`;
  private readonly authService: AuthService;
  private cartApiEndpoint;

  private constructor(cartApiEndpoint: string) {
    this.authService = AuthService.getInstance();
    this.cartApiEndpoint = cartApiEndpoint;
  }

  public static getInstance(cartApiEndpoint: string): CartService {
    if (!CartService.instance) {
      CartService.instance = new CartService(cartApiEndpoint);
    }

    return CartService.instance;
  }

  public async getCart(cartId: string, shopperIp: string): Promise<any> {
    const headers: RequestInit['headers'] = {
      'Content-Type': 'application/json',
      Authorization: await this.authService.getAuthHeader(),
      [ryeShopperIpHeaderKey]: shopperIp,
    };

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
    const result = {
      cart: content?.data?.getCart?.cart as SubmitCartResult,
      errors: content?.data?.getCart?.errors as GraphQLError[],
    };

    return result;
  }

  public async submitCart({
    token,
    paymentDetails,
    applePayToken,
  }: SubmitCartParams): Promise<any> {
    const input: CartApiSubmitInput = {
      token: token ?? 'payment_token',
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
    const result = {
      submitCart: content?.data?.submitCart as SubmitCartResult,
      errors: content.errors as GraphQLError[],
    };
    return result;
  }
}
