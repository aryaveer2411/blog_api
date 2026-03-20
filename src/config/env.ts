import * as dotenv from "dotenv";
dotenv.config();

import { validateEnv } from "../validators/env_validator";

export const env = validateEnv();
