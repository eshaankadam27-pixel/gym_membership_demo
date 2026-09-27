import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import ApiResponse from "../utils/ApiResponse.js";
import * as discountService from "../services/discount.service.js";

/**
 * POST /api/v1/discounts
 * Admin creates a new discount with time duration.
 */
export const createDiscount = asyncHandler(async (req, res) => {
  const discount = await discountService.createDiscount(req.body, req.user?.userId);

  res
    .status(201)
    .json(new ApiResponse(201, discount, "Discount created successfully"));
});

/**
 * GET /api/v1/discounts
 * Admin retrieves all discounts (with computed status: ACTIVE, EXPIRED, UPCOMING, INACTIVE).
 */
export const getAllDiscounts = asyncHandler(async (_req, res) => {
  const discounts = await discountService.getAllDiscounts();

  res
    .status(200)
    .json(new ApiResponse(200, discounts, "All discounts fetched successfully"));
});

/**
 * GET /api/v1/discounts/active
 * Public endpoint: retrieves currently valid and active discounts.
 */
export const getActiveDiscounts = asyncHandler(async (_req, res) => {
  const data = await discountService.getActiveDiscounts();

  res
    .status(200)
    .json(new ApiResponse(200, data, "Active discounts fetched successfully"));
});

/**
 * PUT /api/v1/discounts/:id
 * Admin updates an existing discount.
 */
export const updateDiscount = asyncHandler(async (req, res) => {
  const updated = await discountService.updateDiscount(req.params.id, req.body);

  res
    .status(200)
    .json(new ApiResponse(200, updated, "Discount updated successfully"));
});

/**
 * PATCH /api/v1/discounts/:id/toggle
 * Admin toggles discount active status.
 */
export const toggleDiscountStatus = asyncHandler(async (req, res) => {
  const updated = await discountService.toggleDiscountStatus(req.params.id);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updated,
        `Discount ${updated.isActive ? "activated" : "deactivated"} successfully`
      )
    );
});

/**
 * DELETE /api/v1/discounts/:id
 * Admin deletes a discount.
 */
export const deleteDiscount = asyncHandler(async (req, res) => {
  await discountService.deleteDiscount(req.params.id);

  res
    .status(200)
    .json(new ApiResponse(200, null, "Discount deleted successfully"));
});
