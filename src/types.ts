export type RyeStore = {
  store: string;
  offer: {
    selectedShippingMethod: ShippingMethod;
    shippingMethods: ShippingMethod[];
  };
};

export type ShippingMethod = {
  id: string;
  label: string;
  price: {
    value: string;
    currency: string;
    displayValue: string;
  };
  total: {
    value: string;
    currency: string;
    displayValue: string;
  };
};
