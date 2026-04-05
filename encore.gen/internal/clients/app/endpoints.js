import { apiCall, streamIn, streamOut, streamInOut } from "encore.dev/internal/codegen/api";

const TEST_ENDPOINTS = typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test"
    ? await import("./endpoints_testing.js")
    : null;

export async function recordUsage(opts) {
    const params = undefined;
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.recordUsage(params, opts);
    }

    return apiCall("app", "recordUsage", params, opts);
}
export async function getContentDashboard(opts) {
    const params = undefined;
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.getContentDashboard(params, opts);
    }

    return apiCall("app", "getContentDashboard", params, opts);
}
export async function generateCampaign(opts) {
    const params = undefined;
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.generateCampaign(params, opts);
    }

    return apiCall("app", "generateCampaign", params, opts);
}
export async function ping(opts) {
    const params = undefined;
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.ping(params, opts);
    }

    return apiCall("app", "ping", params, opts);
}
export async function getHospitalityDashboard(opts) {
    const params = undefined;
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.getHospitalityDashboard(params, opts);
    }

    return apiCall("app", "getHospitalityDashboard", params, opts);
}
export async function getMyListings(opts) {
    const params = undefined;
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.getMyListings(params, opts);
    }

    return apiCall("app", "getMyListings", params, opts);
}
export async function deleteListing(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.deleteListing(params, opts);
    }

    return apiCall("app", "deleteListing", params, opts);
}
export async function getListing(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.getListing(params, opts);
    }

    return apiCall("app", "getListing", params, opts);
}
export async function saveListing(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.saveListing(params, opts);
    }

    return apiCall("app", "saveListing", params, opts);
}
export async function getHostBookings(opts) {
    const params = undefined;
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.getHostBookings(params, opts);
    }

    return apiCall("app", "getHostBookings", params, opts);
}
export async function updateBookingStatus(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.updateBookingStatus(params, opts);
    }

    return apiCall("app", "updateBookingStatus", params, opts);
}
export async function blockDates(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.blockDates(params, opts);
    }

    return apiCall("app", "blockDates", params, opts);
}
export async function submitVerification(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.submitVerification(params, opts);
    }

    return apiCall("app", "submitVerification", params, opts);
}
export async function getVerificationStatus(opts) {
    const params = undefined;
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.getVerificationStatus(params, opts);
    }

    return apiCall("app", "getVerificationStatus", params, opts);
}
export async function getMarketplaceFeed(opts) {
    const params = undefined;
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.getMarketplaceFeed(params, opts);
    }

    return apiCall("app", "getMarketplaceFeed", params, opts);
}
export async function concierge(opts) {
    const params = undefined;
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.concierge(params, opts);
    }

    return apiCall("app", "concierge", params, opts);
}
export async function getProperty(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.getProperty(params, opts);
    }

    return apiCall("app", "getProperty", params, opts);
}
export async function checkWishlist(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.checkWishlist(params, opts);
    }

    return apiCall("app", "checkWishlist", params, opts);
}
export async function toggleWishlist(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.toggleWishlist(params, opts);
    }

    return apiCall("app", "toggleWishlist", params, opts);
}
export async function getPropertyBookedDates(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.getPropertyBookedDates(params, opts);
    }

    return apiCall("app", "getPropertyBookedDates", params, opts);
}
export async function getPropertyReviews(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.getPropertyReviews(params, opts);
    }

    return apiCall("app", "getPropertyReviews", params, opts);
}
export async function submitReview(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.submitReview(params, opts);
    }

    return apiCall("app", "submitReview", params, opts);
}
export async function searchDestinations(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.searchDestinations(params, opts);
    }

    return apiCall("app", "searchDestinations", params, opts);
}
export async function getCatalog(opts) {
    const params = undefined;
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.getCatalog(params, opts);
    }

    return apiCall("app", "getCatalog", params, opts);
}
export async function demoLogin(opts) {
    const params = undefined;
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.demoLogin(params, opts);
    }

    return apiCall("app", "demoLogin", params, opts);
}
export async function getPlatformMe(opts) {
    const params = undefined;
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.getPlatformMe(params, opts);
    }

    return apiCall("app", "getPlatformMe", params, opts);
}
export async function getReferralsDashboard(opts) {
    const params = undefined;
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.getReferralsDashboard(params, opts);
    }

    return apiCall("app", "getReferralsDashboard", params, opts);
}
export async function getUploadUrl(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.getUploadUrl(params, opts);
    }

    return apiCall("app", "getUploadUrl", params, opts);
}
export async function getDownloadUrl(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.getDownloadUrl(params, opts);
    }

    return apiCall("app", "getDownloadUrl", params, opts);
}
export async function getPublicUrl(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.getPublicUrl(params, opts);
    }

    return apiCall("app", "getPublicUrl", params, opts);
}

export class Client {
  constructor() {
    this.recordUsage = recordUsage;
    this.getContentDashboard = getContentDashboard;
    this.generateCampaign = generateCampaign;
    this.ping = ping;
    this.getHospitalityDashboard = getHospitalityDashboard;
    this.getMyListings = getMyListings;
    this.deleteListing = deleteListing;
    this.getListing = getListing;
    this.saveListing = saveListing;
    this.getHostBookings = getHostBookings;
    this.updateBookingStatus = updateBookingStatus;
    this.blockDates = blockDates;
    this.submitVerification = submitVerification;
    this.getVerificationStatus = getVerificationStatus;
    this.getMarketplaceFeed = getMarketplaceFeed;
    this.concierge = concierge;
    this.getProperty = getProperty;
    this.checkWishlist = checkWishlist;
    this.toggleWishlist = toggleWishlist;
    this.getPropertyBookedDates = getPropertyBookedDates;
    this.getPropertyReviews = getPropertyReviews;
    this.submitReview = submitReview;
    this.searchDestinations = searchDestinations;
    this.getCatalog = getCatalog;
    this.demoLogin = demoLogin;
    this.getPlatformMe = getPlatformMe;
    this.getReferralsDashboard = getReferralsDashboard;
    this.getUploadUrl = getUploadUrl;
    this.getDownloadUrl = getDownloadUrl;
    this.getPublicUrl = getPublicUrl;
  }
}

let _client_instance;

export function ref() {
  if (!_client_instance) {
    _client_instance = new Client();
  }
  return _client_instance;
}
