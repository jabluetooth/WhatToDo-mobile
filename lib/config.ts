/**
 * The WhatToDo backend (and web app) this build talks to.
 *
 * Set by EXPO_PUBLIC_API_BASE_URL: from `.env` in local development, and from the EAS "production"
 * environment for published updates (`eas update --environment production` reads EAS's variables,
 * not `.env`). Falls back to the live deployment rather than localhost, so a build that's missing
 * the variable still works instead of sending sign-in to a machine that isn't there.
 *
 * Read as the literal `process.env.EXPO_PUBLIC_API_BASE_URL` so Expo inlines it at build time.
 */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "https://whattodoby.filheinzrelatorre.com";
