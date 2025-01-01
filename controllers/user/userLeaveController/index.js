const {
  catchAsync,
  AppError,
  sendSuccess,
} = require("../../../utils/errorHandler");

const LEAVE_TYPES = {
  PAID_LEAVE: "Paid Leave",
  CASUAL_LEAVE: "Casual Leave",
  SICK_LEAVE: "Sick Leave",
  UNPAID_LEAVE: "Unpaid Leave",
};

const LEAVE_TYPE_MAP = {
  "Paid Leave": "Paid",
  "Casual Leave": "Casual",
  "Sick Leave": "Sick",
  "Unpaid Leave": "Unpaid",
};

const leaveRequest = catchAsync(async (req, res, next) => {
  const {
    leaveId,
    leaveFrom,
    leaveTo,
    leaveType,
    remark,
    isHalfDay = false,
  } = req.body;

  const empId = req.userId;

  // Validate Leave Type
  if (leaveType && !Object.values(LEAVE_TYPES).includes(leaveType)) {
    return next(
      new AppError("Invalid leave type", 400, {
        errorCode: "INVALID_LEAVE_TYPE",
        validLeaveTypes: Object.values(LEAVE_TYPES),
      })
    );
  }

  const sanitizedLeaveType = LEAVE_TYPE_MAP[leaveType] || leaveType;

  try {
    // Handle leave cancellation
    if (leaveId && !leaveFrom && !leaveTo && !leaveType && !remark) {
      await req.executeQuery(
        "EXEC sp_ManageLeaveRequest @leaveId, @empId, NULL, NULL, NULL, NULL, 0, 'CANCEL'",
        {
          leaveId,
          empId,
        }
      );
      return sendSuccess(res, "Leave Request Canceled");
    }

    // Validate Required Fields for new request
    if (!leaveId && (!leaveFrom || !leaveTo || !leaveType || !remark)) {
      return next(
        new AppError("Missing required leave request fields", 400, {
          errorCode: "INVALID_LEAVE_REQUEST",
        })
      );
    }

    // Create or Update leave request
    const result = await req.executeQuery(
      "DECLARE @leaveId INT = NULL EXEC sp_ManageLeaveRequest @leaveId, @empId, @leaveFrom, @leaveTo, @leaveType, @remark, @isHalfDay, 'REQUEST'",
      {
        leaveId: leaveId || null,
        empId,
        leaveFrom: leaveFrom ? new Date(leaveFrom) : null,
        leaveTo: leaveTo ? new Date(leaveTo) : null,
        leaveType: sanitizedLeaveType,
        remark,
        isHalfDay: isHalfDay ? 1 : 0,
      }
    );

    return sendSuccess(
      res,
      {
        leaveId: result.recordset[0].leave_id,
        calculatedDays: result.recordset[0].calculated_days,
        isHalfDay,
      },
      leaveId ? "Leave Request Updated" : "Leave Request Created"
    );
  } catch (error) {
    let errorMessage = "Failed to process leave request";
    let statusCode = 500;
    let errorCode = "LEAVE_REQUEST_ERROR";

    if (error.message.includes("Insufficient paid leave balance")) {
      errorMessage = "Insufficient paid leave balance";
      statusCode = 400;
      errorCode = "INSUFFICIENT_LEAVE_BALANCE";
    } else if (error.message.includes("Overlapping leave request")) {
      errorMessage = "Overlapping leave request exists";
      statusCode = 400;
      errorCode = "OVERLAPPING_LEAVE";
    } else if (error.message.includes("Cannot apply leave before join date")) {
      errorMessage = "Cannot apply leave before join date";
      statusCode = 400;
      errorCode = "BEFOREJOINDATE_LEAVE";
    } else if (
      error.message.includes("Cannot apply leave after resignation date")
    ) {
      errorMessage = "Cannot apply leave after resignation date";
      statusCode = 400;
      errorCode = "AFTERRESIGNDATE_LEAVE";
    } else if (
      error.message.includes(
        "Leave cannot be requested more than 3 months in advance"
      )
    ) {
      errorMessage = "Leave cannot be requested more than 3 months in advance";
      statusCode = 400;
      errorCode = "MORETHENADVANCE_LEAVE";
    } else if (error.message.includes("Leave request not found")) {
      errorMessage = "Leave request not found";
      statusCode = 404;
      errorCode = "LEAVE_REQUEST_NOT_FOUND";
    } else if (error.message.includes("Only pending leave requests")) {
      errorMessage = "Only pending leave requests can be canceled";
      statusCode = 400;
      errorCode = "CANNOT_CANCEL_LEAVE";
    }

    return next(
      new AppError(errorMessage, statusCode, {
        errorCode,
        details: error.message,
      })
    );
  }
});

const getLeaveHistory = catchAsync(async (req, res, next) => {
  const empId = req.userId;

  if (!empId) {
    return next(
      new AppError("Employee ID is required", 400, {
        errorCode: "EMPLOYEE_ID_REQUIRED",
        details: "Employee ID is required to fetch leave history",
      })
    );
  }

  try {
    const result = await req.executeQuery("EXEC sp_GetLeaveHistory @empId", {
      empId,
    });

    const balanceQuery = `
      SELECT dbo.CalculateLeaveBalance(@empId) AS available_leave_balance
    `;
    const balanceResult = await req.executeQuery(balanceQuery, { empId });
    const availableLeaveBalance =
      balanceResult.recordset[0].available_leave_balance;

    return sendSuccess(res, {
      data: result.recordsets[0],
      leaveBalance: availableLeaveBalance,
    });
  } catch (error) {
    let errorMessage = "Failed to retrieve leave history";
    let statusCode = 500;
    let errorCode = "LEAVE_HISTORY_ERROR";

    if (error.message.includes("No leave history found")) {
      errorMessage = "No leave history found";
      statusCode = 404;
      errorCode = "LEAVE_HISTORY_NOT_FOUND";
    }

    return next(
      new AppError(errorMessage, statusCode, {
        errorCode,
        details: error.message,
      })
    );
  }
});

module.exports = { leaveRequest, getLeaveHistory };
