const hostname = 'https://subscriptions-api.overwolf.com';

const endpoints = {
  hostname,
  packages: `${hostname}/packages`,
  checkout: `${hostname}/checkout`,
  subscriptions: `${hostname}/subscriptions`,
} as const;

export default endpoints;
