import { registerHandlers, run, type Handler } from "encore.dev/internal/codegen/appinit";
import { Worker, isMainThread } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import { availableParallelism } from "node:os";

import { recordUsage as recordUsageImpl0 } from "../../../../../analytics\\api";
import { getContentDashboard as getContentDashboardImpl1 } from "../../../../../content\\api";
import { generateCampaign as generateCampaignImpl2 } from "../../../../../content\\api";
import { ping as pingImpl3 } from "../../../../../hello\\hello";
import { getHospitalityDashboard as getHospitalityDashboardImpl4 } from "../../../../../hospitality\\api";
import { getMyListings as getMyListingsImpl5 } from "../../../../../hospitality\\api";
import { deleteListing as deleteListingImpl6 } from "../../../../../hospitality\\api";
import { getListing as getListingImpl7 } from "../../../../../hospitality\\api";
import { saveListing as saveListingImpl8 } from "../../../../../hospitality\\api";
import { getHostBookings as getHostBookingsImpl9 } from "../../../../../hospitality\\api";
import { updateBookingStatus as updateBookingStatusImpl10 } from "../../../../../hospitality\\api";
import { blockDates as blockDatesImpl11 } from "../../../../../hospitality\\api";
import { submitVerification as submitVerificationImpl12 } from "../../../../../hospitality\\api";
import { getVerificationStatus as getVerificationStatusImpl13 } from "../../../../../hospitality\\api";
import { getMarketplaceFeed as getMarketplaceFeedImpl14 } from "../../../../../marketplace\\api";
import { concierge as conciergeImpl15 } from "../../../../../marketplace\\api";
import { getProperty as getPropertyImpl16 } from "../../../../../marketplace\\api";
import { checkWishlist as checkWishlistImpl17 } from "../../../../../marketplace\\api";
import { toggleWishlist as toggleWishlistImpl18 } from "../../../../../marketplace\\api";
import { getPropertyBookedDates as getPropertyBookedDatesImpl19 } from "../../../../../marketplace\\api";
import { getPropertyReviews as getPropertyReviewsImpl20 } from "../../../../../marketplace\\api";
import { submitReview as submitReviewImpl21 } from "../../../../../marketplace\\api";
import { searchDestinations as searchDestinationsImpl22 } from "../../../../../marketplace\\api";
import { getCatalog as getCatalogImpl23 } from "../../../../../platform\\api";
import { demoLogin as demoLoginImpl24 } from "../../../../../platform\\api";
import { getPlatformMe as getPlatformMeImpl25 } from "../../../../../platform\\api";
import { getReferralsDashboard as getReferralsDashboardImpl26 } from "../../../../../referrals\\api";
import { getUploadUrl as getUploadUrlImpl27 } from "../../../../../storage\\api";
import { getDownloadUrl as getDownloadUrlImpl28 } from "../../../../../storage\\api";
import { getPublicUrl as getPublicUrlImpl29 } from "../../../../../storage\\api";
import "../../../../../content\\seed";
import "../../../../../hospitality\\seed";
import "../../../../../referrals\\seed";
import * as app_service from "../../../../../encore.service";

const handlers: Handler[] = [
    {
        apiRoute: {
            service:           "app",
            name:              "recordUsage",
            handler:           recordUsageImpl0,
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
            handler:           getContentDashboardImpl1,
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
            handler:           generateCampaignImpl2,
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
            handler:           pingImpl3,
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
            handler:           getHospitalityDashboardImpl4,
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
            handler:           getMyListingsImpl5,
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
            handler:           deleteListingImpl6,
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
            handler:           getListingImpl7,
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
            handler:           saveListingImpl8,
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
            handler:           getHostBookingsImpl9,
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
            handler:           updateBookingStatusImpl10,
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
            handler:           blockDatesImpl11,
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
            handler:           submitVerificationImpl12,
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
            handler:           getVerificationStatusImpl13,
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
            handler:           getMarketplaceFeedImpl14,
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
            handler:           conciergeImpl15,
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
            handler:           getPropertyImpl16,
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
            handler:           checkWishlistImpl17,
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
            handler:           toggleWishlistImpl18,
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
            handler:           getPropertyBookedDatesImpl19,
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
            handler:           getPropertyReviewsImpl20,
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
            handler:           submitReviewImpl21,
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
            handler:           searchDestinationsImpl22,
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
            handler:           getCatalogImpl23,
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
            handler:           demoLoginImpl24,
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
            handler:           getPlatformMeImpl25,
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
            handler:           getReferralsDashboardImpl26,
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
            handler:           getUploadUrlImpl27,
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
            handler:           getDownloadUrlImpl28,
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
            handler:           getPublicUrlImpl29,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: app_service.default.cfg.middlewares || [],
    },
];

registerHandlers(handlers);

await run(import.meta.url);
