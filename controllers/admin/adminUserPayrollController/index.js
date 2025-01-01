const {
  AppError,
  catchAsync,
  sendSuccess,
} = require("../../../utils/errorHandler");

const getAllUserPayrollController = catchAsync(async (req, res, next) => {
  const { month } = req.query;

  if (!month) {
    return next(
      new AppError("Salary month is required", 400, {
        errorCode: "SALARY_MONTH_REQUIRED",
      })
    );
  }

  try {
    const calculationResult = await req.executeQuery(
      `EXEC dbo.emp_sal_calculation @sal_month = @month`,
      { month }
    );
    if (!calculationResult.recordset.length) {
      return next(
        new AppError("No payroll data found for the given month", 404, {
          errorCode: "NO_PAYROLL_DATA",
        })
      );
    }

    // Add default values for deduction and net_salary in the calculation result
    const dataWithDefaults = calculationResult.recordset.map((record) => {
      const workDays = record.PaidDays - record.Paidleave;
      const deduction = 0;
      const netSalary = record.GrossSal - deduction;
      return {
        emp_id: record.emp_id,
        emp_name: record.emp_name,
        salary_month: month,
        month_days: record.MonthDays,
        work_days: workDays,
        paid_leave: record.Paidleave,
        unpaid_days: record.UnPaidDays,
        paid_days: record.PaidDays,
        salary: record.salary,
        gross_salary: record.GrossSal,
        deduction: deduction,
        net_salary: netSalary,
      };
    });

    return sendSuccess(
      res,
      { data: dataWithDefaults },
      "Preliminary payroll data calculated successfully."
    );
  } catch (error) {
    console.error("Error in payroll processing:", error);
    return next(
      new AppError("Failed to process payroll data", 500, {
        errorCode: "PAYROLL_PROCESSING_ERROR",
        details: error.message,
      })
    );
  }
});

const calculatePayroll = catchAsync(async (req, res, next) => {
  const { salaryMonth } = req.body;

  if (!salaryMonth) {
    return next(
      new AppError("Salary month is required", 400, {
        errorCode: "SALARY_MONTH_REQUIRED",
      })
    );
  }

  try {
    // Check if payroll already exists for this month
    const deleteQuery = `
      DELETE FROM [dbo].[emp_payroll]
      WHERE salary_month = @salaryMonth
    `;

    await req.executeQuery(deleteQuery, { salaryMonth });

    // Calculate payroll data
    const calculationResult = await req.executeQuery(
      `EXEC dbo.emp_sal_calculation @sal_month = @month`,
      { month: salaryMonth }
    );

    if (!calculationResult.recordset.length) {
      return next(
        new AppError("No payroll data found for the given month", 404, {
          errorCode: "NO_PAYROLL_DATA",
        })
      );
    }

    // Insert calculated payroll data
    for (const record of calculationResult.recordset) {
      // Calculate derived values
      const workDays = record.PaidDays - record.Paidleave;
      const deduction = 0; // Could be calculated based on business rules
      const netSalary = record.GrossSal - deduction;

      // Execute stored procedure for each record
      const query = `
        EXEC [dbo].[InsertEmployeePayroll]
          @emp_id = @emp_id,
          @salary_month = @salary_month,
          @month_days = @month_days,
          @work_days = @work_days,
          @paid_leave = @paid_leave,
          @unpaid_days = @unpaid_days,
          @paid_days = @paid_days,
          @salary = @salary,
          @gross_salary = @gross_salary,
          @deduction = @deduction,
          @net_salary = @net_salary
      `;

      const insertParams = {
        emp_id: record.emp_id,
        salary_month: salaryMonth,
        month_days: record.MonthDays,
        work_days: workDays,
        paid_leave: record.Paidleave,
        unpaid_days: record.UnPaidDays,
        paid_days: record.PaidDays,
        salary: record.salary,
        gross_salary: record.GrossSal,
        deduction: deduction,
        net_salary: netSalary,
      };

      const result = await req.executeQuery(query, insertParams);
    }

    return sendSuccess(res, {}, "Payroll entries created successfully.");
  } catch (error) {
    console.error("Error creating payroll entries:", error);
    return next(
      new AppError("Failed to create payroll entries", 500, {
        errorCode: "DB_CREATE_ERROR",
        details: error.message,
      })
    );
  }
});

module.exports = {
  getAllUserPayrollController,
  calculatePayroll,
};
