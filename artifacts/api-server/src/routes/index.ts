import { Router, type IRouter } from "express";
import healthRouter from "./health";
import departmentsRouter from "./departments";
import employeesRouter from "./employees";
import correspondencesRouter from "./correspondences";
import archiveRouter from "./archive";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(departmentsRouter);
router.use(employeesRouter);
router.use(correspondencesRouter);
router.use(archiveRouter);
router.use(dashboardRouter);

export default router;
