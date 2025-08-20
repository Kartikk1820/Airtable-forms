const axios = require("axios");
const User = require("../models/User");
const dotenv = require("dotenv");
const crypto = require("crypto");
dotenv.config();

const toBase64Url = (buffer) =>
  buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const authController = {
  login: (req, res) => {
    // generate and store state to mitigate CSRF
    const state = crypto.randomBytes(16).toString("hex");
    req.session.oauthState = state;

    // PKCE: generate verifier and challenge
    const codeVerifier = toBase64Url(crypto.randomBytes(64)).slice(0, 128);
    req.session.oauthPkceVerifier = codeVerifier;
    const codeChallenge = toBase64Url(
      crypto.createHash("sha256").update(codeVerifier).digest()
    );

    const redirectUri = process.env.AIRTABLE_REDIRECT_URI;
    console.log("redirectUri: ", redirectUri);
    const scope = "schema.bases:read data.records:write data.records:read";
    console.log("scope: ", scope);
    console.log(
      "OAuth client:",
      process.env.AIRTABLE_CLIENT_ID,
      "secret length:",
      (process.env.AIRTABLE_CLIENT_SECRET || "").length
    );

    const query = new URLSearchParams({
      client_id: process.env.AIRTABLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    }).toString();

    const authUrl = `https://airtable.com/oauth2/v1/authorize?${query}`;
    console.log("authUrl: ", authUrl);

    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).send("Could not save session");
      }
      res.redirect(authUrl);
    });
  },

  callback: async (req, res) => {
    try {
      // Handle provider-reported errors up front
      if (req.query.error) {
        console.error("OAuth error:", req.query);
        return res
          .status(400)
          .send(
            `OAuth error: ${req.query.error_description || req.query.error}`
          );
      }

      const { code, state } = req.query;

      // Validate state
      if (!state || state !== req.session.oauthState) {
        console.error("Invalid or missing state", { received: state });
        return res.status(400).send("Invalid OAuth state");
      }
      delete req.session.oauthState;

      if (!code) {
        console.error("Missing authorization code");
        return res.status(400).send("Missing authorization code");
      }

      const codeVerifier = req.session.oauthPkceVerifier;
      if (!codeVerifier) {
        console.error("Missing PKCE verifier in session");
        return res.status(400).send("Missing PKCE verifier");
      }
      delete req.session.oauthPkceVerifier;

      // Env checks
      if (
        !process.env.AIRTABLE_CLIENT_ID ||
        !process.env.AIRTABLE_CLIENT_SECRET
      ) {
        console.error("Missing Airtable OAuth env vars");
        return res
          .status(500)
          .send("Server misconfigured: missing OAuth env vars");
      }

      const tokenUrl = "https://airtable.com/oauth2/v1/token";

      // Attempt 1: Basic auth header
      const paramsBasic = new URLSearchParams();
      paramsBasic.append("grant_type", "authorization_code");
      paramsBasic.append("code", code);
      paramsBasic.append("redirect_uri", process.env.AIRTABLE_REDIRECT_URI);
      paramsBasic.append("code_verifier", codeVerifier);

      const basicAuth = Buffer.from(
        `${process.env.AIRTABLE_CLIENT_ID}:${process.env.AIRTABLE_CLIENT_SECRET}`
      ).toString("base64");

      let tokenRes;
      try {
        tokenRes = await axios.post(tokenUrl, paramsBasic.toString(), {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${basicAuth}`,
          },
        });
      } catch (err) {
        const data = err.response?.data;
        const status = err.response?.status;
        if (
          status &&
          [400, 401].includes(status) &&
          (data?.error === "invalid_client" ||
            data?.error === "unauthorized_client")
        ) {
          console.warn(
            "Token exchange failed with Basic auth (invalid_client). Retrying with credentials in body."
          );
          // Attempt 2: credentials in form body
          const paramsBody = new URLSearchParams();
          paramsBody.append("grant_type", "authorization_code");
          paramsBody.append("code", code);
          paramsBody.append("client_id", process.env.AIRTABLE_CLIENT_ID);
          paramsBody.append(
            "client_secret",
            process.env.AIRTABLE_CLIENT_SECRET
          );
          paramsBody.append("redirect_uri", process.env.AIRTABLE_REDIRECT_URI);
          paramsBody.append("code_verifier", codeVerifier);

          tokenRes = await axios.post(tokenUrl, paramsBody.toString(), {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          });
        } else {
          throw err;
        }
      }

      const { access_token, refresh_token } = tokenRes.data;

      // get user info
      const meRes = await axios.get("https://api.airtable.com/v0/meta/whoami", {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const { id, email, name } = meRes.data;

      let user = await User.findOneAndUpdate(
        { airtableUserId: id },
        {
          airtableUserId: id,
          email,
          name,
          accessToken: access_token,
          refreshToken: refresh_token,
        },
        { upsert: true, new: true }
      );

      req.session.userId = user._id;

      // Debug: Log session state
      console.log("Session after setting userId:", {
        sessionID: req.sessionID,
        userId: req.session.userId,
        oauthState: req.session.oauthState,
        oauthPkceVerifier: req.session.oauthPkceVerifier,
      });

      // Ensure session is saved before redirect
      req.session.save((err) => {
        if (err) {
          console.error("Failed to save session:", err);
          return res.status(500).send("Failed to save session");
        }
        console.log("Session saved successfully, redirecting to dashboard");
        res.redirect("/dashboard");
      });
    } catch (err) {
      console.error(err.response?.data || err.message);
      res.status(500).send("OAuth callback failed");
    }
  },

  me: async (req, res) => {
    if (!req.session.userId)
      return res.status(401).json({ message: "Not logged in" });
    const user = await User.findById(req.session.userId);
    res.json(user);
  },
};

module.exports = authController;
