import { ConfigurableModuleBuilder } from '@nestjs/common';
import { CashierModuleOptions } from './cashier.types';

export const {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN: CASHIER_MODULE_OPTIONS,
  OPTIONS_TYPE,
  ASYNC_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<CashierModuleOptions>()
  .setClassMethodName('forRoot')
  .setExtras({ isGlobal: false }, (definition, extras) => ({
    ...definition,
    global: extras.isGlobal,
  }))
  .build();

export type CashierModuleSyncOptions = typeof OPTIONS_TYPE;
export type CashierModuleAsyncOptions = typeof ASYNC_OPTIONS_TYPE;
