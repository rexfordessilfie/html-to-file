import * as path from "path";

import { GenerateEndpointQueryParams } from "../util/types";

// Environment-based constants
export const ROOT_DIR = process.env.NODE_PATH || "../";
export const PORT = process.env.PORT || 4000;
export const PUBLIC_URL =
  process.env.NODE_ENV === "production"
    ? process.env.PUBLIC_URL
    : `http://localhost:${PORT}`;

// Regular constants
export const DUMP_DIRECTORY = path.resolve(ROOT_DIR, "temp");
export const DEFAULT_GENERATE_ENDPOINT_QUERY: Partial<GenerateEndpointQueryParams> =
  {
    responseKind: "json",
    autoRegenerate: "true",
    fallbackUrl: "",
  };
