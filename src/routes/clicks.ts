import { Router } from "express";
import {
  trackClick,
  getClicks,
  getMyClicks,
} from "../controllers/clicksController";
import {
  authenticate,
  authorizeAdmin,
} from "../middleware/auth";

const router = Router();

router.get("/go/:slug", trackClick);
router.get("/", authenticate, authorizeAdmin, getClicks);
router.get("/affiliate", authenticate, getMyClicks);

export default router;