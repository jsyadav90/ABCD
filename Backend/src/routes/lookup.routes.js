import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createLookup,
  getLookupsByCategory,
  getAllLookups,
  searchCategories,
  updateLookup,
  deleteLookup,
} from "../controllers/lookup.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/", createLookup);
router.get("/category", getLookupsByCategory);
router.get("/", getAllLookups);
router.get("/categories/search", searchCategories);
router.put("/:id", updateLookup);
router.delete("/:id", deleteLookup);

export default router;
