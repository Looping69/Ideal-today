import { CallOpts } from "encore.dev/api";

type Parameters<T> = T extends (...args: infer P) => unknown ? P : never;
type WithCallOpts<T extends (...args: any) => any> = (
  ...args: [...Parameters<T>, opts?: CallOpts]
) => ReturnType<T>;

import { recordUsage as recordUsage_handler } from "../../../../analytics\\api.js";
type recordUsage_Type = WithCallOpts<typeof recordUsage_handler>;
declare const recordUsage: recordUsage_Type;
export { recordUsage };

import { getContentDashboard as getContentDashboard_handler } from "../../../../content\\api.js";
type getContentDashboard_Type = WithCallOpts<typeof getContentDashboard_handler>;
declare const getContentDashboard: getContentDashboard_Type;
export { getContentDashboard };

import { generateCampaign as generateCampaign_handler } from "../../../../content\\api.js";
type generateCampaign_Type = WithCallOpts<typeof generateCampaign_handler>;
declare const generateCampaign: generateCampaign_Type;
export { generateCampaign };

import { ping as ping_handler } from "../../../../hello\\hello.js";
type ping_Type = WithCallOpts<typeof ping_handler>;
declare const ping: ping_Type;
export { ping };

import { getHospitalityDashboard as getHospitalityDashboard_handler } from "../../../../hospitality\\api.js";
type getHospitalityDashboard_Type = WithCallOpts<typeof getHospitalityDashboard_handler>;
declare const getHospitalityDashboard: getHospitalityDashboard_Type;
export { getHospitalityDashboard };

import { getMyListings as getMyListings_handler } from "../../../../hospitality\\api.js";
type getMyListings_Type = WithCallOpts<typeof getMyListings_handler>;
declare const getMyListings: getMyListings_Type;
export { getMyListings };

import { deleteListing as deleteListing_handler } from "../../../../hospitality\\api.js";
type deleteListing_Type = WithCallOpts<typeof deleteListing_handler>;
declare const deleteListing: deleteListing_Type;
export { deleteListing };

import { getListing as getListing_handler } from "../../../../hospitality\\api.js";
type getListing_Type = WithCallOpts<typeof getListing_handler>;
declare const getListing: getListing_Type;
export { getListing };

import { saveListing as saveListing_handler } from "../../../../hospitality\\api.js";
type saveListing_Type = WithCallOpts<typeof saveListing_handler>;
declare const saveListing: saveListing_Type;
export { saveListing };

import { getHostBookings as getHostBookings_handler } from "../../../../hospitality\\api.js";
type getHostBookings_Type = WithCallOpts<typeof getHostBookings_handler>;
declare const getHostBookings: getHostBookings_Type;
export { getHostBookings };

import { updateBookingStatus as updateBookingStatus_handler } from "../../../../hospitality\\api.js";
type updateBookingStatus_Type = WithCallOpts<typeof updateBookingStatus_handler>;
declare const updateBookingStatus: updateBookingStatus_Type;
export { updateBookingStatus };

import { blockDates as blockDates_handler } from "../../../../hospitality\\api.js";
type blockDates_Type = WithCallOpts<typeof blockDates_handler>;
declare const blockDates: blockDates_Type;
export { blockDates };

import { submitVerification as submitVerification_handler } from "../../../../hospitality\\api.js";
type submitVerification_Type = WithCallOpts<typeof submitVerification_handler>;
declare const submitVerification: submitVerification_Type;
export { submitVerification };

import { getVerificationStatus as getVerificationStatus_handler } from "../../../../hospitality\\api.js";
type getVerificationStatus_Type = WithCallOpts<typeof getVerificationStatus_handler>;
declare const getVerificationStatus: getVerificationStatus_Type;
export { getVerificationStatus };

import { getMarketplaceFeed as getMarketplaceFeed_handler } from "../../../../marketplace\\api.js";
type getMarketplaceFeed_Type = WithCallOpts<typeof getMarketplaceFeed_handler>;
declare const getMarketplaceFeed: getMarketplaceFeed_Type;
export { getMarketplaceFeed };

import { concierge as concierge_handler } from "../../../../marketplace\\api.js";
type concierge_Type = WithCallOpts<typeof concierge_handler>;
declare const concierge: concierge_Type;
export { concierge };

import { getProperty as getProperty_handler } from "../../../../marketplace\\api.js";
type getProperty_Type = WithCallOpts<typeof getProperty_handler>;
declare const getProperty: getProperty_Type;
export { getProperty };

import { checkWishlist as checkWishlist_handler } from "../../../../marketplace\\api.js";
type checkWishlist_Type = WithCallOpts<typeof checkWishlist_handler>;
declare const checkWishlist: checkWishlist_Type;
export { checkWishlist };

import { toggleWishlist as toggleWishlist_handler } from "../../../../marketplace\\api.js";
type toggleWishlist_Type = WithCallOpts<typeof toggleWishlist_handler>;
declare const toggleWishlist: toggleWishlist_Type;
export { toggleWishlist };

import { getPropertyBookedDates as getPropertyBookedDates_handler } from "../../../../marketplace\\api.js";
type getPropertyBookedDates_Type = WithCallOpts<typeof getPropertyBookedDates_handler>;
declare const getPropertyBookedDates: getPropertyBookedDates_Type;
export { getPropertyBookedDates };

import { getPropertyReviews as getPropertyReviews_handler } from "../../../../marketplace\\api.js";
type getPropertyReviews_Type = WithCallOpts<typeof getPropertyReviews_handler>;
declare const getPropertyReviews: getPropertyReviews_Type;
export { getPropertyReviews };

import { submitReview as submitReview_handler } from "../../../../marketplace\\api.js";
type submitReview_Type = WithCallOpts<typeof submitReview_handler>;
declare const submitReview: submitReview_Type;
export { submitReview };

import { searchDestinations as searchDestinations_handler } from "../../../../marketplace\\api.js";
type searchDestinations_Type = WithCallOpts<typeof searchDestinations_handler>;
declare const searchDestinations: searchDestinations_Type;
export { searchDestinations };

import { getCatalog as getCatalog_handler } from "../../../../platform\\api.js";
type getCatalog_Type = WithCallOpts<typeof getCatalog_handler>;
declare const getCatalog: getCatalog_Type;
export { getCatalog };

import { demoLogin as demoLogin_handler } from "../../../../platform\\api.js";
type demoLogin_Type = WithCallOpts<typeof demoLogin_handler>;
declare const demoLogin: demoLogin_Type;
export { demoLogin };

import { getPlatformMe as getPlatformMe_handler } from "../../../../platform\\api.js";
type getPlatformMe_Type = WithCallOpts<typeof getPlatformMe_handler>;
declare const getPlatformMe: getPlatformMe_Type;
export { getPlatformMe };

import { getReferralsDashboard as getReferralsDashboard_handler } from "../../../../referrals\\api.js";
type getReferralsDashboard_Type = WithCallOpts<typeof getReferralsDashboard_handler>;
declare const getReferralsDashboard: getReferralsDashboard_Type;
export { getReferralsDashboard };

import { getUploadUrl as getUploadUrl_handler } from "../../../../storage\\api.js";
type getUploadUrl_Type = WithCallOpts<typeof getUploadUrl_handler>;
declare const getUploadUrl: getUploadUrl_Type;
export { getUploadUrl };

import { getDownloadUrl as getDownloadUrl_handler } from "../../../../storage\\api.js";
type getDownloadUrl_Type = WithCallOpts<typeof getDownloadUrl_handler>;
declare const getDownloadUrl: getDownloadUrl_Type;
export { getDownloadUrl };

import { getPublicUrl as getPublicUrl_handler } from "../../../../storage\\api.js";
type getPublicUrl_Type = WithCallOpts<typeof getPublicUrl_handler>;
declare const getPublicUrl: getPublicUrl_Type;
export { getPublicUrl };


export class Client {
  private constructor();

  readonly recordUsage: recordUsage_Type;
  readonly getContentDashboard: getContentDashboard_Type;
  readonly generateCampaign: generateCampaign_Type;
  readonly ping: ping_Type;
  readonly getHospitalityDashboard: getHospitalityDashboard_Type;
  readonly getMyListings: getMyListings_Type;
  readonly deleteListing: deleteListing_Type;
  readonly getListing: getListing_Type;
  readonly saveListing: saveListing_Type;
  readonly getHostBookings: getHostBookings_Type;
  readonly updateBookingStatus: updateBookingStatus_Type;
  readonly blockDates: blockDates_Type;
  readonly submitVerification: submitVerification_Type;
  readonly getVerificationStatus: getVerificationStatus_Type;
  readonly getMarketplaceFeed: getMarketplaceFeed_Type;
  readonly concierge: concierge_Type;
  readonly getProperty: getProperty_Type;
  readonly checkWishlist: checkWishlist_Type;
  readonly toggleWishlist: toggleWishlist_Type;
  readonly getPropertyBookedDates: getPropertyBookedDates_Type;
  readonly getPropertyReviews: getPropertyReviews_Type;
  readonly submitReview: submitReview_Type;
  readonly searchDestinations: searchDestinations_Type;
  readonly getCatalog: getCatalog_Type;
  readonly demoLogin: demoLogin_Type;
  readonly getPlatformMe: getPlatformMe_Type;
  readonly getReferralsDashboard: getReferralsDashboard_Type;
  readonly getUploadUrl: getUploadUrl_Type;
  readonly getDownloadUrl: getDownloadUrl_Type;
  readonly getPublicUrl: getPublicUrl_Type;
}

export declare function ref(): Client;
