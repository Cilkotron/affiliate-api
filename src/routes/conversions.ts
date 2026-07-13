import { Router } from "express";
import {
  createConversion,
  getConversions,
  getMyConversions,
  updateConversionStatus,
} from "../controllers/conversionsController";
import {
  authenticate,
  authorizeAdmin,
} from "../middleware/auth";

const router = Router();

router.post("/", createConversion); // public
router.get("/", authenticate, authorizeAdmin, getConversions); // admin
router.get("/affiliate", authenticate, getMyConversions); // affiliate
router.put(
  "/:id/status",
  authenticate,
  authorizeAdmin,
  updateConversionStatus
); // admin approve/paid

export default router;