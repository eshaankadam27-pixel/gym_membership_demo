import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import ApiResponse from "../utils/ApiResponse.js";
import * as membershipService from "../services/membership.service.js";

/**
 * POST /api/v1/memberships/enroll
 * Enroll the authenticated user in a membership plan.
 */
export const enroll = asyncHandler(async (req, res) => {
  const membership = await membershipService.enrollMember(
    req.user.userId,
    req.body
  );

  res
    .status(201)
    .json(new ApiResponse(201, membership, "Membership enrolled successfully"));
});

/**
 * GET /api/v1/memberships/me
 * Get the authenticated user's active membership.
 */
export const getMyMembership = asyncHandler(async (req, res) => {
  const membership = await membershipService.getMyMembership(req.user.userId);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        membership,
        membership
          ? "Membership fetched successfully"
          : "No active membership found"
      )
    );
});

/**
 * GET /api/v1/memberships/stats
 * Get membership statistics (admin only).
 */
export const getMembershipStats = asyncHandler(async (_req, res) => {
  const stats = await membershipService.getMembershipStats();

  res
    .status(200)
    .json(new ApiResponse(200, stats, "Membership stats fetched successfully"));
});

/**
 * GET /api/v1/memberships
 * List all memberships (admin only).
 */
export const getAllMemberships = asyncHandler(async (_req, res) => {
  const memberships = await membershipService.getAllMemberships();

  res
    .status(200)
    .json(
      new ApiResponse(200, memberships, "Memberships fetched successfully")
    );
});

/**
 * POST /api/v1/memberships/admin/enroll
 * Admin assigns a plan to any user.
 */
export const adminEnroll = asyncHandler(async (req, res) => {
  const membership = await membershipService.adminEnrollMember(req.body);

  res
    .status(201)
    .json(
      new ApiResponse(201, membership, "Membership assigned to user successfully")
    );
});

/**
 * PATCH /api/v1/memberships/:id/status
 * Admin updates status of a membership.
 */
export const updateStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const updated = await membershipService.updateMembershipStatus(id, status);

  res
    .status(200)
    .json(new ApiResponse(200, updated, `Membership status updated to ${status}`));
});
