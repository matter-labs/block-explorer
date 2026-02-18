import { Abstract, FactoryProvider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export function createPrividiumToggleProvider<T>(
  token: Abstract<T>,
  prividiumClass: new (...args: any[]) => T | null
): FactoryProvider<T> {
  return {
    provide: token,
    inject: [ConfigService, prividiumClass],
    useFactory: (configService: ConfigService, prividium: T) =>
      configService.get<boolean>("featureFlags.prividium") ? prividium : null,
  };
}
