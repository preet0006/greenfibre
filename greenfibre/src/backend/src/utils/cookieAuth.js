const isProd = () => process.env.NODE_ENV === "production";

/**
 * Cross-subdomain cookie options for admin/main frontends
 * (admin.greenfibre.org / www.greenfibre.org → api.greenfibre.org).
 * SameSite=strict blocks credentialed cross-origin cookies.
 */
const baseCookieOptions = () => ({
    httpOnly: true,
    secure: isProd(),
    sameSite: isProd() ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
    ...(isProd() && process.env.COOKIE_DOMAIN
        ? { domain: process.env.COOKIE_DOMAIN }
        : {}),
});

export const USER_TOKEN_COOKIE = "token";
export const ADMIN_TOKEN_COOKIE = "admin_token";

export const authCookieOptions = baseCookieOptions();
export const clearAuthCookieOptions = {
    httpOnly: true,
    secure: isProd(),
    sameSite: isProd() ? "none" : "lax",
    path: "/",
    ...(isProd() && process.env.COOKIE_DOMAIN
        ? { domain: process.env.COOKIE_DOMAIN }
        : {}),
};
