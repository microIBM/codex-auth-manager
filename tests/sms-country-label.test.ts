import assert from "node:assert/strict";
import {formatSmsCountryLabel} from "../web/src/sms-country-label.js";

assert.equal(
  formatSmsCountryLabel({
    countryId: 151,
    countryName: "Chile",
    countryNameEn: "",
    countryNameRu: "",
    phoneCode: "",
  }),
  "智利 / Chile (ID:151)",
);

assert.equal(
  formatSmsCountryLabel({
    countryId: 3,
    countryName: "中国",
    countryNameEn: "China",
    countryNameRu: "Китай",
    phoneCode: "",
  }),
  "中国 / China (ID:3)",
);

assert.deepEqual(
  [
    [152, "Burkina Faso"],
    [153, "Lebanon"],
    [154, "Gabon"],
    [155, "Albania"],
    [156, "Uruguay"],
    [157, "Mauritius"],
  ].map(([countryId, countryName]) => formatSmsCountryLabel({
    countryId: Number(countryId),
    countryName: String(countryName),
    countryNameEn: "",
    countryNameRu: "",
    phoneCode: "",
  })),
  [
    "布基纳法索 / Burkina Faso (ID:152)",
    "黎巴嫩 / Lebanon (ID:153)",
    "加蓬 / Gabon (ID:154)",
    "阿尔巴尼亚 / Albania (ID:155)",
    "乌拉圭 / Uruguay (ID:156)",
    "毛里求斯 / Mauritius (ID:157)",
  ],
);

assert.deepEqual(
  ["Czechia", "Côte d’Ivoire"].map((countryName, index) => formatSmsCountryLabel({
    countryId: 900 + index,
    countryName,
    countryNameEn: "",
    countryNameRu: "",
    phoneCode: "",
  })),
  [
    "捷克 / Czechia (ID:900)",
    "科特迪瓦 / Côte d’Ivoire (ID:901)",
  ],
);
