import { Module } from '@nestjs/common';
import {
  CASHIER_MODULE_OPTIONS,
  ConfigurableModuleClass,
} from './cashier.module-definition';
import { CashierModuleOptions } from './cashier.types';
import { CashierService } from './cashier.service';

@Module({
  providers: [
    {
      provide: CashierService,
      useFactory: (options: CashierModuleOptions) =>
        new CashierService(options),
      inject: [CASHIER_MODULE_OPTIONS],
    },
  ],
  exports: [CashierService],
})
export class CashierModule extends ConfigurableModuleClass {}
