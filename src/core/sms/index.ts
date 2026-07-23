import { ActivationBroker } from "./activation-broker.js";
import { createHeroSmsProvider } from "./heroSMS.js";
import { createGrizzlySmsProvider, type GrizzlySmsProviderConfig } from "./grizzlySMS.js";
import { createSmsBowerProvider } from "./smsBower.js";
import type { SmsProvider } from "./provider.js";

export type SmsProviderKind = "hero-sms" | "grizzly-sms" | "smsbower";

type SMSBrokerOption = {
  provider?: SmsProviderKind;
  apiKey: string;
  country: number | string;
  maxPrice: number;
  pollAttempts: number;
  pollIntervalMs: number;
  fetchImpl?: GrizzlySmsProviderConfig["fetchImpl"];
}

export const createSmsProvider = (option: SMSBrokerOption): SmsProvider => {
  if (option.provider === "grizzly-sms") {
    return createGrizzlySmsProvider({
      apiKey: option.apiKey,
      defaultRequestOptions: {
        service: "dr",
        country: option.country,
        maxPrice: option.maxPrice,
      },
      defaultWaitForCodeOptions: {
        markReady: false,
        completeOnCode: false,
        pollAttempts: option.pollAttempts,
        pollIntervalMs: option.pollIntervalMs,
      },
      fetchImpl: option.fetchImpl,
    });
  }

  if (option.provider === "smsbower") {
    return createSmsBowerProvider({
      apiKey: option.apiKey,
      defaultRequestOptions: {
        service: "dr",
        country: option.country,
        maxPrice: option.maxPrice,
      },
      defaultWaitForCodeOptions: {
        markReady: false,
        completeOnCode: false,
        pollAttempts: option.pollAttempts,
        pollIntervalMs: option.pollIntervalMs,
      },
      fetchImpl: option.fetchImpl,
    });
  }

  return createHeroSmsProvider({
    apiKey: option.apiKey,
    defaultRequestOptions: {
      // openai
      service: "dr",
      country: Number(option.country),
      maxPrice: option.maxPrice,
      fixedPrice: true,
    },
    defaultWaitForCodeOptions: {
      markReady: false,
      completeOnCode: false,
      pollAttempts: option.pollAttempts,
      pollIntervalMs: option.pollIntervalMs,
    },
  });
};

export const createSMSBroker = (option: SMSBrokerOption) => {
  return new ActivationBroker(createSmsProvider(option));
};
