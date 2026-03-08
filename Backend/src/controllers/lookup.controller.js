import { Lookup } from "../models/lookup.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

const normalizeCategory = (val) => {
  const s = String(val || "").trim();
  if (!s) return "";
  return s.toLowerCase().replace(/\s+/g, "_");
};


/* CREATE LOOKUP */
export const createLookup = asyncHandler(async (req, res) => {

  let { category, name, code, description } = req.body;

  const normalizedCategory = normalizeCategory(category);

  const exists = await Lookup.findOne({
    category: normalizedCategory,
    name
  });

  if(exists){
    throw new apiError(400, "Lookup already exists", [{ field: "name", code: "DUPLICATE" }]);
  }

  const lookup = await Lookup.create({
    category: normalizedCategory,
    name,
    code,
    description
  });

  return res.status(201).json(new apiResponse(201, lookup, "Lookup created"));

});


/* GET LOOKUPS BY CATEGORY */
export const getLookupsByCategory = asyncHandler(async (req, res) => {

  const { category } = req.query;

  const normalizedCategory = normalizeCategory(category);

  const lookups = await Lookup.find({
    category: normalizedCategory,
    isDeleted:false,
    isActive:true
  })
  .sort({sortOrder:1,name:1});

  return res.status(200).json(new apiResponse(200, { items: lookups, count: lookups.length }, "Lookups retrieved"));

});


/* GET ALL LOOKUPS (pagination) */
export const getAllLookups = asyncHandler(async (req, res) => {

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const skip = (page-1) * limit;

  const data = await Lookup.find({isDeleted:false})
    .skip(skip)
    .limit(limit)
    .sort({category:1,name:1});

  const total = await Lookup.countDocuments({isDeleted:false});

  return res.status(200).json(new apiResponse(200, { items: data, meta: { page, limit, total } }, "Lookups retrieved"));

});


/* CATEGORY AUTOCOMPLETE */
export const searchCategories = asyncHandler(async (req, res) => {

  const { search } = req.query;

  const categories = await Lookup.aggregate([
    {
      $match:{
        category:{
          $regex: search || "",
          $options:"i"
        },
        isDeleted:false
      }
    },
    {
      $group:{
        _id:"$category"
      }
    },
    {
      $limit:10
    }
  ]);

  return res.status(200).json(new apiResponse(200, categories.map(c => c._id), "Categories"));

});


/* UPDATE LOOKUP */
export const updateLookup = asyncHandler(async (req, res) => {

  const lookup = await Lookup.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new:true }
  );

  return res.status(200).json(new apiResponse(200, lookup, "Lookup updated"));

});


/* DELETE LOOKUP (soft delete) */
export const deleteLookup = asyncHandler(async (req, res) => {

  const lookup = await Lookup.findByIdAndUpdate(
    req.params.id,
    {
      isDeleted:true,
      isActive:false
    },
    { new:true }
  );

  return res.status(200).json(new apiResponse(200, lookup, "Lookup deleted"));

});
