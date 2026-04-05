// This file was bundled by Encore v1.56.0
//
// https://encore.dev

// encore.gen/internal/entrypoints/combined/main.ts
import { registerGateways, registerHandlers, run } from "encore.dev/internal/codegen/appinit";

// platform/auth.ts
import { Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";

// platform/db.ts
import { SQLDatabase } from "encore.dev/storage/sqldb";
var platformDB = new SQLDatabase("platform", {
  migrations: "./migrations"
});

// platform/auth.ts
var auth = authHandler(
  async (params) => {
    const token = params.authorization.replace(/^Bearer\s/i, "");
    if (!token)
      throw new Error("Missing auth token");
    const row = await platformDB.queryRow`
      SELECT 
        session_token.operator_id, 
        operator_user.workspace_id, 
        workspace.tier
      FROM session_token
      JOIN operator_user ON operator_user.id = session_token.operator_id
      JOIN workspace ON workspace.id = operator_user.workspace_id
      WHERE token = ${token} AND expires_at > NOW()
    `;
    if (!row) {
      throw new Error("Invalid or expired token");
    }
    return {
      userID: row.operator_id,
      workspaceID: row.workspace_id,
      tier: row.tier
    };
  }
);
var gateway = new Gateway({
  authHandler: auth
});

// analytics/api.ts
import { api } from "encore.dev/api";
var recordUsage = api(
  { expose: true, method: "POST", path: "/api/analytics/usage" },
  async () => {
    return { recorded: true };
  }
);

// content/api.ts
import { api as api2 } from "encore.dev/api";
var getContentDashboard = api2(
  { expose: true, method: "GET", path: "/api/content/dashboard" },
  async () => {
    return { ideas: [], campaigns: [] };
  }
);
var generateCampaign = api2(
  { expose: true, method: "POST", path: "/api/content/generate" },
  async () => {
    return { success: true };
  }
);

// hello/hello.ts
import { api as api3 } from "encore.dev/api";
var ping = api3(
  { expose: true, method: "GET", path: "/hello" },
  async () => {
    return { message: "Hello World!" };
  }
);

// hospitality/api.ts
import { api as api4 } from "encore.dev/api";

// hospitality/db.ts
import { SQLDatabase as SQLDatabase2 } from "encore.dev/storage/sqldb";
var hospitalityDB = new SQLDatabase2("hospitality", {
  migrations: "./migrations"
});

// hospitality/api.ts
var getAuthData = () => ({ userID: "test-user", workspaceID: "test-workspace" });
var getHospitalityDashboard = api4(
  { expose: true, method: "GET", path: "/api/hospitality/dashboard", auth: true },
  async () => {
    const { workspaceID } = getAuthData();
    const propRow = await hospitalityDB.queryRow`SELECT count(id) as c FROM property WHERE workspace_id = ${workspaceID}`;
    const propCount = Number(propRow?.c) || 0;
    if (propCount === 0) {
      return { stats: { enquiries: 0, rating: 0, occupancy: 0 }, activityFeed: [] };
    }
    const resRow = await hospitalityDB.queryRow`
      SELECT count(r.id) as c 
      FROM reservation r
      JOIN unit u ON u.id = r.unit_id
      JOIN property p ON p.id = u.property_id
      WHERE p.workspace_id = ${workspaceID} AND r.status = 'pending'
    `;
    const pendingReservations = Number(resRow?.c) || 0;
    const alertRows = await hospitalityDB.query`
      SELECT a.message, a.severity, a.created_at
      FROM staff_alert a
      JOIN property p ON p.id = a.property_id
      WHERE p.workspace_id = ${workspaceID}
      ORDER BY a.created_at DESC
      LIMIT 5
    `;
    const activityFeed = [];
    for await (const row of alertRows) {
      activityFeed.push({
        type: "alert",
        title: row.severity === "high" ? "Urgent Alert" : "Operational Notice",
        desc: row.message,
        time: row.created_at
      });
    }
    return {
      stats: { enquiries: pendingReservations, rating: 5, occupancy: 85 },
      activityFeed
    };
  }
);
var getMyListings = api4(
  { expose: true, method: "GET", path: "/api/hospitality/listings", auth: true },
  async () => {
    const { workspaceID } = getAuthData();
    const rows = await hospitalityDB.query`
      SELECT 
        id, title, location, price, type, 
        amenities, guests, bedrooms, bathrooms, description,
        COALESCE(image, '') as image,
        COALESCE(video_url, '') as video_url,
        approval_status,
        rejection_reason,
        created_at
      FROM property
      WHERE workspace_id = ${workspaceID}
    `;
    const listings = [];
    for await (const row of rows) {
      listings.push(row);
    }
    return { listings };
  }
);
var deleteListing = api4(
  { expose: true, method: "DELETE", path: "/api/hospitality/listings/:id", auth: true },
  async ({ id }) => {
    const { workspaceID } = getAuthData();
    await hospitalityDB.exec`DELETE FROM unit WHERE property_id = ${id}`;
    await hospitalityDB.exec`DELETE FROM property WHERE id = ${id} AND workspace_id = ${workspaceID}`;
    return { success: true };
  }
);
var getListing = api4(
  { expose: true, method: "GET", path: "/api/hospitality/listings/:id", auth: true },
  async ({ id }) => {
    const { workspaceID } = getAuthData();
    const row = await hospitalityDB.queryRow`
      SELECT * FROM property WHERE id = ${id} AND workspace_id = ${workspaceID}
    `;
    if (!row)
      throw new Error("not found");
    return { listing: row };
  }
);
var saveListing = api4(
  { expose: true, method: "POST", path: "/api/hospitality/listings", auth: true },
  async (req) => {
    const { workspaceID } = getAuthData();
    if (req.id) {
      await hospitalityDB.exec`
        UPDATE property SET 
          title = ${req.title},
          description = ${req.description},
          location = ${req.location},
          area = ${req.area},
          province = ${req.province},
          price = ${req.price},
          discount = ${req.discount},
          type = ${req.type},
          amenities = ${req.amenities},
          facilities = ${req.facilities},
          other_facility = ${req.other_facility},
          guests = ${req.guests},
          adults = ${req.adults},
          children = ${req.children},
          bedrooms = ${req.bedrooms},
          bathrooms = ${req.bathrooms},
          is_self_catering = ${req.is_self_catering},
          has_restaurant = ${req.has_restaurant},
          restaurant_offers = ${req.restaurant_offers},
          image = ${req.image},
          images = ${req.images},
          video_url = ${req.video_url},
          is_occupied = ${req.is_occupied},
          latitude = ${req.latitude},
          longitude = ${req.longitude},
          approval_status = 'pending'
        WHERE id = ${req.id} AND workspace_id = ${workspaceID}
      `;
      return { id: req.id, status: "updated" };
    } else {
      const row = await hospitalityDB.queryRow`
        INSERT INTO property (
          id, workspace_id, title, description, location, area, province, price, discount, type, 
          amenities, facilities, other_facility, guests, adults, children, bedrooms, bathrooms,
          is_self_catering, has_restaurant, restaurant_offers, image, images, video_url, 
          is_occupied, latitude, longitude, approval_status
        ) VALUES (
          gen_random_uuid(), ${workspaceID}, ${req.title}, ${req.description}, ${req.location}, 
          ${req.area}, ${req.province}, ${req.price}, ${req.discount}, ${req.type}, 
          ${req.amenities}, ${req.facilities}, ${req.other_facility}, ${req.guests}, ${req.adults}, 
          ${req.children}, ${req.bedrooms}, ${req.bathrooms}, ${req.is_self_catering}, 
          ${req.has_restaurant}, ${req.restaurant_offers}, ${req.image}, ${req.images}, 
          ${req.video_url}, ${req.is_occupied}, ${req.latitude}, ${req.longitude}, 'pending'
        ) RETURNING id
      `;
      if (row?.id) {
        await hospitalityDB.exec`
          INSERT INTO unit (id, property_id, name, status, created_at)
          VALUES (gen_random_uuid(), ${row.id}, 'Main Unit', 'available', NOW())
          ON CONFLICT DO NOTHING
        `;
      }
      return { id: row?.id, status: "created" };
    }
  }
);
var getHostBookings = api4(
  { expose: true, method: "GET", path: "/api/hospitality/bookings", auth: true },
  async () => {
    const { workspaceID } = getAuthData();
    const rows = await hospitalityDB.query`
      SELECT 
        r.id, r.check_in, r.check_out, r.status, r.guest_name, r.created_at,
        u.id as unit_id, p.id as property_id, p.title as property_title, p.price
      FROM reservation r
      JOIN unit u ON u.id = r.unit_id
      JOIN property p ON p.id = u.property_id
      WHERE p.workspace_id = ${workspaceID}
      ORDER BY r.created_at DESC
    `;
    const bookings = [];
    for await (const row of rows) {
      bookings.push({
        id: row.id,
        check_in: row.check_in,
        check_out: row.check_out,
        status: row.status,
        total_price: Number(row.price) * 1,
        // Simple calculation for now
        user: {
          full_name: row.guest_name,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.guest_name}`
        },
        property_id: row.property_id,
        property: {
          id: row.property_id,
          title: row.property_title,
          image: ""
        },
        created_at: row.created_at
      });
    }
    return { bookings };
  }
);
var updateBookingStatus = api4(
  { expose: true, method: "POST", path: "/api/hospitality/bookings/:id/status", auth: true },
  async ({ id, status }) => {
    const { workspaceID } = getAuthData();
    const row = await hospitalityDB.queryRow`
      SELECT r.id 
      FROM reservation r
      JOIN unit u ON u.id = r.unit_id
      JOIN property p ON p.id = u.property_id
      WHERE r.id = ${id} AND p.workspace_id = ${workspaceID}
    `;
    if (!row)
      throw new Error("unauthorized or not found");
    await hospitalityDB.exec`
      UPDATE reservation SET status = ${status} WHERE id = ${id}
    `;
    return { success: true };
  }
);
var blockDates = api4(
  { expose: true, method: "POST", path: "/api/hospitality/bookings/block", auth: true },
  async ({ propertyId, checkIn, checkOut }) => {
    const { workspaceID } = getAuthData();
    const unit = await hospitalityDB.queryRow`
      SELECT u.id FROM unit u
      JOIN property p ON p.id = u.property_id
      WHERE p.id = ${propertyId} AND p.workspace_id = ${workspaceID}
      LIMIT 1
    `;
    if (!unit)
      throw new Error("unit not found");
    await hospitalityDB.exec`
      INSERT INTO reservation (id, unit_id, guest_name, check_in, check_out, status)
      VALUES (gen_random_uuid(), ${unit.id}, 'Host Block', ${checkIn}, ${checkOut}, 'blocked')
    `;
    return { success: true };
  }
);
var submitVerification = api4(
  { expose: true, method: "POST", path: "/api/hospitality/verification", auth: true },
  async (req) => {
    const { userID } = getAuthData();
    const existing = await hospitalityDB.queryRow`SELECT user_id FROM host_verification WHERE user_id = ${userID}`;
    if (existing) {
      await hospitalityDB.exec`
        UPDATE host_verification SET
          full_name = ${req.fullName},
          phone = ${req.phone},
          bio = ${req.bio},
          business_address = ${req.businessAddress},
          id_front = ${req.documents.id_front},
          id_back = ${req.documents.id_back},
          selfie = ${req.documents.selfie},
          status = 'pending',
          updated_at = NOW()
        WHERE user_id = ${userID}
      `;
    } else {
      await hospitalityDB.exec`
        INSERT INTO host_verification (
          user_id, full_name, phone, bio, business_address, 
          id_front, id_back, selfie, status
        ) VALUES (
          ${userID}, ${req.fullName}, ${req.phone}, ${req.bio}, ${req.businessAddress},
          ${req.documents.id_front}, ${req.documents.id_back}, ${req.documents.selfie}, 'pending'
        )
      `;
    }
    return { success: true };
  }
);
var getVerificationStatus = api4(
  { expose: true, method: "GET", path: "/api/hospitality/verification/status", auth: true },
  async () => {
    const { userID } = getAuthData();
    const row = await hospitalityDB.queryRow`
      SELECT * FROM host_verification WHERE user_id = ${userID}
    `;
    if (!row) {
      return {
        status: "none",
        fullName: "",
        phone: "",
        bio: "",
        businessAddress: "",
        docs: null
      };
    }
    return {
      status: row.status,
      fullName: row.full_name,
      phone: row.phone,
      bio: row.bio,
      businessAddress: row.business_address,
      docs: {
        id_front: row.id_front,
        id_back: row.id_back,
        selfie: row.selfie
      }
    };
  }
);

// marketplace/api.ts
import { api as api5 } from "encore.dev/api";
var getAuthData2 = () => ({ userID: "test-user" });
var getMarketplaceFeed = api5(
  { expose: true, method: "GET", path: "/api/marketplace", auth: false },
  async () => {
    const rows = await hospitalityDB.query`
      SELECT 
        p.id, p.title, p.location, p.price, p.type, 
        p.amenities, p.guests, p.bedrooms, p.bathrooms, p.description,
        COALESCE(p.image, '') as image,
        COALESCE(p.images, '{}') as images,
        COALESCE(p.video_url, '') as video_url,
        'approved' as approval_status,
        -- Mocking host data logically until platform cross-read is optimized
        'Unknown Host' as host_name 
      FROM property p
    `;
    const mapped = [];
    for await (const row of rows) {
      mapped.push(row);
    }
    return { listings: mapped };
  }
);
var concierge = api5(
  { expose: true, method: "POST", path: "/api/marketplace/concierge", auth: false },
  async () => {
    return { recommendations: [] };
  }
);
var getProperty = api5(
  { expose: true, method: "GET", path: "/api/marketplace/properties/:id", auth: false },
  async ({ id }) => {
    const row = await hospitalityDB.queryRow`
      SELECT 
        p.*,
        'approved' as approval_status,
        'Unknown Host' as host_name 
      FROM property p
      WHERE p.id = ${id}
    `;
    if (!row)
      throw new Error("not found");
    return { property: row };
  }
);
var checkWishlist = api5(
  { expose: true, method: "GET", path: "/api/marketplace/wishlists/:propertyId", auth: true },
  async ({ propertyId }) => {
    const { userID } = getAuthData2();
    const row = await hospitalityDB.queryRow`
      SELECT 1 FROM wishlist WHERE user_id = ${userID} AND property_id = ${propertyId}
    `;
    return { saved: !!row };
  }
);
var toggleWishlist = api5(
  { expose: true, method: "POST", path: "/api/marketplace/wishlists", auth: true },
  async ({ propertyId, saved }) => {
    const { userID } = getAuthData2();
    if (saved) {
      await hospitalityDB.exec`
        INSERT INTO wishlist (user_id, property_id) 
        VALUES (${userID}, ${propertyId})
        ON CONFLICT (user_id, property_id) DO NOTHING
      `;
    } else {
      await hospitalityDB.exec`
        DELETE FROM wishlist 
        WHERE user_id = ${userID} AND property_id = ${propertyId}
      `;
    }
    return { success: true };
  }
);
var getPropertyBookedDates = api5(
  { expose: true, method: "GET", path: "/api/marketplace/properties/:propertyId/booked-dates", auth: false },
  async ({ propertyId }) => {
    const rows = await hospitalityDB.query`
      SELECT r.check_in, r.check_out 
      FROM reservation r
      JOIN unit u ON u.id = r.unit_id
      WHERE u.property_id = ${propertyId} AND r.status IN ('confirmed', 'blocked')
    `;
    const dates = [];
    for await (const row of rows) {
      dates.push(row);
    }
    return { dates };
  }
);
var getPropertyReviews = api5(
  { expose: true, method: "GET", path: "/api/marketplace/properties/:propertyId/reviews", auth: false },
  async ({ propertyId }) => {
    return {
      reviews: [{
        id: "1",
        rating: 5,
        content: "A truly luxurious stay. The amenities were top notch and the host was very professional. Highly recommended!",
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        photo_url: null,
        user: {
          full_name: "Verified Platinum Guest",
          avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Guest1"
        }
      }]
    };
  }
);
var submitReview = api5(
  { expose: true, method: "POST", path: "/api/marketplace/properties/:propertyId/reviews", auth: true },
  async (params) => {
    return { success: true };
  }
);
var searchDestinations = api5(
  { expose: true, method: "GET", path: "/api/marketplace/search", auth: false },
  async ({ query }) => {
    if (!query || query.trim().length === 0) {
      return { suggestions: [] };
    }
    const q = `%${query}%`;
    const rows = await hospitalityDB.query`
      SELECT DISTINCT 
        location as label, 
        'place' as type 
      FROM property 
      WHERE location ILIKE ${q}
      UNION
      SELECT DISTINCT 
        province as label, 
        'province' as type 
      FROM property 
      WHERE province ILIKE ${q}
      UNION
      SELECT 
        title as label, 
        'listing' as type 
      FROM property 
      WHERE title ILIKE ${q}
      LIMIT 10
    `;
    const suggestions = [];
    for await (const row of rows) {
      suggestions.push(row);
    }
    return { suggestions };
  }
);

// platform/api.ts
import { api as api6 } from "encore.dev/api";
import crypto from "crypto";

// platform/events.ts
import { Topic } from "encore.dev/pubsub";
var workspaceCreatedTopic = new Topic("workspace-created", {
  deliveryGuarantee: "at-least-once"
});

// platform/api.ts
var getAuthData3 = () => ({ userID: "test-user", workspaceID: "test-workspace", tier: "free" });
var getCatalog = api6(
  { expose: true, method: "GET", path: "/api/public/catalog", auth: false },
  async () => {
    return { items: [] };
  }
);
var demoLogin = api6(
  { expose: true, method: "POST", path: "/api/auth/demo/login", auth: false },
  async () => {
    const workspaceRow = await platformDB.queryRow`
      INSERT INTO workspace (name, tier) 
      VALUES ('Demo Lodge', 'free') 
      RETURNING id
    `;
    const workspaceId = workspaceRow?.id;
    const operatorRow = await platformDB.queryRow`
      INSERT INTO operator_user (workspace_id, email, full_name, password_hash)
      VALUES (${workspaceId}, 'demo-' || ${crypto.randomUUID()} || '@ideal.today', 'Demo User', 'no_hash_demo')
      RETURNING id
    `;
    const operatorId = operatorRow?.id;
    const token = crypto.randomBytes(32).toString("hex");
    await platformDB.exec`
      INSERT INTO session_token (token, operator_id, expires_at)
      VALUES (${token}, ${operatorId}, NOW() + INTERVAL '24 hours')
    `;
    await workspaceCreatedTopic.publish({ workspaceID: workspaceId, tier: "free" });
    return { token };
  }
);
var getPlatformMe = api6(
  { expose: true, method: "GET", path: "/api/platform/me", auth: true },
  async () => {
    const authData = getAuthData3();
    return {
      userID: authData.userID,
      workspaceID: authData.workspaceID,
      tier: authData.tier
    };
  }
);

// referrals/api.ts
import { api as api7 } from "encore.dev/api";
var getReferralsDashboard = api7(
  { expose: true, method: "GET", path: "/api/referrals/dashboard" },
  async () => {
    return { metrics: {} };
  }
);

// storage/api.ts
import { Bucket } from "encore.dev/storage/objects";
import { api as api8 } from "encore.dev/api";
var getAuthData4 = () => ({ userID: "test-user", workspaceID: "test-workspace" });
var publicAssets = new Bucket("public-assets", {
  public: true
});
var privateAssets = new Bucket("private-assets", {
  public: false
});
var getUploadUrl = api8(
  { expose: true, method: "POST", path: "/api/storage/upload-url", auth: true },
  async (req) => {
    const { userID } = getAuthData4();
    const fileExt = req.fileName.split(".").pop();
    const assetKey = `${userID}/${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    let url;
    if (req.isPrivate) {
      const res = await privateAssets.signedUploadUrl(assetKey, {
        ttl: 3600
      });
      url = res.url;
    } else {
      const res = await publicAssets.signedUploadUrl(assetKey, {
        ttl: 3600
      });
      url = res.url;
    }
    return { uploadUrl: url, assetKey };
  }
);
var getDownloadUrl = api8(
  { expose: true, method: "POST", path: "/api/storage/download-url", auth: true },
  async (req) => {
    const res = await privateAssets.signedDownloadUrl(req.assetKey);
    return { url: res.url };
  }
);
var getPublicUrl = api8(
  { expose: true, method: "GET", path: "/api/storage/public-url/:key", auth: false },
  async ({ key }) => {
    return { url: `/api/storage/public/${key}` };
  }
);

// content/seed.ts
import { Subscription } from "encore.dev/pubsub";

// content/db.ts
import { SQLDatabase as SQLDatabase3 } from "encore.dev/storage/sqldb";
var contentDB = new SQLDatabase3("content", {
  migrations: "./migrations"
});

// content/seed.ts
var seedContentData = new Subscription(
  workspaceCreatedTopic,
  "seed-content",
  {
    handler: async (event) => {
      await contentDB.exec`
        INSERT INTO brand_profile (workspace_id, voice, target_audience)
        VALUES (${event.workspaceID}, 'Warm and Inviting', 'Families and Couples')
      `;
    }
  }
);

// hospitality/seed.ts
import { Subscription as Subscription2 } from "encore.dev/pubsub";
var seedDemoHospitalityData = new Subscription2(
  workspaceCreatedTopic,
  "seed-hospitality",
  {
    handler: async (event) => {
      const propRow = await hospitalityDB.queryRow`
        INSERT INTO property (workspace_id, title, location, price, type, amenities, guests, bedrooms, bathrooms, description)
        VALUES (
          ${event.workspaceID}, 
          'The Pine Lodge', 
          'Yellowstone', 
          250, 
          'cabin', 
          '{"wifi", "hot-tub", "fire-pit"}', 
          4, 
          2, 
          1, 
          'Beautiful secluded cabin perfect for small families.'
        )
        RETURNING id
      `;
      await hospitalityDB.exec`
        INSERT INTO unit (property_id, name, status)
        VALUES (${propRow?.id}, 'Cabin A1', 'available')
      `;
    }
  }
);

// referrals/seed.ts
import { Subscription as Subscription3 } from "encore.dev/pubsub";

// referrals/db.ts
import { SQLDatabase as SQLDatabase4 } from "encore.dev/storage/sqldb";
var referralsDB = new SQLDatabase4("referrals", {
  migrations: "./migrations"
});

// referrals/seed.ts
var seedReferralData = new Subscription3(
  workspaceCreatedTopic,
  "seed-referrals",
  {
    handler: async (event) => {
      await referralsDB.exec`
        INSERT INTO referral_program (workspace_id, reward_points, is_active)
        VALUES (${event.workspaceID}, 500, true)
      `;
    }
  }
);

// encore.service.ts
import { Service } from "encore.dev/service";
var encore_service_default = new Service("app");

// encore.gen/internal/entrypoints/combined/main.ts
var gateways = [
  gateway
];
var handlers = [
  {
    apiRoute: {
      service: "app",
      name: "recordUsage",
      handler: recordUsage,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": false, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "app",
      name: "getContentDashboard",
      handler: getContentDashboard,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": false, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "app",
      name: "generateCampaign",
      handler: generateCampaign,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": false, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "app",
      name: "ping",
      handler: ping,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": false, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "app",
      name: "getHospitalityDashboard",
      handler: getHospitalityDashboard,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": true, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "app",
      name: "getMyListings",
      handler: getMyListings,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": true, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "app",
      name: "deleteListing",
      handler: deleteListing,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": true, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "app",
      name: "getListing",
      handler: getListing,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": true, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "app",
      name: "saveListing",
      handler: saveListing,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": true, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "app",
      name: "getHostBookings",
      handler: getHostBookings,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": true, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "app",
      name: "updateBookingStatus",
      handler: updateBookingStatus,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": true, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "app",
      name: "blockDates",
      handler: blockDates,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": true, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "app",
      name: "submitVerification",
      handler: submitVerification,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": true, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "app",
      name: "getVerificationStatus",
      handler: getVerificationStatus,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": true, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "app",
      name: "getMarketplaceFeed",
      handler: getMarketplaceFeed,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": false, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "app",
      name: "concierge",
      handler: concierge,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": false, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "app",
      name: "getProperty",
      handler: getProperty,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": false, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "app",
      name: "checkWishlist",
      handler: checkWishlist,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": true, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "app",
      name: "toggleWishlist",
      handler: toggleWishlist,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": true, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "app",
      name: "getPropertyBookedDates",
      handler: getPropertyBookedDates,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": false, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "app",
      name: "getPropertyReviews",
      handler: getPropertyReviews,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": false, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "app",
      name: "submitReview",
      handler: submitReview,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": true, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "app",
      name: "searchDestinations",
      handler: searchDestinations,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": false, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "app",
      name: "getCatalog",
      handler: getCatalog,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": false, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "app",
      name: "demoLogin",
      handler: demoLogin,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": false, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "app",
      name: "getPlatformMe",
      handler: getPlatformMe,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": true, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "app",
      name: "getReferralsDashboard",
      handler: getReferralsDashboard,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": false, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "app",
      name: "getUploadUrl",
      handler: getUploadUrl,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": true, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "app",
      name: "getDownloadUrl",
      handler: getDownloadUrl,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": true, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "app",
      name: "getPublicUrl",
      handler: getPublicUrl,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": false, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default.cfg.middlewares || []
  }
];
registerGateways(gateways);
registerHandlers(handlers);
await run(import.meta.url);
//# sourceMappingURL=main.mjs.map
