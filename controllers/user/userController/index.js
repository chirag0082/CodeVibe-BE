const {
  catchAsync,
  sendSuccess,
  sendError,
  AppError,
} = require("../../../utils/errorHandler");

const getUserProfile = catchAsync(async (req, res, next) => {
  try {
    const { userId } = req;

    // Validate userId
    if (!userId) {
      return sendError(res, "User ID is required", 400);
    }

    // Query to fetch user details
    const getUserQuery = `
      SELECT 
        emp_name AS name,
        mobile_no AS mobile,
        email_add AS email,
        paid_leave AS paidLeave,
        emp_photo AS photo 
      FROM [dbo].[emp_master]
      WHERE emp_id = @userId
    `;

    // Execute the query with parameterized input
    const result = await req.executeQuery(getUserQuery, { userId });

    // Check if user exists
    if (!result.recordset || result.recordset.length === 0) {
      return next(new AppError("User not found", 404));
    }

    // Send the user profile as a response
    return sendSuccess(res, {
      ...result.recordset[0],
    });
  } catch (error) {
    // Handle unexpected errors
    console.error("Error fetching user profile:", error);
    return next(new AppError("Failed to fetch user profile", 500));
  }
});

module.exports = { getUserProfile };
