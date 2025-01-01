const {
  catchAsync,
  AppError,
  sendSuccess,
} = require("../../../utils/errorHandler");

const getAllPendingRequest = catchAsync(async (req, res, next) => {
  try {
    const result = await req.executeQuery("EXEC sp_GetAllPendingRequests");

    return sendSuccess(
      res,
      { results: result.recordset.length, data: result.recordset },
      "Leave requests fetched successfully."
    );
  } catch (error) {
    return next(
      new AppError("Error fetching pending Leave request", 500, {
        errorCode: "FETCHING_PENDING_ERROR",
      })
    );
  }
});

const approveRequest = catchAsync(async (req, res, next) => {
  const { leaveId, action } = req.body;

  if (!leaveId || !["Approve", "Reject"].includes(action)) {
    return next(
      new AppError("Invalid request parameters", 400, {
        errorCode: "INVALID_PARAMETERS",
      })
    );
  }

  try {
    await req.executeQuery("EXEC sp_ProcessLeaveRequest @leaveId, @action", {
      leaveId,
      action,
    });

    return sendSuccess(
      res,
      {
        data: {
          leaveId,
          action,
        },
      },
      `Leave request ${action.toLowerCase()}`
    );
  } catch (error) {
    if (error.message.includes("Leave request not found")) {
      return next(
        new AppError("Leave request not found or already processed", 404, {
          errorCode: "LEAVE_REQUEST_NOT_FOUND",
        })
      );
    }
    throw error;
  }
});

const getAllLeaveHistory = catchAsync(async (req, res, next) => {
  const { emp_id, page = 1, limit = 10 } = req.query;

  try {
    const result = await req.executeQuery(
      "EXEC sp_GetAdminLeaveHistory @emp_id, @page, @limit",
      {
        emp_id: emp_id ? parseInt(emp_id, 10) : 0,
        page: parseInt(page),
        limit: parseInt(limit),
      }
    );

    const data = result.recordsets[1];
    const total = result.recordsets[0][0].total;

    if (data.length === 0) {
      return next(
        new AppError("No leave history found", 404, {
          errorCode: "LEAVE_HISTORY_NOT_FOUND",
        })
      );
    }

    return sendSuccess(res, {
      results: data.length,
      total,
      data,
    });
  } catch (error) {
    if (error.message.includes("No leave history found")) {
      return next(
        new AppError("No leave history found", 404, {
          errorCode: "LEAVE_HISTORY_NOT_FOUND",
        })
      );
    }
    throw error;
  }
});

const deleteRequest = catchAsync(async (req, res, next) => {
  const { leaveId } = req.params;

  if (!leaveId) {
    return next(
      new AppError("No leave ID provided", 400, {
        errorCode: "LEAVE_ID_NOT_FOUND",
      })
    );
  }

  try {
    await req.executeQuery("EXEC sp_DeleteLeaveRequest @leaveId", { leaveId });
    return sendSuccess(res, "Leave request deleted successfully.");
  } catch (error) {
    if (error.message.includes("No leave request found")) {
      return next(
        new AppError("No leave request found with the provided ID", 404, {
          errorCode: "LEAVE_NOT_FOUND",
        })
      );
    }
    // console.error("Error deleting leave request: ", error);
    return next(
      new AppError("Failed to delete leave request", 500, {
        errorCode: "DB_DELETE_ERROR",
        details: error.message,
      })
    );
  }
});

module.exports = {
  getAllPendingRequest,
  approveRequest,
  getAllLeaveHistory,
  deleteRequest,
};
