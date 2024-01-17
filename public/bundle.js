(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],2:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./rye-pay"), exports);

},{"./rye-pay":3}],3:[function(require,module,exports){
(function (process){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RyePay = exports.Marketplace = exports.SubmitStoreStatus = exports.SubmitCartResultErrorCode = exports.SubmitStoreResultErrorCode = void 0;
var SubmitStoreResultErrorCode;
(function (SubmitStoreResultErrorCode) {
    SubmitStoreResultErrorCode["SUBMIT_STORE_FAILED"] = "SUBMIT_STORE_FAILED";
    SubmitStoreResultErrorCode["PAYMENT_FAILED"] = "PAYMENT_FAILED";
})(SubmitStoreResultErrorCode = exports.SubmitStoreResultErrorCode || (exports.SubmitStoreResultErrorCode = {}));
var SubmitCartResultErrorCode;
(function (SubmitCartResultErrorCode) {
    SubmitCartResultErrorCode["SUBMIT_CART_FAILED"] = "SUBMIT_CART_FAILED";
    SubmitCartResultErrorCode["BUYER_IDENTITY_MISSING"] = "BUYER_IDENTITY_MISSING";
    SubmitCartResultErrorCode["BUYER_IDENTITY_INVALID_FIRST_NAME"] = "BUYER_IDENTITY_INVALID_FIRST_NAME";
    SubmitCartResultErrorCode["BUYER_IDENTITY_INVALID_LAST_NAME"] = "BUYER_IDENTITY_INVALID_LAST_NAME";
    SubmitCartResultErrorCode["BUYER_IDENTITY_INVALID_ADDRESS"] = "BUYER_IDENTITY_INVALID_ADDRESS";
    SubmitCartResultErrorCode["BUYER_IDENTITY_INVALID_CITY"] = "BUYER_IDENTITY_INVALID_CITY";
    SubmitCartResultErrorCode["BUYER_IDENTITY_INVALID_PROVINCE"] = "BUYER_IDENTITY_INVALID_PROVINCE";
    SubmitCartResultErrorCode["BUYER_IDENTITY_INVALID_COUNTRY"] = "BUYER_IDENTITY_INVALID_COUNTRY";
    SubmitCartResultErrorCode["BUYER_IDENTITY_INVALID_POSTAL_CODE"] = "BUYER_IDENTITY_INVALID_POSTAL_CODE";
    SubmitCartResultErrorCode["BUYER_IDENTITY_INVALID_PHONE"] = "BUYER_IDENTITY_INVALID_PHONE";
    SubmitCartResultErrorCode["BUYER_IDENTITY_INVALID_EMAIL"] = "BUYER_IDENTITY_INVALID_EMAIL";
    SubmitCartResultErrorCode["BILLING_ADDRESS_INVALID_FIRST_NAME"] = "BILLING_ADDRESS_INVALID_FIRST_NAME";
    SubmitCartResultErrorCode["BILLING_ADDRESS_INVALID_LAST_NAME"] = "BILLING_ADDRESS_INVALID_LAST_NAME";
    SubmitCartResultErrorCode["BILLING_ADDRESS_INVALID_ADDRESS"] = "BILLING_ADDRESS_INVALID_ADDRESS";
    SubmitCartResultErrorCode["BILLING_ADDRESS_INVALID_CITY"] = "BILLING_ADDRESS_INVALID_CITY";
    SubmitCartResultErrorCode["BILLING_ADDRESS_INVALID_PROVINCE"] = "BILLING_ADDRESS_INVALID_PROVINCE";
    SubmitCartResultErrorCode["BILLING_ADDRESS_INVALID_COUNTRY"] = "BILLING_ADDRESS_INVALID_COUNTRY";
    SubmitCartResultErrorCode["BILLING_ADDRESS_INVALID_PHONE"] = "BILLING_ADDRESS_INVALID_PHONE";
    SubmitCartResultErrorCode["BILLING_ADDRESS_INVALID_POSTAL_CODE"] = "BILLING_ADDRESS_INVALID_POSTAL_CODE";
})(SubmitCartResultErrorCode = exports.SubmitCartResultErrorCode || (exports.SubmitCartResultErrorCode = {}));
var SubmitStoreStatus;
(function (SubmitStoreStatus) {
    SubmitStoreStatus["COMPLETED"] = "COMPLETED";
    SubmitStoreStatus["PAYMENT_FAILED"] = "PAYMENT_FAILED";
    SubmitStoreStatus["FAILED"] = "FAILED";
})(SubmitStoreStatus = exports.SubmitStoreStatus || (exports.SubmitStoreStatus = {}));
var Marketplace;
(function (Marketplace) {
    Marketplace["AMAZON"] = "AMAZON";
    Marketplace["SHOPIFY"] = "SHOPIFY";
})(Marketplace = exports.Marketplace || (exports.Marketplace = {}));
const prodCartApiEndpoint = process.env.CART_API_PRODUCTION_URL ?? 'https://graphql.api.rye.com/v1/query';
const stageCartApiEndpoint = process.env.CART_API_STAGING_URL ?? 'https://staging.beta.graphql.api.rye.com/v1/query';
const localCartApiEndpoint = 'http://localhost:3000/v1/query';
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
class RyePay {
    initializing = false;
    spreedlyScriptUrl = 'https://core.spreedly.com/iframe/iframe-v1.min.js';
    googlePayScriptUrl = 'https://pay.google.com/gp/p/js/pay.js';
    submitCartMutation = `mutation submitCart($input: CartSubmitInput!) { submitCart(input: $input) { ${cartSubmitResponse} } } `;
    updateBuyerIdentityMutation = `mutation ($input: CartBuyerIdentityUpdateInput!) { updateCartBuyerIdentity(input: $input) { cart { id stores { ... on AmazonStore { store offer { subtotal { value displayValue currency } shippingMethods { id label price { value displayValue currency } taxes { value displayValue currency } total { value displayValue currency } } } } ... on ShopifyStore { store offer { subtotal { value displayValue currency } shippingMethods { id label price { value displayValue currency } taxes { value displayValue currency } total { value displayValue currency } } } } } } } }`;
    envTokenQuery = `query {
    environmentToken {
       token
    }
  }`;
    cartApiEndpoint = prodCartApiEndpoint;
    spreedly;
    apiKey;
    generateJWT;
    enableLogging = false;
    googlePayConfig;
    googlePayFinalPrice = 0;
    googlePayFinalCurrency = 'USD';
    googlePayShippingOptions = [];
    cartId = '';
    shopperIp = '';
    getGooglePayConfig(spreedlyEnvironmentKey) {
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
    initialized = false;
    initParams;
    /**
     * Initializes RyePay. This method should be called before calling any other methods of RyePay.
     */
    init(params) {
        this.initParams = params;
        const { apiKey, generateJWT, numberEl, cvvEl, onErrors, enableLogging = false, environment = 'prod', } = params;
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
            this.spreedly = globalThis.Spreedly;
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
    }
    loadAndInitializeGooglePay(onCartSubmitted) {
        const googlePayScript = document.createElement('script');
        googlePayScript.src = this.googlePayScriptUrl;
        googlePayScript.async = true;
        document.head.appendChild(googlePayScript);
        googlePayScript.onload = () => {
            this.initializeGooglePay(onCartSubmitted);
        };
    }
    initializeGooglePay(onCartSubmitted) {
        const paymentsClient = new google.payments.api.PaymentsClient({
            environment: 'TEST',
            paymentDataCallbacks: {
                onPaymentDataChanged: this
                    .onPaymentDataChanged,
            },
        });
        const button = paymentsClient.createButton({
            onClick: () => this.onGooglePayClicked(paymentsClient, onCartSubmitted),
        });
        const buttonContainer = document.getElementById('rye-google-pay');
        if (buttonContainer) {
            buttonContainer.appendChild(button);
        }
        else {
            this.log('Google Pay button container not found');
        }
    }
    async updateBuyerIdentity(shippingAddress) {
        const headers = {
            'Content-Type': 'application/json',
            Authorization: await this.getAuthHeader(),
        };
        headers[ryeShopperIpHeaderKey] = '10.10.101.215';
        let buyerIdentity = {
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
    async getShippingOptions(shippingAddress) {
        const content = await this.updateBuyerIdentity(shippingAddress);
        const shippingOptions = content.data.updateCartBuyerIdentity.cart.stores[0].offer.shippingMethods.map((shippingMethod) => ({
            id: shippingMethod.id,
            label: shippingMethod.label,
            description: `${shippingMethod.price.displayValue} ${shippingMethod.price.currency ?? 'USD'}`,
            finalValue: Number(shippingMethod.total.value) / 100,
            currency: shippingMethod.total.currency ?? 'USD',
        }));
        return shippingOptions;
    }
    onPaymentDataChanged = async (intermediatePaymentData) => {
        if (intermediatePaymentData.callbackTrigger === 'SHIPPING_OPTION') {
            // Calculate new total price based on selected shipping option
            this.googlePayFinalPrice =
                this.googlePayShippingOptions.find((option) => option.id === intermediatePaymentData.shippingOptionData?.id)?.finalValue ?? 0;
            return {
                newTransactionInfo: {
                    totalPriceStatus: 'FINAL',
                    totalPrice: String(this.googlePayFinalPrice),
                    currencyCode: this.googlePayFinalCurrency ?? 'USD',
                },
            };
        }
        if ((intermediatePaymentData.callbackTrigger === 'INITIALIZE' ||
            intermediatePaymentData.callbackTrigger === 'SHIPPING_ADDRESS') &&
            intermediatePaymentData.shippingAddress) {
            // Update shipping options based on the selected address
            const updatedShippingOptions = await this.getShippingOptions(intermediatePaymentData.shippingAddress);
            const defaultShipping = updatedShippingOptions[0];
            this.googlePayShippingOptions = updatedShippingOptions;
            this.googlePayFinalPrice = defaultShipping.finalValue;
            this.googlePayFinalCurrency = defaultShipping.currency ?? 'USD';
            return {
                newShippingOptionParameters: {
                    defaultSelectedOptionId: defaultShipping.id ?? '',
                    shippingOptions: updatedShippingOptions.map((option) => ({
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
    onGooglePayClicked(paymentsClient, onCartSubmitted) {
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
            const updateBuyerIdentity = await this.updateBuyerIdentity(shippingAddress);
            const selectedShippingOptionId = paymentData.shippingOptionData?.id;
            const selectedShippingOptions = updateBuyerIdentity.data.updateCartBuyerIdentity.cart.stores.map((store) => {
                const option = store.offer.shippingMethods.find((shippingMethod) => shippingMethod.id === selectedShippingOptionId);
                return {
                    store: store.store,
                    shippingId: option.id,
                };
            });
            const paymentDetails = {
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
            const result = await this.submitCart(paymentToken, paymentDetails);
            onCartSubmitted?.(result.submitCart, result.errors);
        })
            .catch((error) => {
            // Handle any errors that occur during the payment process
            this.log('Payment failed: ', error);
        });
    }
    subscribeToEvents({ onReady, onFieldChanged, onValidate, onIFrameError, onErrors, onCartSubmitted, }) {
        this.spreedly.removeHandlers();
        // Subscribe to optional events only if developers wants to handle them
        onReady && this.spreedly.on('ready', () => onReady(this.spreedly));
        onFieldChanged && this.spreedly.on('fieldEvent', onFieldChanged);
        onValidate && this.spreedly.on('validation', onValidate);
        onIFrameError && this.spreedly.on('consoleError', onIFrameError);
        onErrors && this.spreedly.on('errors', onErrors);
        // Triggers after tokenizeCreditCard was called
        this.spreedly.on('paymentMethod', async (token, paymentDetails) => {
            this.log(`payment method token: ${token}`);
            const result = await this.submitCart(token, paymentDetails);
            onCartSubmitted?.(result.submitCart, result.errors);
        });
    }
    /**
     * Submits payment details to Rye API. As an intermediate step, the method tokenizes credit card data using Spreedly service.
     * @param paymentDetails
     */
    submit(paymentDetails) {
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
    setStyle(field, style) {
        this.spreedly.setStyle(field, style);
    }
    /**
     * Set the input type of the iFrame fields. This is useful to when you want different keyboards to display on mobile devices.
     */
    setFieldType(field, type) {
        this.spreedly.setFieldType(field, type);
    }
    /**
     * Style iFrame fields’ label. Although the label for each iFrame field is not displayed, it is still used by screen readers and other accessibility devices.
     */
    setLabel(field, label) {
        this.spreedly.setLabel(field, label);
    }
    /**
     * Set custom iFrame fields’ title attribute. Although the title for each iFrame field is not displayed,
     * it can still be used by screen readers and other accessibility devices.
     */
    setTitle(field, title) {
        this.spreedly.setTitle(field, title);
    }
    /**
     * Style iFrame fields’ placeholder text.
     */
    setPlaceholder(field, placeholder) {
        this.spreedly.setPlaceholder(field, placeholder);
    }
    /**
     * Set the value the iFrame fields to a known test value. Any values that are not on the allowed list will be silently rejected.
     */
    setValue(field, value) {
        this.spreedly.setValue(field, value);
    }
    /**
     * Set the card number format. If set to prettyFormat, the card number value will include spaces in the credit card number as they appear on a physical card.
     * The number field must be set to type text or tel for pretty formatting to take effect.
     */
    setNumberFormat(format) {
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
    transferFocus(field) {
        this.spreedly.transferFocus(field);
    }
    getEnvToken = async () => {
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
        const result = content?.data?.environmentToken;
        return result.token;
    };
    async submitCart(token, paymentDetails) {
        const input = {
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
            experimentalPromoCodes: paymentDetails.metadata.experimentalPromoCodes
                ? JSON.parse(paymentDetails.metadata.experimentalPromoCodes)
                : undefined,
        };
        const headers = {
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
            submitCart: content?.data?.submitCart,
            errors: content.errors,
        };
        return result;
    }
    hasSpreedlyGlobal() {
        return !!globalThis.Spreedly;
    }
    async getAuthHeader() {
        if (this.apiKey) {
            return 'Basic ' + btoa(this.apiKey + ':');
        }
        const token = await this.generateJWT();
        return `Bearer ${token}`;
    }
    log = (...args) => {
        this.enableLogging && console.log(...args);
    };
    getCartApiEndpoint(env) {
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
exports.RyePay = RyePay;

}).call(this)}).call(this,require('_process'))
},{"_process":1}]},{},[2]);
