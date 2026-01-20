import { init } from "@instantdb/react";
import schema from "../../instant.schema";

const APP_ID = import.meta.env.VITE_INSTANT_APP_ID || "232db8fc-efd3-4111-bbdc-31d69b6f171f";

console.log("[DC] InstantDB App ID:", APP_ID);

export const db = init({ appId: APP_ID, schema });

export type DB = typeof db;
