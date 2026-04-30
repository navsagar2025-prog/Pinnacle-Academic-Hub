import { loadConfig } from "../lib/config-store.js";
import type { OcrAdapter } from "./adapter.js";
import { Pix2TextAdapter } from "./pix2text.js";
import { SimpletexAdapter } from "./simpletex.js";
import { LatexOcrAdapter } from "./latexocr.js";
import { MathpixAdapter } from "./mathpix.js";
import { GoogleVisionAdapter } from "./google-vision.js";

export function createOcrAdapter(): OcrAdapter {
  const config = loadConfig();
  const provider = config.activeProvider;
  const providerConfig = config.providers[provider];

  switch (provider) {
    case "pix2text":
      return new Pix2TextAdapter(
        providerConfig.endpointUrl,
        "apiKey" in providerConfig ? providerConfig.apiKey : "",
      );

    case "simpletex":
      return new SimpletexAdapter(
        providerConfig.endpointUrl,
        "apiKey" in providerConfig ? providerConfig.apiKey : "",
      );

    case "latexocr":
      return new LatexOcrAdapter(
        providerConfig.endpointUrl,
        "apiKey" in providerConfig ? providerConfig.apiKey : "",
      );

    case "mathpix": {
      const mp = config.providers.mathpix;
      return new MathpixAdapter(mp.endpointUrl, mp.appId, mp.appKey);
    }

    case "google-vision":
      return new GoogleVisionAdapter(
        providerConfig.endpointUrl,
        "apiKey" in providerConfig ? providerConfig.apiKey : "",
      );

    default:
      return new Pix2TextAdapter(
        config.providers.pix2text.endpointUrl,
        config.providers.pix2text.apiKey,
      );
  }
}
