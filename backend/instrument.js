import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://c08947bf9265b7c8bff7c8ae3b0489fb@o4511529517252608.ingest.us.sentry.io/4511529534554112",
  environment: process.env.NODE_ENV || "production",
  sendDefaultPii: true,
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});
