import { Router } from "express";

import authRoutes from "./auth";
import programsRoutes from "./programs";
import affiliatesRoutes from "./affiliates";
import affiliateProgramsRoutes from "./affiliatePrograms";
import linksRoutes from "./links";
import clicksRoutes from "./clicks";
import conversionsRoutes from "./conversions";
import payoutsRoutes from "./payouts";

const router = Router();

router.use("/auth", authRoutes);
router.use("/programs", programsRoutes);
router.use("/affiliates", affiliatesRoutes);
router.use("/affiliate-programs", affiliateProgramsRoutes);
router.use("/links", linksRoutes);
router.use("/clicks", clicksRoutes);
router.use("/conversions", conversionsRoutes);
router.use("/payouts", payoutsRoutes);

export default router;