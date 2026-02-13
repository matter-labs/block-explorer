import { FactoryProvider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export function makePrividiumToggleProvider<T>(
  token: symbol | string,
  standardClass: new (...args: any[]) => T,
  prividiumClass: new (...args: any[]) => T
): FactoryProvider<T> {
  return {
    provide: token,
    inject: [ConfigService, standardClass, prividiumClass],
    useFactory: (configService: ConfigService, standard: T, prividium: T) =>
      configService.get<boolean>("featureFlags.prividium") ? prividium : standard,
  };
}
