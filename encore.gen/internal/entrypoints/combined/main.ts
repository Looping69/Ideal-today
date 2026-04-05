import { registerGateways, registerHandlers, run, type Handler } from "encore.dev/internal/codegen/appinit";

import { gateway as api_gatewayGW } from "../../../../platform\\auth";
import { recordUsage as app_recordUsageImpl0 } from "../../../../analytics\\api";
import { getContentDashboard as app_getContentDashboardImpl1 } from "../../../../content\\api";
import { generateCampaign as app_generateCampaignImpl2 } from "../../../../content\\api";
import { ping as app_pingImpl3 } from "../../../../hello\\hello";
import { getHospitalityDashboard as app_getHospitalityDashboardImpl4 } from "../../../../hospitality\\api";
import { getMyListings as app_getMyListingsImpl5 } from "../../../../hospitality\\api";
import { deleteListing as app_deleteListingImpl6 } from "../../../../hospitality\\api";
import { getListing as app_getListingImpl7 } from "../../../../hospitality\\api";
import { saveListing as app_saveListingImpl8 } from "../../../../hospitality\\api";
import { getHostBookings as app_getHostBookingsImpl9 } from "../../../../hospitality\\api";
import { updateBookingStatus as app_updateBookingStatusImpl10 } from "../../../../hospitality\\api";
import { blockDates as app_blockDatesImpl11 } from "../../../../hospitality\\api";
import { submitVerification as app_submitVerificationImpl12 } from "../../../../hospitality\\api";
import { getVerificationStatus as app_getVerificationStatusImpl13 } from "../../../../hospitality\\api";
import { getMarketplaceFeed as app_getMarketplaceFeedImpl14 } from "../../../../marketplace\\api";
import { concierge as app_conciergeImpl15 } from "../../../../marketplace\\api";
import { getProperty as app_getPropertyImpl16 } from "../../../../marketplace\\api";
import { checkWishlist as app_checkWishlistImpl17 } from "../../../../marketplace\\api";
import { toggleWishlist as app_toggleWishlistImpl18 } from "../../../../marketplace\\api";
import { getPropertyBookedDates as app_getPropertyBookedDatesImpl19 } from "../../../../marketplace\\api";
import { getPropertyReviews as app_getPropertyReviewsImpl20 } from "../../../../marketplace\\api";
import { submitReview as app_submitReviewImpl21 } from "../../../../marketplace\\api";
import { searchDestinations as app_searchDestinationsImpl22 } from "../../../../marketplace\\api";
import { getCatalog as app_getCatalogImpl23 } from "../../../../platform\\api";
import { demoLogin as app_demoLoginImpl24 } from "../../../../platform\\api";
import { getPlatformMe as app_getPlatformMeImpl25 } from "../../../../platform\\api";
import { getReferralsDashboard as app_getReferralsDashboardImpl26 } from "../../../../referrals\\api";
import { getUploadUrl as app_getUploadUrlImpl27 } from "../../../../storage\\api";
import { getDownloadUrl as app_getDownloadUrlImpl28 } from "../../../../storage\\api";
import { getPublicUrl as app_getPublicUrlImpl29 } from "../../../../storage\\api";
import "../../../../content\\seed";
import "../../../../hospitality\\seed";
import "../../../../referrals\\seed";
import * as app_service from "../../../../encore.service";


const gateways: any[] = [
    api_gatewayGW,
];

const handlers: Handler[] = [
    {
        apiRoute: {
            service:           "app",
            name:              "recordUsage",
            handler:           app_recordUsageImpl0,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: app_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "app",
            name:              "getContentDashboard",
            handler:           app_getContentDashboardImpl1,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: app_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "app",
            name:              "generateCampaign",
            handler:           app_generateCampaignImpl2,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: app_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "app",
            name:              "ping",
            handler:           app_pingImpl3,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: app_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "app",
            name:              "getHospitalityDashboard",
            handler:           app_getHospitalityDashboardImpl4,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: app_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "app",
            name:              "getMyListings",
            handler:           app_getMyListingsImpl5,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: app_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "app",
            name:              "deleteListing",
            handler:           app_deleteListingImpl6,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: app_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "app",
            name:              "getListing",
            handler:           app_getListingImpl7,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: app_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "app",
            name:              "saveListing",
            handler:           app_saveListingImpl8,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: app_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "app",
            name:              "getHostBookings",
            handler:           app_getHostBookingsImpl9,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: app_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "app",
            name:              "updateBookingStatus",
            handler:           app_updateBookingStatusImpl10,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: app_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "app",
            name:              "blockDates",
            handler:           app_blockDatesImpl11,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: app_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "app",
            name:              "submitVerification",
            handler:           app_submitVerificationImpl12,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: app_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "app",
            name:              "getVerificationStatus",
            handler:           app_getVerificationStatusImpl13,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: app_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "app",
            name:              "getMarketplaceFeed",
            handler:           app_getMarketplaceFeedImpl14,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: app_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "app",
            name:              "concierge",
            handler:           app_conciergeImpl15,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: app_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "app",
            name:              "getProperty",
            handler:           app_getPropertyImpl16,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: app_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "app",
            name:              "checkWishlist",
            handler:           app_checkWishlistImpl17,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: app_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "app",
            name:              "toggleWishlist",
            handler:           app_toggleWishlistImpl18,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: app_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "app",
            name:              "getPropertyBookedDates",
            handler:           app_getPropertyBookedDatesImpl19,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: app_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "app",
            name:              "getPropertyReviews",
            handler:           app_getPropertyReviewsImpl20,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: app_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "app",
            name:              "submitReview",
            handler:           app_submitReviewImpl21,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: app_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "app",
            name:              "searchDestinations",
            handler:           app_searchDestinationsImpl22,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: app_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "app",
            name:              "getCatalog",
            handler:           app_getCatalogImpl23,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: app_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "app",
            name:              "demoLogin",
            handler:           app_demoLoginImpl24,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: app_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "app",
            name:              "getPlatformMe",
            handler:           app_getPlatformMeImpl25,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: app_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "app",
            name:              "getReferralsDashboard",
            handler:           app_getReferralsDashboardImpl26,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: app_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "app",
            name:              "getUploadUrl",
            handler:           app_getUploadUrlImpl27,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: app_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "app",
            name:              "getDownloadUrl",
            handler:           app_getDownloadUrlImpl28,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: app_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "app",
            name:              "getPublicUrl",
            handler:           app_getPublicUrlImpl29,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: app_service.default.cfg.middlewares || [],
    },
];

registerGateways(gateways);
registerHandlers(handlers);

await run(import.meta.url);
