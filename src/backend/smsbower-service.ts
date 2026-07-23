import {appConfig} from "../core/config.js";
import {
  getHandlerApiSmsBalance,
  getHandlerApiSmsCountries,
  getHandlerApiSmsPrices,
  type GrizzlySmsBalance,
  type GrizzlySmsCountryItem,
  type GrizzlySmsPriceItem,
  type HandlerApiSmsServiceConfig,
} from "./grizzly-sms-service.js";
import {SMSBOWER_DEFAULT_BASE_URL} from "../core/sms/smsBower.js";

const SMSBOWER_SERVICE_CONFIG: HandlerApiSmsServiceConfig = {
  providerName: "SMSBower",
  baseUrl: SMSBOWER_DEFAULT_BASE_URL,
  getApiKey: () => appConfig.smsBowerApiKey,
};

export type SmsBowerCountryItem = GrizzlySmsCountryItem;
export type SmsBowerPriceItem = GrizzlySmsPriceItem;
export type SmsBowerBalance = GrizzlySmsBalance;

export async function getSmsBowerCountries(): Promise<{countries: SmsBowerCountryItem[]; error?: string}> {
  return getHandlerApiSmsCountries(SMSBOWER_SERVICE_CONFIG);
}

export async function getSmsBowerBalance(): Promise<{balance: SmsBowerBalance | null; error?: string}> {
  return getHandlerApiSmsBalance(SMSBOWER_SERVICE_CONFIG);
}

export async function getSmsBowerPrices(
  country: number,
  service = "dr",
): Promise<{prices: SmsBowerPriceItem[]; error?: string}> {
  return getHandlerApiSmsPrices(SMSBOWER_SERVICE_CONFIG, country, service);
}
