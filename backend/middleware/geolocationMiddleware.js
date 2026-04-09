import pool from "../db.js";

// =====================================================
// GEOLOCATION MIDDLEWARE
// Validates GPS coordinates for attendance operations
// =====================================================

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in meters
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Validate geolocation for attendance operations
 * Middleware that checks if user is within approved locations
 */
export const validateGeolocation = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const { latitude, longitude, accuracy } = req.body;

    // Check if geolocation is required for this user
    const settingsResult = await pool.query(
      `SELECT * FROM geolocation_settings 
       WHERE user_id = $1 OR user_id IS NULL
       ORDER BY user_id NULLS LAST
       LIMIT 1`,
      [userId]
    );

    const settings = settingsResult.rows[0] || {
      require_geolocation: true,
      allow_remote_work: false,
      max_distance_meters: 200,
    };

    // Skip validation if not required
    if (!settings.require_geolocation) {
      req.geolocationResult = {
        isValid: true,
        workLocationType: "unknown",
        validationSkipped: true,
      };
      return next();
    }

    // Require GPS coordinates if geolocation is enabled
    if (!latitude || !longitude) {
      return res.status(400).json({
        error: "GPS coordinates are required for attendance",
        code: "GEOLOCATION_REQUIRED",
      });
    }

    // Validate GPS accuracy (if provided)
    if (accuracy && accuracy > 100) {
      return res.status(400).json({
        error: "GPS accuracy is too poor (>100m). Please wait for better signal.",
        code: "GPS_ACCURACY_POOR",
      });
    }

    // Check office locations
    const officeResult = await pool.query(
      `SELECT id, name, latitude, longitude, radius_meters 
       FROM office_locations 
       WHERE is_active = true`
    );

    let nearestOffice = null;
    let minDistance = Infinity;
    let isWithinOfficeGeofence = false;
    let matchedOffice = null;

    for (const office of officeResult.rows) {
      const distance = calculateDistance(
        latitude,
        longitude,
        parseFloat(office.latitude),
        parseFloat(office.longitude)
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestOffice = {
          id: office.id,
          name: office.name,
          distance: Math.round(distance),
          radius: office.radius_meters,
        };
      }

      if (distance <= office.radius_meters) {
        isWithinOfficeGeofence = true;
        matchedOffice = office;
        break;
      }
    }

    // Check remote work locations if not in office
    let isWithinRemoteLocation = false;
    let matchedRemoteLocation = null;

    if (!isWithinOfficeGeofence && settings.allow_remote_work) {
      const remoteResult = await pool.query(
        `SELECT id, name, latitude, longitude, radius_meters 
         FROM remote_work_locations 
         WHERE user_id = $1 
           AND is_active = true 
           AND is_approved = true
           AND (valid_from IS NULL OR valid_from <= CURRENT_DATE)
           AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
           AND latitude IS NOT NULL 
           AND longitude IS NOT NULL`,
        [userId]
      );

      for (const remote of remoteResult.rows) {
        const distance = calculateDistance(
          latitude,
          longitude,
          parseFloat(remote.latitude),
          parseFloat(remote.longitude)
        );

        if (distance <= remote.radius_meters) {
          isWithinRemoteLocation = true;
          matchedRemoteLocation = remote;
          break;
        }
      }
    }

    // Determine work location type
    let workLocationType = "unknown";
    let isValid = false;

    if (isWithinOfficeGeofence) {
      workLocationType = "office";
      isValid = true;
    } else if (isWithinRemoteLocation && settings.allow_remote_work) {
      workLocationType = "remote";
      isValid = true;
    } else if (minDistance <= settings.max_distance_meters) {
      workLocationType = "field";
      isValid = true; // Allow field work within max distance
    }

    // Prepare geolocation result
    req.geolocationResult = {
      isValid,
      workLocationType,
      isWithinOfficeGeofence,
      isWithinRemoteLocation,
      latitude,
      longitude,
      accuracy,
      nearestOffice,
      matchedOffice: matchedOffice ? { id: matchedOffice.id, name: matchedOffice.name } : null,
      matchedRemoteLocation: matchedRemoteLocation ? { id: matchedRemoteLocation.id, name: matchedRemoteLocation.name } : null,
      settings: {
        requireGeolocation: settings.require_geolocation,
        allowRemoteWork: settings.allow_remote_work,
        maxDistanceMeters: settings.max_distance_meters,
      },
    };

    // Block attendance if location is not valid
    if (!isValid) {
      let errorMessage = "You are not within an approved work location.";
      
      if (nearestOffice) {
        errorMessage += ` Nearest office: ${nearestOffice.name} (${nearestOffice.distance}m away)`;
      }

      if (!settings.allow_remote_work) {
        errorMessage += " Remote work is not enabled for your account.";
      }

      return res.status(403).json({
        error: errorMessage,
        code: "LOCATION_NOT_APPROVED",
        details: {
          nearestOffice,
          distanceToOffice: nearestOffice?.distance,
          allowRemoteWork: settings.allow_remote_work,
          maxAllowedDistance: settings.max_distance_meters,
        },
      });
    }

    next();
  } catch (error) {
    console.error("Geolocation validation error:", error);
    res.status(500).json({
      error: "Failed to validate location",
      code: "GEOLOCATION_VALIDATION_ERROR",
    });
  }
};

/**
 * Record attendance location in database
 */
export const recordAttendanceLocation = async (attendanceId, locationType, geolocationResult) => {
  if (!geolocationResult || geolocationResult.validationSkipped) {
    return null;
  }

  const result = await pool.query(
    `INSERT INTO attendance_locations 
     (attendance_id, location_type, latitude, longitude, accuracy, 
      office_location_id, is_within_geofence, distance_from_office, captured_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
     RETURNING *`,
    [
      attendanceId,
      locationType,
      geolocationResult.latitude,
      geolocationResult.longitude,
      geolocationResult.accuracy || null,
      geolocationResult.matchedOffice?.id || null,
      geolocationResult.isWithinOfficeGeofence,
      geolocationResult.nearestOffice?.distance || null,
    ]
  );

  return result.rows[0];
};

/**
 * Optional middleware - validate but don't block
 * Useful for endpoints that want location info but don't require it
 */
export const captureGeolocation = async (req, res, next) => {
  try {
    const { latitude, longitude, accuracy } = req.body;

    if (latitude && longitude) {
      req.geolocationResult = {
        latitude,
        longitude,
        accuracy,
        captured: true,
      };
    } else {
      req.geolocationResult = {
        captured: false,
      };
    }

    next();
  } catch (error) {
    console.error("Geolocation capture error:", error);
    req.geolocationResult = { captured: false };
    next();
  }
};