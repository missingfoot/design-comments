import { init } from "@instantdb/react";
import schema from "../../instant.schema";

const APP_ID = import.meta.env.VITE_INSTANT_APP_ID;

if (!APP_ID) {
  throw new Error(
    "[Design Comments] Missing VITE_INSTANT_APP_ID environment variable. " +
    "Please set it to your InstantDB app ID."
  );
}

export const db = init({ appId: APP_ID, schema });

export type DB = typeof db;
