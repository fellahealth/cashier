# Cashier documentation

Start with the [main README](../README.md) for installation and a quick start. These pages cover each part of the API in detail.

## Guides

- [Drivers and conventions](drivers.md): creating a driver, amounts, currencies, metadata, ids and pagination.
- [Errors](errors.md): every error class, its `code`, and how to handle it.
- [Dependency injection](dependency-injection.md): using Cashier with NestJS or any other container, and faking it in tests.

## API reference

| Resource                          | Methods                                                                                                                                                                                                                                                        |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Customers](customers.md)         | [`get`](customers.md#customersgetcustomerid), [`list`](customers.md#customerslistparams), [`create`](customers.md#customerscreateparams), [`update`](customers.md#customersupdatecustomerid-params)                                                            |
| [Invoices](invoices.md)           | [`get`](invoices.md#invoicesgetinvoiceid), [`list`](invoices.md#invoiceslistparams), [`pay`](invoices.md#invoicespayinvoiceid-params), [`void`](invoices.md#invoicesvoidinvoiceid)                                                                             |
| [Products](products.md)           | [`get`](products.md#productsgetproductid), [`list`](products.md#productslistparams)                                                                                                                                                                            |
| [Prices](prices.md)               | [`get`](prices.md#pricesgetpriceid), [`list`](prices.md#priceslistparams)                                                                                                                                                                                      |
| [Subscriptions](subscriptions.md) | [`create`](subscriptions.md#subscriptionscreateparams), [`get`](subscriptions.md#subscriptionsgetsubscriptionid), [`update`](subscriptions.md#subscriptionsupdatesubscriptionid-params), [`cancel`](subscriptions.md#subscriptionscancelsubscriptionid-params) |

Each resource page lists the parameters, what the method does on Stripe and on Recurly, and the shape of the object it returns.
