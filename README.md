# rye-pay

This package contains the Rye payment client required to perform checkout using Rye Cart-API. The package relays on Spreedly iFrame which takes care of handling secure payment data (credit card number and cvv).

## Table of Contents

1. [Install](#install)
2. [Usage](#usage)
   - [Preparing a payment form](#preparing-a-payment-form)
   - [RyePay initialization and cart submission](#ryepay-initialization-and-cart-submission)
   - [Handle submission result](#handle-submission-result)
   - [Other methods](#other-methods)
3. [Related documentation](#related-documentation)

## Install

Install with npm:

`npm i @rye-api/rye-pay`

Install with yarn:

`yarn add @rye-api/rye-pay`

## Usage

### Preparing a payment form

Developers are responsible for creating a form that collects user credit card data. It is up to a developer how to style and layout the form.
In order to be PCI Complaint a developer should not use any input fields to collect a credit card number and cvv.
Instead, they should provide two HTML elements with `id` attribute where the number and cvv Spreedly iFrame fields should be rendered.

### RyePay initialization and cart submission

```ts
import { RyePay } from '@rye-api/rye-pay';

const ryePay = new RyePay();
ryePay.init(initParams);
//...
ryePay.submit(paymentDetails);
```

### Initialization object `initParams`

`initParams` is an object with the following fields:

> `apiKey: string` <sup>required</sup>
>
> Developer's key to access Rye API.

> `numberEl: string` <sup>required</sup>
>
> Id of the HTML element where the number iFrame field should be rendered.

> `cvvEl: string` <sup>required</sup>
>
> Id of the HTML element where the CVV iFrame field should be rendered.

> `onReady: () => void`
>
> Triggered when the iFrame is initialized and ready for configuration. setStyle and other UI function calls should be made within this event listener. This event will only fire after init() has been called.

> `onCartSubmitted(result: SubmitCartResult)`
>
> Triggered when the cart submission is completed and an attempt to make a payment and create orders is made.

> `onErrors: (errors) => void`
>
> Triggered when a payment method is not successfully tokenized. A description of the errors object can be found [here](https://docs.spreedly.com/reference/iframe/v1/#errors)

> `onIFrameError: (error) => void`
>
> Triggered when a javascript error occurs within the iFrame. This is useful for debugging runtime issues. `error` includes keys `msg`, `url`, `line`, `col`

> `onFieldChanged: (name, type, activeEl, inputProperties) => void`
>
> Triggered when an input event occurs in either iFrame field. This is useful to provide real-time feedback to the user. A description of params can be found [here](https://docs.spreedly.com/reference/iframe/v1/#fieldevent)

> `onValidate: (inputProperties) => void`
>
> Triggered when validation of the iFrame is requested. This event will only fire after validate() has been called. A description of input properties can be found [here](https://docs.spreedly.com/reference/iframe/v1/#validation)

> `enableLogging: boolean`
>
> Indicates whether to log to the console the crucial steps of the script execution. Helpful for debugging.

### Payment details object `paymentDetails`:

As soon as the user filled the payment form and the cart is ready to be submitted, the developer should call `ryePay.submit(paymentDetails)`. To handle the result the developer should provide `onCartSubmitted` callback in the `init` method. This method will submit the cart, make a payment transaction using specified credit card data and create an order per each store in the cart.

`paymentDetails` is an object with the following fields:

> `cartId: string` <sup>required</sup>
>
> cart identifier

> `shopperIp: string` <sup>required</sup>
>
> IP of the user of whose behalf the submit is made (end buyer IP), a valide IPV4 string

> `first_name: string` <sup>required</sup>
>
> user's first name. Should match the name on the credit card.

> `last_name: string` <sup>required</sup>
>
> user's last name. Should match the last name on the credit card.

> `month: string` <sup>required</sup>
>
> credit card expiration month

> `year: string` <sup>required</sup>
>
> credit card expiration year

> `address1: string` <sup>required</sup>
>
> billing address.

> `address2: string`
>
> additional billing address

> `city: string` <sup>required</sup>
>
> billing city

> `state: string` <sup>required</sup>
>
> billing state/province

> `country: string` <sup>required</sup>
>
> billing country

> `zip: string` <sup>required</sup>
>
> billing zip/postal code

> `selectedShippingOptions: SelectedShippingOption[]`
>
> an array of objects that represent selected shipping option per store
>
> ```ts
> export interface SelectedShippingOption {
>   store: string;
>   shippingId: string;
> }
> ```

### Handle submission result

`onCartSubmitted` callback takes an argument of `SubmitCartResult` type that provides detail information about the cart submission status.

```ts
interface SubmitCartResult {
  // Cart identifier
  id: string;
  // Submission result per each store in the cart
  stores: SubmitStoreResult[];
}

interface SubmitStoreResult {
  // Store information
  store: Store;
  // Submission status for this store
  status: SubmitStoreStatus;
  // Identifier of the request to track order status
  requestId?: string;
}

type Store = AmazonStore | ShopifyStore;

interface AmazonStore {
  store: string;
  cartLines: AmazonCartLine[];
}

interface ShopifyStore {
  store: string;
  cartLines: ShopifyCartLine[];
}

export interface AmazonCartLine {
  quantity: number;
  product: {
    id: string;
  };
}

export interface ShopifyCartLine {
  quantity: number;
  variant: {
    id: string;
  };
}

enum SubmitStoreStatus {
  // Submission completed without any issues
  COMPLETED = 'COMPLETED',
  // Payment issues occurred during the submission
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  // Other issues occurred during the submission
  FAILED = 'FAILED',
}
```

### Other methods

Methods described below are a direct mapping to the Spreedly object. A detailed description can be found [here](https://docs.spreedly.com/reference/iframe/v1/#ui)

`reload()`

`validate()`

`setFieldType(field, type)`

`setLabel(field, label)`

`setTitle(field, title)`

`setNumberFormat(format)`

`setPlaceholder(field, placeholder)`

`setStyle(field, css)`

`transferFocus(field)`

`toggleAutoComplete()`

## Related documentation

[Spreedly iFrame api reference](https://docs.spreedly.com/reference/iframe/v1/)
