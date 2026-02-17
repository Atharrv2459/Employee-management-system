import pool from "../db.js";



import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";


// In-memory store for challenges (for demo). In prod, use Redis/DB.
const challenges = new Map();

const rpName = "Attendance System";
const rpID = "localhost"; // change to your domain in prod
const origin = "http://localhost:5173"; // your frontend URL

// ✅ Step A: Send registration options to frontend
export const getRegisterOptions = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const userRes = await pool.query(
      "SELECT user_id, email FROM users WHERE user_id = $1",
      [userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userRes.rows[0];

    const userIdBuffer = Buffer.from(user.user_id); // ✅ convert string to Buffer

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: userIdBuffer,  // ✅ must be Buffer/Uint8Array
      userName: user.email,
      timeout: 60000,
      attestationType: "none",
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "required",
      },
    });

    console.log("Generated WebAuthn options:", options);

    // Save challenge
    challenges.set(userId, options.challenge);

    res.json(options);
  } catch (err) {
    console.error("Error in getRegisterOptions:", err);
    res.status(500).json({ error: "Failed to generate registration options" });
  }
};


// ✅ Step B: Verify and store credential
export const verifyRegister = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const expectedChallenge = challenges.get(userId);

    if (!expectedChallenge) {
      return res.status(400).json({ error: "No challenge found for user" });
    }

    const verification = await verifyRegistrationResponse({
      response: req.body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    console.log("WebAuthn verification result:", verification);

    const { verified, registrationInfo } = verification;

    if (!verified || !registrationInfo || !registrationInfo.credential) {
      return res.status(400).json({ error: "Registration verification failed" });
    }

    const credentialID = registrationInfo.credential.id;
    const credentialPublicKey = registrationInfo.credential.publicKey;
    const counter = registrationInfo.credential.counter || 0;

    // Store in DB
    await pool.query(
      `INSERT INTO user_devices (user_id, credential_id, public_key, counter)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (credential_id) DO NOTHING`,
      [
        userId,
        Buffer.from(credentialID).toString("base64"),
        Buffer.from(credentialPublicKey).toString("base64"),
        counter,
      ]
    );

    challenges.delete(userId);

    res.json({ success: true });
  } catch (err) {
    console.error("Error in verifyRegister:", err);
    res.status(500).json({ error: err.message });
  }
};

export const hasDevice = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const result = await pool.query(
      `SELECT 1 FROM user_devices WHERE user_id = $1 LIMIT 1`,
      [userId]
    );

    res.json({ hasDevice: result.rows.length > 0 });
  } catch (err) {
    console.error("Error checking device:", err);
    res.status(500).json({ error: "Failed to check device" });
  }
};

export const getAuthOptions = async (req, res) => {
  try {
    console.log("getAuthOptions called. User:", req.user);

    const userId = req.user.user_id;

    const devicesRes = await pool.query(
      `SELECT credential_id FROM user_devices WHERE user_id = $1`,
      [userId]
    );

    console.log("Devices found:", devicesRes.rows);

    if (devicesRes.rows.length === 0) {
      return res.status(400).json({ error: "No device registered for this user" });
    }

    const allowCredentials = devicesRes.rows.map((d) => {
      const base64urlId = Buffer.from(d.credential_id, "base64").toString("base64url");
      return {
        id: base64urlId,
        type: "public-key",
      };
    });

    const options = await generateAuthenticationOptions({
      timeout: 60000,
      rpID,
      allowCredentials,
      userVerification: "required",
      authenticatorSelection : {
        authenticatorAttachment :
        "platform",
      }
    });

    console.log("Generated auth options:", options);

    challenges.set(userId, options.challenge);

    return res.json(options);
  } catch (err) {
    console.error("Error in getAuthOptions:", err);
    return res.status(500).json({ error: "Failed to generate auth options" });
  }
};

export const verifyAuth = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const expectedChallenge = challenges.get(userId);

    if (!expectedChallenge) {
      return res.status(400).json({ error: "No challenge found for user" });
    }

    // Get user's registered device
    const deviceRes = await pool.query(
      `SELECT credential_id, public_key, counter FROM user_devices WHERE user_id = $1 LIMIT 1`,
      [userId]
    );

    if (deviceRes.rows.length === 0) {
      return res.status(400).json({ error: "No registered device found" });
    }

    const device = deviceRes.rows[0];

    const verification = await verifyAuthenticationResponse({
      response: req.body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: Buffer.from(device.credential_id, "base64"),
        credentialPublicKey: Buffer.from(device.public_key, "base64"),
        counter: device.counter || 0,
      },
    });

    const { verified, authenticationInfo } = verification;

    if (!verified) {
      return res.status(401).json({ success: false, error: "Biometric verification failed" });
    }

    // Update counter to prevent replay attacks
    await pool.query(
      `UPDATE user_devices SET counter = $1 WHERE user_id = $2`,
      [authenticationInfo.newCounter, userId]
    );

    challenges.delete(userId);

    res.json({ success: true });
  } catch (err) {
    console.error("Error verifying auth:", err);
    res.status(500).json({ error: "Authentication verification failed" });
  }
};

