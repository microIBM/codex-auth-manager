export interface SmsCountryLabelItem {
  countryId: number;
  countryName?: string;
  countryNameEn?: string;
  countryNameRu?: string;
  phoneCode?: string;
}

const COUNTRY_ZH_BY_ID: Record<number, string> = {
  0: "俄罗斯",
  1: "乌克兰",
  2: "哈萨克斯坦",
  3: "中国",
  4: "菲律宾",
  5: "缅甸",
  6: "印度尼西亚",
  7: "马来西亚",
  8: "肯尼亚",
  9: "坦桑尼亚",
  10: "越南",
  11: "吉尔吉斯斯坦",
  12: "美国",
  13: "以色列",
  14: "中国香港",
  15: "波兰",
  16: "英国",
  17: "马达加斯加",
  18: "刚果民主共和国",
  19: "尼日利亚",
  20: "中国澳门",
  21: "埃及",
  22: "印度",
  23: "爱尔兰",
  24: "柬埔寨",
  25: "老挝",
  26: "海地",
  27: "科特迪瓦",
  28: "冈比亚",
  29: "塞尔维亚",
  30: "也门",
  31: "南非",
  32: "罗马尼亚",
  33: "哥伦比亚",
  34: "爱沙尼亚",
  35: "阿塞拜疆",
  36: "加拿大",
  37: "摩洛哥",
  38: "加纳",
  39: "阿根廷",
  40: "乌兹别克斯坦",
  41: "喀麦隆",
  42: "乍得",
  43: "德国",
  44: "立陶宛",
  45: "克罗地亚",
  46: "瑞典",
  47: "伊拉克",
  48: "荷兰",
  49: "拉脱维亚",
  50: "奥地利",
  51: "白俄罗斯",
  52: "泰国",
  53: "沙特阿拉伯",
  54: "墨西哥",
  55: "中国台湾",
  56: "西班牙",
  57: "伊朗",
  58: "阿尔及利亚",
  59: "斯洛文尼亚",
  60: "孟加拉国",
  61: "塞内加尔",
  62: "土耳其",
  63: "捷克",
  64: "斯里兰卡",
  65: "秘鲁",
  66: "巴基斯坦",
  67: "新西兰",
  68: "几内亚",
  69: "马里",
  70: "委内瑞拉",
  71: "埃塞俄比亚",
  72: "蒙古",
  73: "巴西",
  74: "阿富汗",
  75: "乌干达",
  76: "安哥拉",
  77: "塞浦路斯",
  78: "法国",
  79: "巴布亚新几内亚",
  80: "莫桑比克",
  81: "尼泊尔",
  82: "比利时",
  83: "保加利亚",
  84: "匈牙利",
  85: "摩尔多瓦",
  86: "意大利",
  87: "巴拉圭",
  88: "洪都拉斯",
  89: "突尼斯",
  90: "尼加拉瓜",
  91: "东帝汶",
  92: "玻利维亚",
  93: "哥斯达黎加",
  94: "危地马拉",
  95: "阿联酋",
  96: "津巴布韦",
  97: "波多黎各",
  98: "苏丹",
  99: "多哥",
  100: "科威特",
  101: "萨尔瓦多",
  102: "利比亚",
  103: "牙买加",
  104: "特立尼达和多巴哥",
  105: "厄瓜多尔",
  106: "斯威士兰",
  107: "阿曼",
  108: "波黑",
  109: "多米尼加",
  110: "叙利亚",
  111: "卡塔尔",
  112: "巴拿马",
  113: "古巴",
  114: "毛里塔尼亚",
  115: "塞拉利昂",
  116: "约旦",
  117: "葡萄牙",
  118: "巴巴多斯",
  119: "布隆迪",
  120: "贝宁",
  121: "文莱",
  122: "巴哈马",
  123: "博茨瓦纳",
  124: "伯利兹",
  125: "中非",
  126: "多米尼克",
  127: "格林纳达",
  128: "格鲁吉亚",
  129: "希腊",
  130: "几内亚比绍",
  131: "圭亚那",
  132: "冰岛",
  133: "科摩罗",
  134: "圣基茨和尼维斯",
  135: "利比里亚",
  136: "莱索托",
  137: "马拉维",
  138: "纳米比亚",
  139: "尼日尔",
  140: "卢旺达",
  141: "斯洛伐克",
  142: "苏里南",
  143: "塔吉克斯坦",
  144: "摩纳哥",
  145: "巴林",
  146: "留尼汪",
  147: "赞比亚",
  148: "亚美尼亚",
  149: "索马里",
  150: "刚果共和国",
  151: "智利",
};

const ISO_REGION_CODES = [
  "AD",
  "AE",
  "AF",
  "AG",
  "AI",
  "AL",
  "AM",
  "AO",
  "AQ",
  "AR",
  "AS",
  "AT",
  "AU",
  "AW",
  "AX",
  "AZ",
  "BA",
  "BB",
  "BD",
  "BE",
  "BF",
  "BG",
  "BH",
  "BI",
  "BJ",
  "BL",
  "BM",
  "BN",
  "BO",
  "BQ",
  "BR",
  "BS",
  "BT",
  "BV",
  "BW",
  "BY",
  "BZ",
  "CA",
  "CC",
  "CD",
  "CF",
  "CG",
  "CH",
  "CI",
  "CK",
  "CL",
  "CM",
  "CN",
  "CO",
  "CR",
  "CU",
  "CV",
  "CW",
  "CX",
  "CY",
  "CZ",
  "DE",
  "DJ",
  "DK",
  "DM",
  "DO",
  "DZ",
  "EC",
  "EE",
  "EG",
  "EH",
  "ER",
  "ES",
  "ET",
  "FI",
  "FJ",
  "FK",
  "FM",
  "FO",
  "FR",
  "GA",
  "GB",
  "GD",
  "GE",
  "GF",
  "GG",
  "GH",
  "GI",
  "GL",
  "GM",
  "GN",
  "GP",
  "GQ",
  "GR",
  "GS",
  "GT",
  "GU",
  "GW",
  "GY",
  "HK",
  "HM",
  "HN",
  "HR",
  "HT",
  "HU",
  "ID",
  "IE",
  "IL",
  "IM",
  "IN",
  "IO",
  "IQ",
  "IR",
  "IS",
  "IT",
  "JE",
  "JM",
  "JO",
  "JP",
  "KE",
  "KG",
  "KH",
  "KI",
  "KM",
  "KN",
  "KP",
  "KR",
  "KW",
  "KY",
  "KZ",
  "LA",
  "LB",
  "LC",
  "LI",
  "LK",
  "LR",
  "LS",
  "LT",
  "LU",
  "LV",
  "LY",
  "MA",
  "MC",
  "MD",
  "ME",
  "MF",
  "MG",
  "MH",
  "MK",
  "ML",
  "MM",
  "MN",
  "MO",
  "MP",
  "MQ",
  "MR",
  "MS",
  "MT",
  "MU",
  "MV",
  "MW",
  "MX",
  "MY",
  "MZ",
  "NA",
  "NC",
  "NE",
  "NF",
  "NG",
  "NI",
  "NL",
  "NO",
  "NP",
  "NR",
  "NU",
  "NZ",
  "OM",
  "PA",
  "PE",
  "PF",
  "PG",
  "PH",
  "PK",
  "PL",
  "PM",
  "PN",
  "PR",
  "PS",
  "PT",
  "PW",
  "PY",
  "QA",
  "RE",
  "RO",
  "RS",
  "RU",
  "RW",
  "SA",
  "SB",
  "SC",
  "SD",
  "SE",
  "SG",
  "SH",
  "SI",
  "SJ",
  "SK",
  "SL",
  "SM",
  "SN",
  "SO",
  "SR",
  "SS",
  "ST",
  "SV",
  "SX",
  "SY",
  "SZ",
  "TC",
  "TD",
  "TF",
  "TG",
  "TH",
  "TJ",
  "TK",
  "TL",
  "TM",
  "TN",
  "TO",
  "TR",
  "TT",
  "TV",
  "TW",
  "TZ",
  "UA",
  "UG",
  "UM",
  "US",
  "UY",
  "UZ",
  "VA",
  "VC",
  "VE",
  "VG",
  "VI",
  "VN",
  "VU",
  "WF",
  "WS",
  "YE",
  "YT",
  "ZA",
  "ZM",
  "ZW",
];

const COUNTRY_ZH_BY_ENGLISH_NAME: Record<string, string> = {
  albania: "阿尔巴尼亚",
  "burkina faso": "布基纳法索",
  chile: "智利",
  china: "中国",
  "congo brazzaville": "刚果共和国",
  "congo kinshasa": "刚果民主共和国",
  "congo republic": "刚果共和国",
  "czech republic": "捷克",
  "democratic republic of the congo": "刚果民主共和国",
  gabon: "加蓬",
  "hong kong": "中国香港",
  "ivory coast": "科特迪瓦",
  "lao people s democratic republic": "老挝",
  laos: "老挝",
  lebanon: "黎巴嫩",
  macao: "中国澳门",
  macau: "中国澳门",
  mauritius: "毛里求斯",
  "myanmar burma": "缅甸",
  "north korea": "朝鲜",
  "palestine": "巴勒斯坦",
  "republic of korea": "韩国",
  "republic of moldova": "摩尔多瓦",
  "republic of the congo": "刚果共和国",
  "russian federation": "俄罗斯",
  "south korea": "韩国",
  "syria": "叙利亚",
  taiwan: "中国台湾",
  "tanzania united republic of": "坦桑尼亚",
  "timor leste": "东帝汶",
  "turkiye": "土耳其",
  "united states": "美国",
  "united states of america": "美国",
  usa: "美国",
  "united kingdom": "英国",
  england: "英国",
  russia: "俄罗斯",
  ukraine: "乌克兰",
  india: "印度",
  malaysia: "马来西亚",
  thailand: "泰国",
  vietnam: "越南",
  brazil: "巴西",
  mexico: "墨西哥",
  argentina: "阿根廷",
  colombia: "哥伦比亚",
  peru: "秘鲁",
  uruguay: "乌拉圭",
};

type RegionDisplayNames = {
  of(code: string): string | undefined;
};

type RegionDisplayNamesConstructor = new (
  locales: string[],
  options: {type: "region"},
) => RegionDisplayNames;

function createRegionDisplayNames(locale: string): RegionDisplayNames | null {
  const DisplayNamesCtor = (Intl as typeof Intl & {
    DisplayNames?: RegionDisplayNamesConstructor;
  }).DisplayNames;
  if (!DisplayNamesCtor) {
    return null;
  }

  try {
    return new DisplayNamesCtor([locale], {type: "region"});
  } catch {
    return null;
  }
}

function buildIntlCountryNameMap(): Record<string, string> {
  const englishNames = createRegionDisplayNames("en");
  const chineseNames = createRegionDisplayNames("zh-CN");
  if (!englishNames || !chineseNames) {
    return {};
  }

  const result: Record<string, string> = {};
  for (const code of ISO_REGION_CODES) {
    const englishName = englishNames.of(code);
    const chineseName = chineseNames.of(code);
    if (!englishName || !chineseName || englishName === chineseName) {
      continue;
    }

    result[normalizeEnglishKey(englishName)] = chineseName;
  }
  return result;
}

const COUNTRY_ZH_BY_INTL_ENGLISH_NAME = buildIntlCountryNameMap();

function normalizeName(value: unknown): string {
  return String(value ?? "").trim();
}

function hasChinese(value: string): boolean {
  return /[\u4e00-\u9fff]/.test(value);
}

function normalizeEnglishKey(value: string): string {
  return normalizeName(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function resolveChineseCountryName(country: SmsCountryLabelItem): string {
  const names = [
    normalizeName(country.countryName),
    normalizeName(country.countryNameEn),
    normalizeName(country.countryNameRu),
  ];
  const chineseName = names.find((name) => hasChinese(name));
  if (chineseName) {
    return chineseName;
  }

  const byId = COUNTRY_ZH_BY_ID[Number(country.countryId)];
  if (byId) {
    return byId;
  }

  for (const name of names) {
    const normalizedName = normalizeEnglishKey(name);
    const mapped = COUNTRY_ZH_BY_ENGLISH_NAME[normalizedName] ?? COUNTRY_ZH_BY_INTL_ENGLISH_NAME[normalizedName];
    if (mapped) {
      return mapped;
    }
  }

  return "";
}

function resolveEnglishCountryName(country: SmsCountryLabelItem): string {
  return [
    normalizeName(country.countryNameEn),
    normalizeName(country.countryName),
    normalizeName(country.countryNameRu),
  ].find((name) => name && !hasChinese(name)) ?? "";
}

export function formatSmsCountryLabel(country: SmsCountryLabelItem): string {
  const chineseName = resolveChineseCountryName(country);
  const englishName = resolveEnglishCountryName(country);
  const primary = chineseName || englishName || normalizeName(country.countryNameRu) || `国家 ID: ${country.countryId}`;
  const secondary = englishName && englishName !== primary ? ` / ${englishName}` : "";
  const phoneCode = normalizeName(country.phoneCode);
  const phoneCodeSuffix = phoneCode ? ` +${phoneCode}` : "";
  return `${primary}${secondary}${phoneCodeSuffix} (ID:${country.countryId})`;
}
