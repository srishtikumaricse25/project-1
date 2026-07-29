import express from 'express';
import { db } from '../db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/organizations
router.get('/', verifyToken, (req, res) => {
  const orgs = db.getOrganizations();
  res.json(orgs);
});

// GET /api/organizations/:id
router.get('/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const org = db.getOrganizationById(id);
  if (!org) return res.status(404).json({ error: 'Organization not found' });
  res.json(org);
});

export default router;
