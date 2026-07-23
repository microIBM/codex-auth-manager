import {
  createGrizzlySmsProvider,
  type GrizzlySmsActivation,
  type GrizzlySmsNumberRequestOptions,
  type GrizzlySmsProvider,
  type GrizzlySmsProviderConfig,
  type GrizzlySmsVerificationCode,
  type GrizzlySmsWaitForCodeOptions,
} from "./grizzlySMS.js";

export const SMSBOWER_DEFAULT_BASE_URL = "https://smsbower.page/stubs/handler_api.php";

export type SmsBowerActivation = GrizzlySmsActivation;
export type SmsBowerNumberRequestOptions = GrizzlySmsNumberRequestOptions;
export type SmsBowerVerificationCode = GrizzlySmsVerificationCode;
export type SmsBowerWaitForCodeOptions = GrizzlySmsWaitForCodeOptions;
export type SmsBowerProvider = GrizzlySmsProvider;
export type SmsBowerProviderConfig = GrizzlySmsProviderConfig;

export function createSmsBowerProvider(config: SmsBowerProviderConfig): SmsBowerProvider {
  return createGrizzlySmsProvider({
    ...config,
    baseUrl: config.baseUrl ?? SMSBOWER_DEFAULT_BASE_URL,
    providerName: "SMSBower",
  });
}
