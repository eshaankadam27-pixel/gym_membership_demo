import { Router } from "express";
import {
  getMyProfile,
  updateMyProfile,
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// ── Member profile (protected) ───────────────────────────
router.get("/me", authenticate, getMyProfile);
router.put("/me", authenticate, updateMyProfile);

// ── General user CRUD (existing — kept for backward compatibility) ──
router.post("/", createUser);
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.patch("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
