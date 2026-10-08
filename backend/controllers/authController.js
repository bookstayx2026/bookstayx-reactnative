const bcrypt = require("bcrypt");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { query } = require("../db");
const { generateToken, JWT_SECRET } = require("../utils/jwt");
const {
  RefreshTokenRepository,
} = require("../repositories/refreshTokenRepository");

// ── helpers ───────────────────────────────────────────────────────────────────

function generateRawRefreshToken() {
  return crypto.randomBytes(32).toString("hex");
}

// ── Admin login — step 1: validate credentials ────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required." });
    }

    const result = await query(
      "SELECT id, email, password_hash, totp_secret, totp_enabled FROM admins WHERE email = $1",
      [email],
    );

    if (result.rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
    }

    const admin = result.rows[0];

    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
    }

    if (admin.totp_enabled && !admin.totp_secret) {
      console.error(
        `[Auth] Inconsistent 2FA state for admin id=${admin.id}: totp_enabled=true but no secret`,
      );
      return res.status(500).json({
        success: false,
        message: "Account 2FA configuration error. Please contact support.",
      });
    }

    // If TOTP is active, issue a short-lived temp token for the TOTP step
    if (admin.totp_enabled && admin.totp_secret) {
      const tempToken = jwt.sign(
        { id: admin.id, email: admin.email, purpose: "totp" },
        JWT_SECRET,
        { expiresIn: "5m" },
      );
      return res.status(200).json({
        success: true,
        requiresTOTP: true,
        tempToken,
      });
    }

    // No TOTP — issue access token + refresh token
    const accessToken = generateToken({ id: admin.id, email: admin.email });
    const rawRefreshToken = generateRawRefreshToken();
    await RefreshTokenRepository.create(rawRefreshToken, admin.id, "admin");

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        token: accessToken,
        refreshToken: rawRefreshToken,
        admin: { id: admin.id, email: admin.email },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error. Please try again." });
  }
};

// ── Admin login — step 2: verify TOTP and issue tokens ────────────────────────
const verifyTotp = async (req, res) => {
  try {
    const { tempToken, code } = req.body;

    if (!tempToken || !code) {
      return res
        .status(400)
        .json({ success: false, message: "Token and code are required." });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET);
    } catch {
      return res
        .status(401)
        .json({
          success: false,
          message: "Session expired. Please log in again.",
        });
    }

    if (decoded.purpose !== "totp") {
      return res
        .status(401)
        .json({ success: false, message: "Invalid token." });
    }

    const result = await query(
      "SELECT id, email, totp_secret, totp_enabled FROM admins WHERE id = $1",
      [decoded.id],
    );

    if (result.rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Admin not found." });
    }

    const admin = result.rows[0];

    if (!admin.totp_enabled || !admin.totp_secret) {
      return res
        .status(400)
        .json({
          success: false,
          message: "2FA is not enabled for this account.",
        });
    }

    const isValid = speakeasy.totp.verify({
      secret: admin.totp_secret,
      encoding: "base32",
      token: String(code).replace(/\s/g, ""),
      window: 1,
    });

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid authenticator code. Please try again.",
      });
    }

    // TOTP passed — issue access token + refresh token
    const accessToken = generateToken({ id: admin.id, email: admin.email });
    const rawRefreshToken = generateRawRefreshToken();
    await RefreshTokenRepository.create(rawRefreshToken, admin.id, "admin");

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        token: accessToken,
        refreshToken: rawRefreshToken,
        admin: { id: admin.id, email: admin.email },
      },
    });
  } catch (error) {
    console.error("Verify TOTP error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error. Please try again." });
  }
};

// ── Token refresh ─────────────────────────────────────────────────────────────
// POST /api/auth/refresh — accepts a refresh token, issues a new access token
// and a NEW refresh token (single-use rotation). Old token is atomically deleted.
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: rawToken } = req.body;
    if (!rawToken) {
      return res
        .status(400)
        .json({ success: false, message: "Refresh token is required." });
    }

    // Atomically validate + delete the old token
    const record = await RefreshTokenRepository.findAndDelete(rawToken);
    if (!record) {
      return res.status(401).json({
        success: false,
        message: "Refresh token expired or invalid. Please log in again.",
      });
    }

    const { user_id, user_type } = record;
    let accessPayload;

    if (user_type === "admin") {
      const adminResult = await query(
        "SELECT id, email FROM admins WHERE id = $1",
        [user_id],
      );
      if (!adminResult.rows.length) {
        return res
          .status(401)
          .json({ success: false, message: "Admin not found." });
      }
      const admin = adminResult.rows[0];
      accessPayload = { id: admin.id, email: admin.email };
    } else if (user_type === "owner") {
      const ownerResult = await query(
        "SELECT id, owner_otp_number FROM owners WHERE id = $1",
        [user_id],
      );
      if (!ownerResult.rows.length) {
        return res
          .status(401)
          .json({ success: false, message: "Owner not found." });
      }
      const owner = ownerResult.rows[0];
      accessPayload = {
        id: owner.id,
        mobile: owner.owner_otp_number,
        role: "owner",
      };
    } else if (user_type === "referral") {
      const refResult = await query(
        "SELECT id, username FROM referral_users WHERE id = $1 AND status != $2",
        [user_id, "blocked"],
      );
      if (!refResult.rows.length) {
        return res.status(401).json({
          success: false,
          message: "User not found or account blocked.",
        });
      }
      const user = refResult.rows[0];
      accessPayload = { id: user.id, userId: user.id, username: user.username, role: "referral" };
    } else if (user_type === "customer") {
      const customerResult = await query(
        "SELECT id, mobile FROM customers WHERE id = $1",
        [user_id],
      );
      if (!customerResult.rows.length) {
        return res.status(401).json({ success: false, message: "Customer not found." });
      }
      const customer = customerResult.rows[0];
      accessPayload = { id: customer.id, mobile: customer.mobile, role: "customer" };
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Unknown user type." });
    }

    // Issue new access token + new refresh token (rotation)
    const newAccessToken = generateToken({ ...accessPayload, role: accessPayload.role || user_type });
    const newRawRefreshToken = generateRawRefreshToken();
    await RefreshTokenRepository.create(newRawRefreshToken, user_id, user_type);

    return res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRawRefreshToken,
    });
  } catch (error) {
    console.error("[Auth] refreshToken error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ── Logout ────────────────────────────────────────────────────────────────────
// Invalidates the refresh token in the DB so it cannot be reused.
const logout = async (req, res) => {
  try {
    const { refreshToken: rawToken } = req.body;
    if (rawToken) {
      await RefreshTokenRepository.deleteByRawToken(rawToken);
    }
    return res.status(200).json({ success: true, message: "Logout successful." });
  } catch (err) {
    console.error("[Auth] logout error:", err.message);
    // Always succeed — client clears tokens regardless
    return res.status(200).json({ success: true, message: "Logout successful." });
  }
};

// ── TOTP management (unchanged) ───────────────────────────────────────────────
const getTotpStatus = async (req, res) => {
  try {
    const result = await query(
      "SELECT totp_enabled, totp_secret FROM admins WHERE id = $1",
      [req.user.id],
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found." });
    }
    const { totp_enabled, totp_secret } = result.rows[0];
    return res.status(200).json({
      success: true,
      data: { totp_enabled: !!totp_enabled, has_secret: !!totp_secret },
    });
  } catch (error) {
    console.error("Get TOTP status error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

const setupTotp = async (req, res) => {
  try {
    const result = await query(
      "SELECT email, totp_enabled FROM admins WHERE id = $1",
      [req.user.id],
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found." });
    }
    const { email, totp_enabled } = result.rows[0];

    if (totp_enabled) {
      return res.status(400).json({
        success: false,
        message:
          "2FA is already enabled. Disable it first if you want to re-configure.",
      });
    }

    const secret = speakeasy.generateSecret({
      name: `PawnaHavenCamp Admin (${email})`,
      issuer: "PawnaHavenCamp",
      length: 20,
    });

    await query("UPDATE admins SET totp_pending_secret = $1 WHERE id = $2", [
      secret.base32,
      req.user.id,
    ]);

    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url, {
      width: 256,
      margin: 2,
      color: { dark: "#000000", light: "#FFFFFF" },
    });

    return res.status(200).json({
      success: true,
      data: { qrCode: qrCodeDataUrl, manualKey: secret.base32 },
    });
  } catch (error) {
    console.error("Setup TOTP error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

const enableTotp = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Authenticator code is required.",
        });
    }

    const result = await query(
      "SELECT totp_pending_secret, totp_enabled FROM admins WHERE id = $1",
      [req.user.id],
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found." });
    }

    const { totp_pending_secret, totp_enabled } = result.rows[0];
    if (totp_enabled) {
      return res
        .status(400)
        .json({ success: false, message: "2FA is already enabled." });
    }
    if (!totp_pending_secret) {
      return res.status(400).json({
        success: false,
        message: "No setup in progress. Please start the setup process first.",
      });
    }

    const isValid = speakeasy.totp.verify({
      secret: totp_pending_secret,
      encoding: "base32",
      token: String(code).replace(/\s/g, ""),
      window: 1,
    });

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid code. Make sure you scanned the QR code and entered the current code.",
      });
    }

    await query(
      "UPDATE admins SET totp_secret = $1, totp_enabled = TRUE, totp_pending_secret = NULL WHERE id = $2",
      [totp_pending_secret, req.user.id],
    );

    return res
      .status(200)
      .json({ success: true, message: "2FA has been enabled successfully." });
  } catch (error) {
    console.error("Enable TOTP error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

const disableTotp = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Authenticator code is required.",
        });
    }

    const result = await query(
      "SELECT totp_secret, totp_enabled FROM admins WHERE id = $1",
      [req.user.id],
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found." });
    }

    const { totp_secret, totp_enabled } = result.rows[0];
    if (!totp_enabled || !totp_secret) {
      return res
        .status(400)
        .json({
          success: false,
          message: "2FA is not currently enabled.",
        });
    }

    const isValid = speakeasy.totp.verify({
      secret: totp_secret,
      encoding: "base32",
      token: String(code).replace(/\s/g, ""),
      window: 1,
    });

    if (!isValid) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid authenticator code." });
    }

    await query(
      "UPDATE admins SET totp_secret = NULL, totp_enabled = FALSE, totp_pending_secret = NULL WHERE id = $1",
      [req.user.id],
    );

    return res
      .status(200)
      .json({ success: true, message: "2FA has been disabled." });
  } catch (error) {
    console.error("Disable TOTP error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

const verifyAuth = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Token is valid.",
    data: { admin: req.user },
  });
};

module.exports = {
  login,
  verifyTotp,
  refreshToken,
  logout,
  getTotpStatus,
  setupTotp,
  enableTotp,
  disableTotp,
  verifyAuth,
};
