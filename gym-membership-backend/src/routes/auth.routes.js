import { Router } from "express";
import {
  register,
  login,
  getAuthById,
  updateAuth,
  deleteAuth,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/:id", getAuthById);
router.patch("/:id", updateAuth);
router.delete("/:id", deleteAuth);

export default router;
