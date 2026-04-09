import pool from "../db.js";

// =====================================================
// OFFICE LOCATION CRUD OPERATIONS
// =====================================================

// Create office location
export const createOfficeLocation = async (req, res) => {
  try {
    const {
      name,
      address,
      city,
      state,
      country,
      postal_code,
      latitude,
      longitude,
      radius_meters,
      timezone,
      is_primary,
    } = req.body;

    if (!name || !latitude || !longitude) {
      return res.status(400).json({
        error: "Name, latitude, and longitude are required",
      });
    }

    // If setting as primary, unset other primary locations
    if (is_primary) {
      await pool.query(
        `UPDATE office_locations SET is_primary = false WHERE is_primary = true`
      );
    }

    const result = await pool.query(
      `INSERT INTO office_locations 
       (name, address, city, state, country, postal_code, latitude, longitude, radius_meters, timezone, is_primary)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        name,
        address || null,
        city || null,
        state || null,
        country || "India",
        postal_code || null,
        latitude,
        longitude,
        radius_meters || 100,
        timezone || "Asia/Kolkata",
        is_primary || false,
      ]
    );

    res.status(201).json({
      message: "Office location created successfully",
      location: result.rows[0],
    });
  } catch (error) {
    console.error("Create office location error:", error);
    res.status(500).json({ error: "Failed to create office location" });
  }
};

// Get all office locations
export const getAllOfficeLocations = async (req, res) => {
  try {
    const { include_inactive } = req.query;

    let query = `SELECT * FROM office_locations`;
    if (!include_inactive) {
      query += ` WHERE is_active = true`;
    }
    query += ` ORDER BY is_primary DESC, name`;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Get office locations error:", error);
    res.status(500).json({ error: "Failed to fetch office locations" });
  }
};

// Get office location by ID
export const getOfficeLocationById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM office_locations WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Office location not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get office location error:", error);
    res.status(500).json({ error: "Failed to fetch office location" });
  }
};

// Update office location
export const updateOfficeLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      address,
      city,
      state,
      country,
      postal_code,
      latitude,
      longitude,
      radius_meters,
      timezone,
      is_active,
      is_primary,
    } = req.body;

    // If setting as primary, unset other primary locations
    if (is_primary) {
      await pool.query(
        `UPDATE office_locations SET is_primary = false WHERE is_primary = true AND id != $1`,
        [id]
      );
    }

    const result = await pool.query(
      `UPDATE office_locations 
       SET name = COALESCE($1, name),
           address = COALESCE($2, address),
           city = COALESCE($3, city),
           state = COALESCE($4, state),
           country = COALESCE($5, country),
           postal_code = COALESCE($6, postal_code),
           latitude = COALESCE($7, latitude),
           longitude = COALESCE($8, longitude),
           radius_meters = COALESCE($9, radius_meters),
           timezone = COALESCE($10, timezone),
           is_active = COALESCE($11, is_active),
           is_primary = COALESCE($12, is_primary),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $13
       RETURNING *`,
      [
        name,
        address,
        city,
        state,
        country,
        postal_code,
        latitude,
        longitude,
        radius_meters,
        timezone,
        is_active,
        is_primary,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Office location not found" });
    }

    res.json({
      message: "Office location updated successfully",
      location: result.rows[0],
    });
  } catch (error) {
    console.error("Update office location error:", error);
    res.status(500).json({ error: "Failed to update office location" });
  }
};

// Delete office location (soft delete)
export const deleteOfficeLocation = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE office_locations 
       SET is_active = false, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Office location not found" });
    }

    res.json({ message: "Office location deleted successfully" });
  } catch (error) {
    console.error("Delete office location error:", error);
    res.status(500).json({ error: "Failed to delete office location" });
  }
};

// =====================================================
// GEOFENCE VALIDATION
// =====================================================

// Check if coordinates are within any geofence
export const checkGeofence = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        error: "Latitude and longitude are required",
      });
    }

    const result = await pool.query(
      `SELECT * FROM is_within_any_geofence($1, $2)`,
      [latitude, longitude]
    );

    const nearestOffice = result.rows[0];
    const isWithinAnyGeofence = result.rows.some((r) => r.is_within);

    res.json({
      is_within_geofence: isWithinAnyGeofence,
      nearest_office: nearestOffice
        ? {
            id: nearestOffice.office_id,
            name: nearestOffice.office_name,
            distance_meters: Math.round(nearestOffice.distance_meters),
            is_within: nearestOffice.is_within,
          }
        : null,
      all_offices: result.rows.map((r) => ({
        id: r.office_id,
        name: r.office_name,
        distance_meters: Math.round(r.distance_meters),
        is_within: r.is_within,
      })),
    });
  } catch (error) {
    console.error("Check geofence error:", error);
    res.status(500).json({ error: "Failed to check geofence" });
  }
};

// =====================================================
// REMOTE WORK LOCATIONS
// =====================================================

// Create remote work location request
export const createRemoteLocation = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { name, address, latitude, longitude, radius_meters, valid_from, valid_until } =
      req.body;

    if (!name) {
      return res.status(400).json({ error: "Location name is required" });
    }

    const result = await pool.query(
      `INSERT INTO remote_work_locations 
       (user_id, name, address, latitude, longitude, radius_meters, valid_from, valid_until)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        user_id,
        name,
        address || null,
        latitude || null,
        longitude || null,
        radius_meters || 50,
        valid_from || null,
        valid_until || null,
      ]
    );

    res.status(201).json({
      message: "Remote work location request submitted",
      location: result.rows[0],
    });
  } catch (error) {
    console.error("Create remote location error:", error);
    res.status(500).json({ error: "Failed to create remote work location" });
  }
};

// Get user's remote work locations
export const getMyRemoteLocations = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const result = await pool.query(
      `SELECT rwl.*, 
              e.first_name as approved_by_first_name,
              e.last_name as approved_by_last_name
       FROM remote_work_locations rwl
       LEFT JOIN employees e ON rwl.approved_by = e.user_id
       WHERE rwl.user_id = $1 AND rwl.is_active = true
       ORDER BY rwl.created_at DESC`,
      [user_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get remote locations error:", error);
    res.status(500).json({ error: "Failed to fetch remote work locations" });
  }
};

// Get pending remote location requests (for managers/admins)
export const getPendingRemoteRequests = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT rwl.*, 
              e.first_name, e.last_name, u.email
       FROM remote_work_locations rwl
       JOIN users u ON rwl.user_id = u.user_id
       LEFT JOIN employees e ON rwl.user_id = e.user_id
       WHERE rwl.is_approved = false AND rwl.is_active = true
       ORDER BY rwl.created_at ASC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get pending requests error:", error);
    res.status(500).json({ error: "Failed to fetch pending requests" });
  }
};

// Approve remote work location
export const approveRemoteLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const approved_by = req.user.user_id;

    const result = await pool.query(
      `UPDATE remote_work_locations 
       SET is_approved = true, 
           approved_by = $1, 
           approved_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [approved_by, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Remote location not found" });
    }

    res.json({
      message: "Remote work location approved",
      location: result.rows[0],
    });
  } catch (error) {
    console.error("Approve remote location error:", error);
    res.status(500).json({ error: "Failed to approve remote work location" });
  }
};

// Reject remote work location
export const rejectRemoteLocation = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE remote_work_locations 
       SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Remote location not found" });
    }

    res.json({ message: "Remote work location request rejected" });
  } catch (error) {
    console.error("Reject remote location error:", error);
    res.status(500).json({ error: "Failed to reject remote work location" });
  }
};

// =====================================================
// GEOLOCATION SETTINGS
// =====================================================

// Get geolocation settings (global or user-specific)
export const getGeolocationSettings = async (req, res) => {
  try {
    const user_id = req.user?.user_id;

    // Try user-specific settings first, fall back to global
    const result = await pool.query(
      `SELECT * FROM geolocation_settings 
       WHERE user_id = $1 OR user_id IS NULL
       ORDER BY user_id NULLS LAST
       LIMIT 1`,
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.json({
        require_geolocation: true,
        allow_remote_work: false,
        max_distance_meters: 200,
        require_photo_verification: false,
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get geolocation settings error:", error);
    res.status(500).json({ error: "Failed to fetch geolocation settings" });
  }
};

// Update geolocation settings (admin only)
export const updateGeolocationSettings = async (req, res) => {
  try {
    const {
      user_id,
      require_geolocation,
      allow_remote_work,
      max_distance_meters,
      require_photo_verification,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO geolocation_settings 
       (user_id, require_geolocation, allow_remote_work, max_distance_meters, require_photo_verification)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         require_geolocation = COALESCE($2, geolocation_settings.require_geolocation),
         allow_remote_work = COALESCE($3, geolocation_settings.allow_remote_work),
         max_distance_meters = COALESCE($4, geolocation_settings.max_distance_meters),
         require_photo_verification = COALESCE($5, geolocation_settings.require_photo_verification),
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        user_id || null,
        require_geolocation,
        allow_remote_work,
        max_distance_meters,
        require_photo_verification,
      ]
    );

    res.json({
      message: "Geolocation settings updated",
      settings: result.rows[0],
    });
  } catch (error) {
    console.error("Update geolocation settings error:", error);
    res.status(500).json({ error: "Failed to update geolocation settings" });
  }
};
