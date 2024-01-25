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
