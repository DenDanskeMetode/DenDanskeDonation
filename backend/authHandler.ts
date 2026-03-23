import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Router, Request, Response } from 'express';
import { issueToken } from './JWTHandler.js';
import { findOrCreateOAuthUser } from './dbHandler.js';
import dotenv from 'dotenv';

// Augment Express.User to match the shape used throughout the app
declare global {
  namespace Express {
    interface User {
      userId: number;
      email: string;
      username: string;
      role: 'user' | 'admin';
    }
  }
}

dotenv.config();

const router = Router();

passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: '/auth/google/callback',
  },
  async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      const firstname = profile.name?.givenName || 'Google';
      const surname = profile.name?.familyName || 'User';
      const username = (email?.split('@')[0] || `google_${profile.id}`)
        .replace(/[^a-zA-Z0-9_]/g, '')
        .toLowerCase()
        .slice(0, 50);

      const dbUser = await findOrCreateOAuthUser({ provider: 'google', providerId: profile.id, email, firstname, surname, username });
      done(null, { userId: dbUser.id, email: dbUser.email, username: dbUser.username, role: dbUser.role });
    } catch (err) {
      done(err as Error);
    }
  }
));

passport.use(new FacebookStrategy(
  {
    clientID: process.env.FACEBOOK_APP_ID!,
    clientSecret: process.env.FACEBOOK_APP_SECRET!,
    callbackURL: '/auth/facebook/callback',
    profileFields: ['id', 'emails', 'name'],
  },
  async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      const firstname = profile.name?.givenName || 'Facebook';
      const surname = profile.name?.familyName || 'User';
      const username = (email?.split('@')[0] || `facebook_${profile.id}`)
        .replace(/[^a-zA-Z0-9_]/g, '')
        .toLowerCase()
        .slice(0, 50);

      const dbUser = await findOrCreateOAuthUser({ provider: 'facebook', providerId: profile.id, email, firstname, surname, username });
      done(null, { userId: dbUser.id, email: dbUser.email, username: dbUser.username, role: dbUser.role });
    } catch (err) {
      done(err as Error);
    }
  }
));

// Minimal serialize/deserialize needed for OAuth state verification during handshake
passport.serializeUser((user, done) => done(null, user.userId));
passport.deserializeUser((userId: unknown, done) => done(null, { userId } as Express.User));

function redirectWithToken(req: Request, res: Response) {
  const user = req.user!;
  const token = issueToken({
    userId: user.userId,
    email: user.email,
    username: user.username,
    role: user.role,
  });
  const userParam = encodeURIComponent(JSON.stringify({
    id: user.userId,
    username: user.username,
    email: user.email,
    role: user.role,
  }));
  res.redirect(`${process.env.FRONTEND_URL}/oauth-callback?token=${token}&user=${userParam}`);
}

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed` }),
  redirectWithToken
);

router.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.get(
  '/auth/facebook/callback',
  passport.authenticate('facebook', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed` }),
  redirectWithToken
);

export { router as authRouter, passport };
