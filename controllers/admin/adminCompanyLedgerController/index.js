const {
  catchAsync,
  AppError,
  sendSuccess,
} = require("../../../utils/errorHandler");

const getAllLedger = catchAsync(async (req, res, next) => {
  const { transType, page = 1, pageSize = 10 } = req.query;

  try {
    const result = await req.executeQuery(
      "EXEC sp_GetAllLedger @transType, @page, @pageSize",
      {
        transType: transType || "",
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
      }
    );

    const records = result.recordsets[0];
    const totalRecords = result.recordsets[1][0].total;

    return sendSuccess(
      res,
      {
        data: records,
        pagination: {
          totalRecords,
          currentPage: parseInt(page, 10),
          totalPages: Math.ceil(totalRecords / parseInt(pageSize, 10)),
          pageSize: parseInt(pageSize, 10),
        },
      },
      records.length
        ? "Ledger entries fetched successfully."
        : "No ledger entries found."
    );
  } catch (error) {
    console.error("Error fetching ledger data: ", error);
    return next(
      new AppError("Failed to fetch ledger data.", 500, {
        errorCode: "DB_FETCH_ERROR",
        details: error.message,
      })
    );
  }
});

const createOrUpdateLedger = catchAsync(async (req, res, next) => {
  const { id, transDate, transType, amount, remarks, transMode } = req.body;

  if (!transDate || !transType || !amount) {
    return next(
      new AppError(
        "Fields 'transDate', 'transType', and 'amount' are required.",
        400
      )
    );
  }

  try {
    const result = await req.executeQuery(
      "EXEC sp_CreateOrUpdateLedger @id, @transDate, @transType, @amount, @remarks, @transMode",
      {
        id: id ? parseInt(id, 10) : 0,
        transDate,
        transType,
        amount: parseFloat(amount),
        remarks: remarks || null,
        transMode: transMode || null,
      }
    );

    const successMessage = id
      ? "Ledger entry updated successfully."
      : "Ledger entry created successfully.";

    return sendSuccess(
      res,
      id ? {} : { id: result.recordset[0].id },
      successMessage
    );
  } catch (error) {
    if (error.message.includes("Ledger entry not found")) {
      return next(
        new AppError("Failed to update ledger entry. Entry may not exist.", 404)
      );
    }
    console.error("Error creating/updating ledger entry: ", error);
    return next(
      new AppError("Failed to create or update ledger entry.", 500, {
        errorCode: "DB_OPERATION_ERROR",
        details: error.message,
      })
    );
  }
});

const deleteLedger = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(
      new AppError("No Ledger ID provided", 400, {
        errorCode: "LEDGER_ID_NOT_FOUND",
      })
    );
  }

  try {
    await req.executeQuery("EXEC sp_DeleteLedger @id", { id });
    return sendSuccess(res, {}, "Ledger deleted successfully.");
  } catch (error) {
    if (error.message.includes("Ledger entry not found")) {
      return next(
        new AppError("No Ledger found with the provided ID", 404, {
          errorCode: "LEDGER_NOT_FOUND",
        })
      );
    }
    console.error("Error deleting Ledger: ", error);
    return next(
      new AppError("Failed to delete Ledger", 500, {
        errorCode: "DB_DELETE_ERROR",
        details: error.message,
      })
    );
  }
});

const getMonthlyReport = catchAsync(async (req, res, next) => {
  try {
    const year = req.params.year;
    const result = await req.executeQuery("EXEC sp_GetMonthlyReport @year", {
      year: parseInt(year, 10),
    });

    // Calculate running balance
    let runningBalance = 0;
    const formattedReport = result.recordset.map((row) => {
      runningBalance += row.balance;
      return {
        month: row.month,
        in_amount: row.in_amount.toFixed(2),
        out_amount: row.out_amount.toFixed(2),
        balance: runningBalance.toFixed(2),
      };
    });

    // Calculate totals
    const totals = {
      total_in: result.recordset
        .reduce((sum, row) => sum + row.in_amount, 0)
        .toFixed(2),
      total_out: result.recordset
        .reduce((sum, row) => sum + row.out_amount, 0)
        .toFixed(2),
      net_balance: runningBalance.toFixed(2),
    };

    return sendSuccess(
      res,
      { year: year, monthly_data: formattedReport, totals: totals },
      "Monthly Ledger fetch successfully."
    );
  } catch (err) {
    console.error(err);
    return next(
      new AppError("Failed to fetch Monthly Ledger.", 500, {
        errorCode: "DB_OPERATION_ERROR",
        details: err.message,
      })
    );
  }
});

const getYearlyReport = catchAsync(async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const start = new Date(startDate);
    const end = new Date(endDate);

    const result = await req.executeQuery(
      "EXEC sp_GetYearlyReport @startDate, @endDate",
      {
        startDate: start,
        endDate: end,
      }
    );

    // Format the report data
    const formattedReport = result.recordset.map((row) => ({
      year: row.year,
      income: row.income,
      expenses: row.expenses,
      balance: row.balance,
    }));

    // Calculate totals
    const totals = {
      total_income: result.recordset.reduce((sum, row) => sum + row.income, 0),
      total_expenses: result.recordset.reduce(
        (sum, row) => sum + row.expenses,
        0
      ),
      net_balance: result.recordset.reduce((sum, row) => sum + row.balance, 0),
      period: `${start.getFullYear()} to ${end.getFullYear()}`,
    };

    return sendSuccess(
      res,
      {
        date_range: {
          start: start.getFullYear(),
          end: end.getFullYear(),
        },
        yearly_data: formattedReport,
        totals: totals,
      },
      "Yearly Ledger fetch successfully."
    );
  } catch (err) {
    console.error(err);
    return next(
      new AppError("Please provide dates in YYYY-MM-DD format.", 500, {
        errorCode: "DB_OPERATION_ERROR",
        details: err.message,
      })
    );
  }
});

const getDailyReport = catchAsync(async (req, res, next) => {
  try {
    const { startDate, endDate, page = 1, pageSize = 10 } = req.query;

    // Input validation
    if (!startDate || !endDate) {
      return next(
        new AppError("Start date and end date are required", 400, {
          errorCode: "VALIDATION_ERROR",
        })
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return next(
        new AppError("Invalid date format. Please use YYYY-MM-DD", 400, {
          errorCode: "VALIDATION_ERROR",
        })
      );
    }

    // Direct execution of the stored procedure
    const result = await req.executeQuery(
      `EXEC sp_GetFinanceReport @startDate = @startDate, @toDate = @endDate;`,
      {
        startDate: start,
        endDate: end,
      }
    );

    // Handle pagination in JavaScript since the SP already returns sorted data
    const totalCount = result.recordset.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedRecords = result.recordset.slice(startIndex, endIndex);
    const totalPages = Math.ceil(totalCount / pageSize);

    const transactions = paginatedRecords.map((row) => ({
      date: row.TransactionDate,
      type: row.TransactionType,
      amount: row.Amount,
      opening_balance: row.OpeningBalance,
      closing_balance: row.ClosingBalance,
      remark: row.Remark,
      payment_mode: row.PaymentMode,
    }));

    return res.status(200).json({
      status: "success",
      message: "Daily financial report fetched successfully",
      data: {
        date_range: {
          start: startDate,
          end: endDate,
        },
        pagination: {
          current_page: parseInt(page),
          page_size: parseInt(pageSize),
          total_pages: totalPages,
          total_records: totalCount,
        },
        transactions,
      },
    });
  } catch (err) {
    console.error("Daily Report Error:", err);
    return next(
      new AppError("Error generating daily report", 500, {
        errorCode: "DB_OPERATION_ERROR",
        details: err.message,
      })
    );
  }
});

module.exports = {
  getAllLedger,
  createOrUpdateLedger,
  deleteLedger,
  getMonthlyReport,
  getYearlyReport,
  getDailyReport,
};
