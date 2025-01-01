const {
  catchAsync,
  sendSuccess,
  AppError,
} = require("../../../utils/errorHandler");

const getAllUserSalary = catchAsync(async (req, res, next) => {
  const result = await req.executeQuery(`SELECT * FROM [emp_salary]`);

  if (!result.recordset || result.recordset.length === 0) {
    return next(new AppError("No salaries found.", 404));
  }

  sendSuccess(
    res,
    { data: result.recordset },
    "Salaries fetched successfully."
  );
});

const getAllUserSalaryByUserId = catchAsync(async (req, res, next) => {
  let { userId } = req.params;

  if (!userId) {
    return next(new AppError("User ID is required.", 400));
  }

  userId = parseInt(userId, 10);

  if (isNaN(userId)) {
    return next(new AppError("User ID must be a valid number.", 400));
  }

  const result = await req.executeQuery(
    `SELECT * FROM [emp_salary] WHERE emp_id = @userId`,
    {
      userId,
    }
  );

  sendSuccess(
    res,
    { data: result.recordset },
    "User salaries fetched successfully."
  );
});

const getAllUserSalaryBySalaryId = catchAsync(async (req, res, next) => {
  const { salaryId } = req.params;

  if (!salaryId) {
    return next(new AppError("Salary ID is required.", 400));
  }

  const result = await req.executeQuery(
    `SELECT * FROM [emp_salary] WHERE salary_id = @salaryId`,
    { salaryId }
  );

  if (!result.recordset || result.recordset.length === 0) {
    return next(new AppError("No salary found for the given salary ID.", 404));
  }

  sendSuccess(
    res,
    { data: result.recordset },
    "Salary details fetched successfully."
  );
});

const createOrUpdateUserSalary = catchAsync(async (req, res, next) => {
  const { salaryId, empId, salary, effectiveDate } = req.body;

  if (!empId || !salary || !effectiveDate) {
    return next(
      new AppError(
        "All fields (empId, salary, effectiveDate) are required.",
        400
      )
    );
  }

  const parsedEmpId = parseInt(empId, 10);
  const parsedSalary = parseInt(salary);

  if (isNaN(parsedEmpId)) {
    return next(new AppError("Invalid employee ID.", 400));
  }
  if (isNaN(parsedSalary)) {
    return next(new AppError("Invalid salary amount.", 400));
  }

  if (salaryId) {
    const parsedSalaryId = parseInt(salaryId, 10);
    if (isNaN(parsedSalaryId)) {
      return next(new AppError("Invalid salary ID.", 400));
    }

    const query = `
    EXEC [dbo].[UpdateEmployeeSalary]
      @salaryId = @salaryId,
      @empId = @empId,
      @salary = @salary,
      @effectiveDate = @effectiveDate
  `;

    const updateResult = await req.executeQuery(query, {
      salaryId: parsedSalaryId,
      empId: parsedEmpId,
      salary: parsedSalary,
      effectiveDate: effectiveDate,
    });

    if (updateResult.rowsAffected[0] === 0) {
      return next(new AppError("Failed to update salary entry.", 500));
    }

    return sendSuccess(res, {}, "Salary entry updated successfully.");
  } else {
    const query = `
      EXEC [dbo].[InsertEmployeeSalary]
        @empId = @empId,
        @salary = @salary,
        @effectiveDate = @effectiveDate
    `;

    const insertResult = await req.executeQuery(query, {
      empId: parsedEmpId,
      salary: parsedSalary,
      effectiveDate: effectiveDate,
    });

    if (insertResult.rowsAffected[0] === 0) {
      return next(new AppError("Failed to create salary entry.", 500));
    }

    sendSuccess(res, {}, "Salary entry created successfully.");
  }
});

const deleteSalaryBySalaryId = catchAsync(async (req, res, next) => {
  const { salaryId } = req.params;

  if (!salaryId) {
    return next(
      new AppError("No salary ID provided", 400, {
        errorCode: "SALARY_ID_NOT_FOUND",
      })
    );
  }
  const deleteQuery = `DELETE FROM [dbo].[emp_salary] WHERE salary_id = @salaryId`;

  try {
    const result = await req.executeQuery(deleteQuery, { salaryId });

    if (result.rowsAffected === 0) {
      return next(
        new AppError("No salary found with the provided ID", 404, {
          errorCode: "SALARY_NOT_FOUND",
        })
      );
    }

    return sendSuccess(res, {}, "Salary deleted successfully.");
  } catch (error) {
    console.error("Error deleting salary request: ", error);
    return next(
      new AppError("Failed to delete salary", 500, {
        errorCode: "DB_DELETE_ERROR",
        details: error.message,
      })
    );
  }
});

module.exports = {
  getAllUserSalary,
  getAllUserSalaryByUserId,
  getAllUserSalaryBySalaryId,
  createOrUpdateUserSalary,
  deleteSalaryBySalaryId,
};
