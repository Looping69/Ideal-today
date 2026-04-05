import { apiCall, streamIn, streamOut, streamInOut } from "encore.dev/internal/codegen/api";
import { registerTestHandler } from "encore.dev/internal/codegen/appinit";

import * as app_service from "../../../../encore.service";

export async function recordUsage(params, opts) {
    const handler = (await import("../../../../analytics\\api")).recordUsage;
    registerTestHandler({
        apiRoute: { service: "app", name: "recordUsage", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: app_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("app", "recordUsage", params, opts);
}

export async function getContentDashboard(params, opts) {
    const handler = (await import("../../../../content\\api")).getContentDashboard;
    registerTestHandler({
        apiRoute: { service: "app", name: "getContentDashboard", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: app_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("app", "getContentDashboard", params, opts);
}

export async function generateCampaign(params, opts) {
    const handler = (await import("../../../../content\\api")).generateCampaign;
    registerTestHandler({
        apiRoute: { service: "app", name: "generateCampaign", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: app_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("app", "generateCampaign", params, opts);
}

export async function ping(params, opts) {
    const handler = (await import("../../../../hello\\hello")).ping;
    registerTestHandler({
        apiRoute: { service: "app", name: "ping", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: app_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("app", "ping", params, opts);
}

export async function getHospitalityDashboard(params, opts) {
    const handler = (await import("../../../../hospitality\\api")).getHospitalityDashboard;
    registerTestHandler({
        apiRoute: { service: "app", name: "getHospitalityDashboard", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: app_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("app", "getHospitalityDashboard", params, opts);
}

export async function getMyListings(params, opts) {
    const handler = (await import("../../../../hospitality\\api")).getMyListings;
    registerTestHandler({
        apiRoute: { service: "app", name: "getMyListings", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: app_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("app", "getMyListings", params, opts);
}

export async function deleteListing(params, opts) {
    const handler = (await import("../../../../hospitality\\api")).deleteListing;
    registerTestHandler({
        apiRoute: { service: "app", name: "deleteListing", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: app_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("app", "deleteListing", params, opts);
}

export async function getListing(params, opts) {
    const handler = (await import("../../../../hospitality\\api")).getListing;
    registerTestHandler({
        apiRoute: { service: "app", name: "getListing", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: app_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("app", "getListing", params, opts);
}

export async function saveListing(params, opts) {
    const handler = (await import("../../../../hospitality\\api")).saveListing;
    registerTestHandler({
        apiRoute: { service: "app", name: "saveListing", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: app_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("app", "saveListing", params, opts);
}

export async function getHostBookings(params, opts) {
    const handler = (await import("../../../../hospitality\\api")).getHostBookings;
    registerTestHandler({
        apiRoute: { service: "app", name: "getHostBookings", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: app_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("app", "getHostBookings", params, opts);
}

export async function updateBookingStatus(params, opts) {
    const handler = (await import("../../../../hospitality\\api")).updateBookingStatus;
    registerTestHandler({
        apiRoute: { service: "app", name: "updateBookingStatus", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: app_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("app", "updateBookingStatus", params, opts);
}

export async function blockDates(params, opts) {
    const handler = (await import("../../../../hospitality\\api")).blockDates;
    registerTestHandler({
        apiRoute: { service: "app", name: "blockDates", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: app_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("app", "blockDates", params, opts);
}

export async function submitVerification(params, opts) {
    const handler = (await import("../../../../hospitality\\api")).submitVerification;
    registerTestHandler({
        apiRoute: { service: "app", name: "submitVerification", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: app_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("app", "submitVerification", params, opts);
}

export async function getVerificationStatus(params, opts) {
    const handler = (await import("../../../../hospitality\\api")).getVerificationStatus;
    registerTestHandler({
        apiRoute: { service: "app", name: "getVerificationStatus", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: app_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("app", "getVerificationStatus", params, opts);
}

export async function getMarketplaceFeed(params, opts) {
    const handler = (await import("../../../../marketplace\\api")).getMarketplaceFeed;
    registerTestHandler({
        apiRoute: { service: "app", name: "getMarketplaceFeed", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: app_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("app", "getMarketplaceFeed", params, opts);
}

export async function concierge(params, opts) {
    const handler = (await import("../../../../marketplace\\api")).concierge;
    registerTestHandler({
        apiRoute: { service: "app", name: "concierge", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: app_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("app", "concierge", params, opts);
}

export async function getProperty(params, opts) {
    const handler = (await import("../../../../marketplace\\api")).getProperty;
    registerTestHandler({
        apiRoute: { service: "app", name: "getProperty", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: app_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("app", "getProperty", params, opts);
}

export async function checkWishlist(params, opts) {
    const handler = (await import("../../../../marketplace\\api")).checkWishlist;
    registerTestHandler({
        apiRoute: { service: "app", name: "checkWishlist", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: app_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("app", "checkWishlist", params, opts);
}

export async function toggleWishlist(params, opts) {
    const handler = (await import("../../../../marketplace\\api")).toggleWishlist;
    registerTestHandler({
        apiRoute: { service: "app", name: "toggleWishlist", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: app_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("app", "toggleWishlist", params, opts);
}

export async function getPropertyBookedDates(params, opts) {
    const handler = (await import("../../../../marketplace\\api")).getPropertyBookedDates;
    registerTestHandler({
        apiRoute: { service: "app", name: "getPropertyBookedDates", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: app_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("app", "getPropertyBookedDates", params, opts);
}

export async function getPropertyReviews(params, opts) {
    const handler = (await import("../../../../marketplace\\api")).getPropertyReviews;
    registerTestHandler({
        apiRoute: { service: "app", name: "getPropertyReviews", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: app_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("app", "getPropertyReviews", params, opts);
}

export async function submitReview(params, opts) {
    const handler = (await import("../../../../marketplace\\api")).submitReview;
    registerTestHandler({
        apiRoute: { service: "app", name: "submitReview", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: app_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("app", "submitReview", params, opts);
}

export async function searchDestinations(params, opts) {
    const handler = (await import("../../../../marketplace\\api")).searchDestinations;
    registerTestHandler({
        apiRoute: { service: "app", name: "searchDestinations", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: app_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("app", "searchDestinations", params, opts);
}

export async function getCatalog(params, opts) {
    const handler = (await import("../../../../platform\\api")).getCatalog;
    registerTestHandler({
        apiRoute: { service: "app", name: "getCatalog", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: app_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("app", "getCatalog", params, opts);
}

export async function demoLogin(params, opts) {
    const handler = (await import("../../../../platform\\api")).demoLogin;
    registerTestHandler({
        apiRoute: { service: "app", name: "demoLogin", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: app_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("app", "demoLogin", params, opts);
}

export async function getPlatformMe(params, opts) {
    const handler = (await import("../../../../platform\\api")).getPlatformMe;
    registerTestHandler({
        apiRoute: { service: "app", name: "getPlatformMe", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: app_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("app", "getPlatformMe", params, opts);
}

export async function getReferralsDashboard(params, opts) {
    const handler = (await import("../../../../referrals\\api")).getReferralsDashboard;
    registerTestHandler({
        apiRoute: { service: "app", name: "getReferralsDashboard", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: app_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("app", "getReferralsDashboard", params, opts);
}

export async function getUploadUrl(params, opts) {
    const handler = (await import("../../../../storage\\api")).getUploadUrl;
    registerTestHandler({
        apiRoute: { service: "app", name: "getUploadUrl", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: app_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("app", "getUploadUrl", params, opts);
}

export async function getDownloadUrl(params, opts) {
    const handler = (await import("../../../../storage\\api")).getDownloadUrl;
    registerTestHandler({
        apiRoute: { service: "app", name: "getDownloadUrl", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: app_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("app", "getDownloadUrl", params, opts);
}

export async function getPublicUrl(params, opts) {
    const handler = (await import("../../../../storage\\api")).getPublicUrl;
    registerTestHandler({
        apiRoute: { service: "app", name: "getPublicUrl", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: app_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("app", "getPublicUrl", params, opts);
}

