# tebex-subs-sample

A TypeScript-based, maintainable Tebex Subscriptions Sample App.

To get started, simply run:
```
yarn # Installs required dependencies
yarn start # Builds the app in development mode to start using it
```

# !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
#   !!!!!!!!!!!!!!!!!!!!!!!! NOTICE !!!!!!!!!!!!!!!!!!!!!!!!
# !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

Some features of this sample app, as well as its underlying api, are still subject
to some changes. Please proceed with caution. Below is a (best effort) list of things to keep an eye out for:

- The `subscriptions` endpoint currently accepts a temporary auth token. This may be subject to change.
- The overwolf client currently operates with `username` as the unique identifier for users. This api will switch to using UUIDs in the near future, there will be an announcement and migration help when this happens.

## Configuring

To configure the App to work with a different store from the default one, simply edit the [store-data.ts](/src/base/config/store-data.ts) file



