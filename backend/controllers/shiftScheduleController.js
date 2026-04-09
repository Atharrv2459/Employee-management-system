import pool from "../db.js";

// =====================================================
// SHIFT TEMPLATES
// =====================================================

// Create shift template
export const createShiftTemplate = async (req, res) => {
  try {
    const {
      name, code, description, start_time, end_time,
      break_duration_minutes, shift_type, color,
      min_hours, max_hours, is_overnight, department_id
    } = req.body;

    if (!name || !start_time || !end_time) {
      return res.status(400).json({ error: "Name, start time, and end time are required" });
    }

    const result = await pool.query(
      `INSERT INTO shift_templates 
       (name, code, description, start_time, end_time, break_duration_minutes, 
        shift_type, color, min_hours, max_hours, is_overnight, department_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [name, code || null, description, start_time, end_time,
       break_duration_minutes || 60, shift_type || 'regular', color || '#3B82F6',
       min_hours || 8, max_hours || 12, is_overnight || false, department_id || null]
    );

    res.status(201).json({ message: "Shift template created", template: result.rows[0] });
  } catch (error) {
    console.error("Create shift template error:", error);
    if (error.code === '23505') {
      return res.status(400).json({ error: "Shift code already exists" });
    }
    res.status(500).json({ error: "Failed to create shift template" });
  }
};

// Get all shift templates
export const getAllShiftTemplates = async (req, res) => {
  try {
    const { department_id, include_inactive } = req.query;
    
    let query = `SELECT st.*, d.name as department_name 
                 FROM shift_templates st
                 LEFT JOIN departments d ON st.department_id = d.id
                 WHERE 1=1`;
    const params = [];
    
    if (!include_inactive) {
      query += ` AND st.is_active = true`;
    }
    if (department_id) {
      params.push(department_id);
      query += ` AND (st.department_id = $${params.length} OR st.department_id IS NULL)`;
    }
    
    query += ` ORDER BY st.start_time`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get shift templates error:", error);
    res.status(500).json({ error: "Failed to fetch shift templates" });
  }
};

// Update shift template
export const updateShiftTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, code, description, start_time, end_time,
      break_duration_minutes, shift_type, color,
      min_hours, max_hours, is_overnight, department_id, is_active
    } = req.body;

    const result = await pool.query(
      `UPDATE shift_templates SET
        name = COALESCE($1, name),
        code = COALESCE($2, code),
        description = COALESCE($3, description),
        start_time = COALESCE($4, start_time),
        end_time = COALESCE($5, end_time),
        break_duration_minutes = COALESCE($6, break_duration_minutes),
        shift_type = COALESCE($7, shift_type),
        color = COALESCE($8, color),
        min_hours = COALESCE($9, min_hours),
        max_hours = COALESCE($10, max_hours),
        is_overnight = COALESCE($11, is_overnight),
        department_id = $12,
        is_active = COALESCE($13, is_active),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $14 RETURNING *`,
      [name, code, description, start_time, end_time,
       break_duration_minutes, shift_type, color,
       min_hours, max_hours, is_overnight, department_id, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Shift template not found" });
    }

    res.json({ message: "Shift template updated", template: result.rows[0] });
  } catch (error) {
    console.error("Update shift template error:", error);
    res.status(500).json({ error: "Failed to update shift template" });
  }
};

// Delete shift template (soft delete)
export const deleteShiftTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `UPDATE shift_templates SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Shift template not found" });
    }

    res.json({ message: "Shift template deleted" });
  } catch (error) {
    console.error("Delete shift template error:", error);
    res.status(500).json({ error: "Failed to delete shift template" });
  }
};

// =====================================================
// SHIFT PREFERENCES
// =====================================================

// Get my preferences
export const getMyPreferences = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    
    const result = await pool.query(
      `SELECT sp.*, 
              array_agg(DISTINCT st.name) FILTER (WHERE st.id IS NOT NULL) as preferred_shift_names
       FROM shift_preferences sp
       LEFT JOIN shift_templates st ON st.id = ANY(sp.preferred_shift_ids)
       WHERE sp.user_id = $1
       GROUP BY sp.id`,
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.json(null);
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get preferences error:", error);
    res.status(500).json({ error: "Failed to fetch preferences" });
  }
};

// Save/update preferences
export const savePreferences = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const {
      preferred_shift_ids, preferred_days, unavailable_days,
      max_hours_per_week, max_hours_per_day, min_hours_per_week,
      prefer_consecutive_days, notes, effective_from, effective_until
    } = req.body;

    const result = await pool.query(
      `INSERT INTO shift_preferences 
       (user_id, preferred_shift_ids, preferred_days, unavailable_days,
        max_hours_per_week, max_hours_per_day, min_hours_per_week,
        prefer_consecutive_days, notes, effective_from, effective_until)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (user_id) DO UPDATE SET
        preferred_shift_ids = COALESCE($2, shift_preferences.preferred_shift_ids),
        preferred_days = COALESCE($3, shift_preferences.preferred_days),
        unavailable_days = COALESCE($4, shift_preferences.unavailable_days),
        max_hours_per_week = COALESCE($5, shift_preferences.max_hours_per_week),
        max_hours_per_day = COALESCE($6, shift_preferences.max_hours_per_day),
        min_hours_per_week = COALESCE($7, shift_preferences.min_hours_per_week),
        prefer_consecutive_days = COALESCE($8, shift_preferences.prefer_consecutive_days),
        notes = COALESCE($9, shift_preferences.notes),
        effective_from = $10,
        effective_until = $11,
        updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [user_id, preferred_shift_ids, preferred_days, unavailable_days,
       max_hours_per_week || 40, max_hours_per_day || 10, min_hours_per_week || 20,
       prefer_consecutive_days !== false, notes, effective_from, effective_until]
    );

    res.json({ message: "Preferences saved", preferences: result.rows[0] });
  } catch (error) {
    console.error("Save preferences error:", error);
    res.status(500).json({ error: "Failed to save preferences" });
  }
};

// Add unavailable date
export const addUnavailableDate = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { date, reason, is_recurring } = req.body;

    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }

    const result = await pool.query(
      `INSERT INTO unavailable_dates (user_id, date, reason, is_recurring)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, date) DO UPDATE SET reason = $3, is_recurring = $4
       RETURNING *`,
      [user_id, date, reason, is_recurring || false]
    );

    res.status(201).json({ message: "Unavailable date added", date: result.rows[0] });
  } catch (error) {
    console.error("Add unavailable date error:", error);
    res.status(500).json({ error: "Failed to add unavailable date" });
  }
};

// Remove unavailable date
export const removeUnavailableDate = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { date } = req.params;

    await pool.query(
      `DELETE FROM unavailable_dates WHERE user_id = $1 AND date = $2`,
      [user_id, date]
    );

    res.json({ message: "Unavailable date removed" });
  } catch (error) {
    console.error("Remove unavailable date error:", error);
    res.status(500).json({ error: "Failed to remove unavailable date" });
  }
};

// Get my unavailable dates
export const getMyUnavailableDates = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { start_date, end_date } = req.query;

    let query = `SELECT * FROM unavailable_dates WHERE user_id = $1`;
    const params = [user_id];

    if (start_date && end_date) {
      params.push(start_date, end_date);
      query += ` AND date BETWEEN $2 AND $3`;
    }

    query += ` ORDER BY date`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get unavailable dates error:", error);
    res.status(500).json({ error: "Failed to fetch unavailable dates" });
  }
};

// =====================================================
// SHIFT SCHEDULING
// =====================================================

// Create/assign shift
export const assignShift = async (req, res) => {
  try {
    const assigned_by = req.user.user_id;
    const {
      user_id, shift_template_id, schedule_date,
      start_time, end_time, break_duration_minutes, notes
    } = req.body;

    if (!user_id || !schedule_date) {
      return res.status(400).json({ error: "User ID and date are required" });
    }

    // Check availability
    const availCheck = await pool.query(
      `SELECT is_user_available($1, $2) as available`,
      [user_id, schedule_date]
    );

    if (!availCheck.rows[0].available) {
      return res.status(400).json({ error: "Employee is not available on this date" });
    }

    // Check for conflicts
    if (shift_template_id) {
      const template = await pool.query(
        `SELECT start_time, end_time FROM shift_templates WHERE id = $1`,
        [shift_template_id]
      );
      
      if (template.rows.length > 0) {
        const conflictCheck = await pool.query(
          `SELECT check_shift_conflict($1, $2, $3, $4) as has_conflict`,
          [user_id, schedule_date, 
           start_time || template.rows[0].start_time, 
           end_time || template.rows[0].end_time]
        );

        if (conflictCheck.rows[0].has_conflict) {
          return res.status(400).json({ error: "Shift conflicts with existing schedule" });
        }
      }
    }

    const result = await pool.query(
      `INSERT INTO shift_schedule 
       (user_id, shift_template_id, schedule_date, start_time, end_time, 
        break_duration_minutes, notes, assigned_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id, schedule_date) DO UPDATE SET
        shift_template_id = COALESCE($2, shift_schedule.shift_template_id),
        start_time = $4,
        end_time = $5,
        break_duration_minutes = $6,
        notes = $7,
        assigned_by = $8,
        updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [user_id, shift_template_id, schedule_date, start_time, end_time,
       break_duration_minutes, notes, assigned_by]
    );

    res.status(201).json({ message: "Shift assigned", schedule: result.rows[0] });
  } catch (error) {
    console.error("Assign shift error:", error);
    res.status(500).json({ error: "Failed to assign shift" });
  }
};

// Get schedule for date range
export const getSchedule = async (req, res) => {
  try {
    const { start_date, end_date, user_id, department_id } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: "Start and end dates are required" });
    }

    let query = `
      SELECT ss.*, st.name as shift_name, st.color, st.shift_type,
             COALESCE(ss.start_time, st.start_time) as actual_start,
             COALESCE(ss.end_time, st.end_time) as actual_end,
             e.first_name, e.last_name, u.email,
             d.name as department_name
      FROM shift_schedule ss
      LEFT JOIN shift_templates st ON ss.shift_template_id = st.id
      JOIN users u ON ss.user_id = u.user_id
      LEFT JOIN employees e ON ss.user_id = e.user_id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE ss.schedule_date BETWEEN $1 AND $2
    `;
    const params = [start_date, end_date];

    if (user_id) {
      params.push(user_id);
      query += ` AND ss.user_id = $${params.length}`;
    }

    if (department_id) {
      params.push(department_id);
      query += ` AND e.department_id = $${params.length}`;
    }

    query += ` ORDER BY ss.schedule_date, actual_start`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get schedule error:", error);
    res.status(500).json({ error: "Failed to fetch schedule" });
  }
};

// Get my schedule
export const getMySchedule = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { start_date, end_date } = req.query;

    const result = await pool.query(
      `SELECT ss.*, st.name as shift_name, st.color, st.shift_type,
              COALESCE(ss.start_time, st.start_time) as actual_start,
              COALESCE(ss.end_time, st.end_time) as actual_end
       FROM shift_schedule ss
       LEFT JOIN shift_templates st ON ss.shift_template_id = st.id
       WHERE ss.user_id = $1 
         AND ss.schedule_date BETWEEN $2 AND $3
         AND ss.status != 'cancelled'
       ORDER BY ss.schedule_date`,
      [user_id, start_date || new Date().toISOString().split('T')[0], end_date || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get my schedule error:", error);
    res.status(500).json({ error: "Failed to fetch schedule" });
  }
};

// Update shift status
export const updateShiftStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const result = await pool.query(
      `UPDATE shift_schedule SET status = $1, notes = COALESCE($2, notes), updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING *`,
      [status, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    res.json({ message: "Status updated", schedule: result.rows[0] });
  } catch (error) {
    console.error("Update shift status error:", error);
    res.status(500).json({ error: "Failed to update status" });
  }
};

// Publish schedule for period
export const publishSchedule = async (req, res) => {
  try {
    const { start_date, end_date, department_id } = req.body;

    let query = `UPDATE shift_schedule SET is_published = true, published_at = CURRENT_TIMESTAMP
                 WHERE schedule_date BETWEEN $1 AND $2`;
    const params = [start_date, end_date];

    if (department_id) {
      query += ` AND user_id IN (SELECT user_id FROM employees WHERE department_id = $3)`;
      params.push(department_id);
    }

    await pool.query(query, params);

    // TODO: Send notifications to employees

    res.json({ message: "Schedule published successfully" });
  } catch (error) {
    console.error("Publish schedule error:", error);
    res.status(500).json({ error: "Failed to publish schedule" });
  }
};

// =====================================================
// SHIFT SWAP REQUESTS
// =====================================================

// Create swap request
export const createSwapRequest = async (req, res) => {
  try {
    const requester_id = req.user.user_id;
    const { requester_schedule_id, target_user_id, target_schedule_id, swap_type, requester_reason } = req.body;

    if (!requester_schedule_id) {
      return res.status(400).json({ error: "Your schedule ID is required" });
    }

    // Verify requester owns the schedule
    const scheduleCheck = await pool.query(
      `SELECT * FROM shift_schedule WHERE id = $1 AND user_id = $2`,
      [requester_schedule_id, requester_id]
    );

    if (scheduleCheck.rows.length === 0) {
      return res.status(403).json({ error: "You can only swap your own shifts" });
    }

    const result = await pool.query(
      `INSERT INTO shift_swap_requests 
       (requester_id, requester_schedule_id, target_user_id, target_schedule_id, swap_type, requester_reason)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [requester_id, requester_schedule_id, target_user_id, target_schedule_id, 
       swap_type || 'swap', requester_reason]
    );

    res.status(201).json({ message: "Swap request created", request: result.rows[0] });
  } catch (error) {
    console.error("Create swap request error:", error);
    res.status(500).json({ error: "Failed to create swap request" });
  }
};

// Get my swap requests
export const getMySwapRequests = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const result = await pool.query(
      `SELECT sr.*,
              rs.schedule_date as requester_date,
              rst.name as requester_shift_name,
              ts.schedule_date as target_date,
              tst.name as target_shift_name,
              te.first_name as target_first_name,
              te.last_name as target_last_name
       FROM shift_swap_requests sr
       JOIN shift_schedule rs ON sr.requester_schedule_id = rs.id
       LEFT JOIN shift_templates rst ON rs.shift_template_id = rst.id
       LEFT JOIN shift_schedule ts ON sr.target_schedule_id = ts.id
       LEFT JOIN shift_templates tst ON ts.shift_template_id = tst.id
       LEFT JOIN employees te ON sr.target_user_id = te.user_id
       WHERE sr.requester_id = $1 OR sr.target_user_id = $1
       ORDER BY sr.created_at DESC`,
      [user_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get swap requests error:", error);
    res.status(500).json({ error: "Failed to fetch swap requests" });
  }
};

// Respond to swap request (accept/reject)
export const respondToSwapRequest = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { id } = req.params;
    const { response, target_response } = req.body; // 'accepted' or 'rejected'

    // Verify user is the target
    const request = await pool.query(
      `SELECT * FROM shift_swap_requests WHERE id = $1 AND target_user_id = $2`,
      [id, user_id]
    );

    if (request.rows.length === 0) {
      return res.status(403).json({ error: "You can only respond to requests sent to you" });
    }

    const result = await pool.query(
      `UPDATE shift_swap_requests SET 
        status = $1, target_response = $2, responded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING *`,
      [response, target_response, id]
    );

    res.json({ message: `Request ${response}`, request: result.rows[0] });
  } catch (error) {
    console.error("Respond to swap error:", error);
    res.status(500).json({ error: "Failed to respond to request" });
  }
};

// Approve swap request (manager)
export const approveSwapRequest = async (req, res) => {
  try {
    const approved_by = req.user.user_id;
    const { id } = req.params;
    const { manager_notes } = req.body;

    const request = await pool.query(`SELECT * FROM shift_swap_requests WHERE id = $1`, [id]);
    
    if (request.rows.length === 0) {
      return res.status(404).json({ error: "Request not found" });
    }

    const swapReq = request.rows[0];

    if (swapReq.status !== 'accepted') {
      return res.status(400).json({ error: "Target must accept the request first" });
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Swap the schedules
      if (swapReq.swap_type === 'swap' && swapReq.target_schedule_id) {
        // Exchange user_ids between schedules
        await client.query(
          `UPDATE shift_schedule SET user_id = $1 WHERE id = $2`,
          [swapReq.target_user_id, swapReq.requester_schedule_id]
        );
        await client.query(
          `UPDATE shift_schedule SET user_id = $1 WHERE id = $2`,
          [swapReq.requester_id, swapReq.target_schedule_id]
        );
      } else if (swapReq.swap_type === 'cover' || swapReq.swap_type === 'giveaway') {
        // Transfer shift to target
        await client.query(
          `UPDATE shift_schedule SET user_id = $1 WHERE id = $2`,
          [swapReq.target_user_id, swapReq.requester_schedule_id]
        );
      }

      // Update request status
      await client.query(
        `UPDATE shift_swap_requests SET 
          status = 'approved', approved_by = $1, approved_at = CURRENT_TIMESTAMP,
          manager_notes = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [approved_by, manager_notes, id]
      );

      await client.query('COMMIT');
      res.json({ message: "Swap approved and executed" });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Approve swap error:", error);
    res.status(500).json({ error: "Failed to approve swap" });
  }
};

// Get pending swap requests (for manager)
export const getPendingSwapRequests = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sr.*,
              re.first_name as requester_first_name, re.last_name as requester_last_name,
              te.first_name as target_first_name, te.last_name as target_last_name,
              rs.schedule_date as requester_date,
              ts.schedule_date as target_date
       FROM shift_swap_requests sr
       JOIN employees re ON sr.requester_id = re.user_id
       LEFT JOIN employees te ON sr.target_user_id = te.user_id
       JOIN shift_schedule rs ON sr.requester_schedule_id = rs.id
       LEFT JOIN shift_schedule ts ON sr.target_schedule_id = ts.id
       WHERE sr.status = 'accepted'
       ORDER BY sr.created_at`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get pending swaps error:", error);
    res.status(500).json({ error: "Failed to fetch pending swaps" });
  }
};
