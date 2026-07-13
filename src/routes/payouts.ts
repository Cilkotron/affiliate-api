import { Router } from "express";
import {
    createPayout,
    getPayouts,
    getMyPayouts,
    updatePayoutStatus,
} from "../controllers/payoutsController";
import {
    authenticate,
    authorizeAdmin,
} from "../middleware/auth";

const router = Router();

router.post("/", authenticate, createPayout);
router.get("/", authenticate, authorizeAdmin, getPayouts);
router.get("/affiliate", authenticate, getMyPayouts);
router.put("/:id/status", authenticate, authorizeAdmin, updatePayoutStatus);

export default router;