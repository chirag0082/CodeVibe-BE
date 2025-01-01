const {
  catchAsync,
  sendSuccess,
  AppError,
} = require("../../../utils/errorHandler");
const {
  validateRegistrationFields,
} = require("../../../utils/validateRegistrationFields");
const bcrypt = require("bcrypt");

const registration = catchAsync(async (req, res, next) => {
  const {
    empId,
    empCode,
    empName,
    birthDate,
    gender,
    education,
    presentAdd,
    permanentAdd,
    experience,
    mobileNo,
    alternetNo,
    emailAdd,
    joinDate,
    resignDate,
    paidLeave,
    panNo,
    panPhoto,
    aadharFront,
    aadharBack,
    aadharNo,
    residentProof,
    userName,
    userPassword,
    empPhoto,
  } = req.body;

  const values = {
    empId,
    empCode,
    empName,
    birthDate,
    gender,
    education,
    presentAdd,
    permanentAdd,
    experience,
    mobileNo,
    alternetNo,
    emailAdd,
    joinDate,
    resignDate,
    paidLeave,
    panNo,
    panPhoto,
    aadharFront,
    aadharBack,
    aadharNo,
    residentProof,
    userName,
    userPassword,
    empPhoto,
  };
  const isUpdateMode = !!empId;
  const validationErrors = validateRegistrationFields(values, isUpdateMode);
  if (validationErrors) {
    return next(
      new AppError("Invalid credentials", 400, {
        errorCode: "INVALID_CREDENTIALS",
        validationErrors: validationErrors,
      })
    );
  }

  if (!isUpdateMode) {
    const checkQuery = `
    SELECT COUNT(*) AS count 
    FROM [dbo].[emp_master] 
    WHERE [user_name] = @userName;
    `;

    const checkResult = await req.executeQuery(checkQuery, { userName });
    if (checkResult.recordset[0].count > 0) {
      return next(
        new AppError(
          "Username already exists. Please choose a different one.",
          400,
          {
            errorCode: "USERNAME_EXISTS",
          }
        )
      );
    }
  }

  if (isUpdateMode) {
    const updateQuery = `
    UPDATE [dbo].[emp_master] 
    SET 
      [emp_code] = @empCode,
      [emp_name] = @empName,
      [birth_date] = @birthDate,
      [gender] = @gender,
      [education] = @education,
      [present_add] = @presentAdd,
      [permanent_add] = @permanentAdd,
      [experience] = @experience,
      [mobile_no] = @mobileNo,
      [alternet_no] = @alternetNo,
      [email_add] = @emailAdd,
      [join_date] = @joinDate,
      [paid_leave] = @paidLeave,
      [pan_no] = @panNo,
      [pan_photo] = @panPhoto,
      [aadhar_front] = @aadharFront,
      [aadhar_back] = @aadharBack,
      [aadhar_no] = @aadharNo,
      [resident_proof] = @residentProof,
      [emp_photo] = @empPhoto 
    WHERE [emp_id] = @empId
    `;

    const result = await req.executeQuery(updateQuery, {
      empId,
      empCode,
      empName,
      birthDate,
      gender,
      education,
      presentAdd,
      permanentAdd,
      experience,
      mobileNo,
      alternetNo,
      emailAdd,
      joinDate,
      paidLeave,
      panNo,
      panPhoto,
      aadharFront,
      aadharBack,
      aadharNo,
      residentProof,
      empPhoto,
    });

    return sendSuccess(
      res,
      { data: result.recordset },
      "Employee Updated Successfully"
    );
  } else {
    if (!userName || !userPassword) {
      return next(
        new AppError(
          "Username and Password are required for registration.",
          400,
          {
            errorCode: "MISSING_CREDENTIALS",
          }
        )
      );
    }

    const checkQuery = `
    SELECT COUNT(*) AS count 
    FROM [dbo].[emp_master] 
    WHERE [user_name] = @userName;
    `;

    const checkResult = await req.executeQuery(checkQuery, { userName });
    if (checkResult.recordset[0].count > 0) {
      return next(
        new AppError(
          "Username already exists. Please choose a different one.",
          400,
          { errorCode: "USERNAME_EXISTS" }
        )
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(userPassword, 10);

    const registrationQuery = `
    DECLARE @resignDate DATE = NULL;
    
    INSERT INTO [dbo].[emp_master] (
      [emp_code], [emp_name], [birth_date], [gender], [education], [present_add],
      [permanent_add], [experience], [mobile_no], [alternet_no], [email_add], [join_date],
       [paid_leave], [pan_no], [pan_photo], [aadhar_front], [aadhar_back],
      [aadhar_no], [resident_proof], [user_name], [user_password], [emp_photo]
    )
    VALUES (
      @empCode, @empName, @birthDate, @gender, @education, @presentAdd, @permanentAdd,
      @experience, @mobileNo, @alternetNo, @emailAdd, @joinDate, 
      CASE WHEN @resignDate IS NULL THEN NULL ELSE @resignDate END,  
      @paidLeave, @panNo, @panPhoto, @aadharFront, @aadharBack, 
      @aadharNo, @residentProof, @userName, @userPassword, @empPhoto
    );
  
    SELECT SCOPE_IDENTITY() AS emp_id;
  `;

    const result = await req.executeQuery(registrationQuery, {
      empCode,
      empName,
      birthDate,
      gender,
      education,
      presentAdd,
      permanentAdd,
      experience,
      mobileNo,
      alternetNo,
      emailAdd,
      joinDate,
      paidLeave,
      panNo,
      panPhoto,
      aadharFront,
      aadharBack,
      aadharNo,
      residentProof,
      userName,
      userPassword: hashedPassword,
      empPhoto,
    });

    return sendSuccess(
      res,
      { data: result.recordset },
      "Employee Registered Successfully"
    );
  }
});

const getAllEmploy = catchAsync(async (req, res, next) => {
  let { page = 1, limit = 10 } = req.query;

  page = parseInt(page, 10);
  limit = parseInt(limit, 10);

  if (isNaN(page) || isNaN(limit)) {
    return next(new AppError("Invalid page or limit values", 400));
  }

  const offset = (page - 1) * limit;

  const countQuery = `
    SELECT COUNT(*) AS totalCount
    FROM [dbo].[emp_master];
  `;

  const resultCount = await req.executeQuery(countQuery);
  const totalCount = resultCount.recordset[0].totalCount;
  const totalPages = Math.ceil(totalCount / limit);

  const query = `
    EXEC [dbo].[GetEmployeesPaginated] @offset = @offset, @limit = @limit
  `;

  const result = await req.executeQuery(query, {
    offset,
    limit,
  });
  sendSuccess(
    res,
    {
      data: result.recordset,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        pageSize: limit,
      },
    },
    "Employee List Retrieved Successfully"
  );
});

const getAllEmployName = catchAsync(async (req, res, next) => {
  const query = `
    SELECT emp_id,emp_name FROM [dbo].[emp_master];
  `;

  const result = await req.executeQuery(query);
  sendSuccess(
    res,
    {
      data: result.recordset,
    },
    "Employee List Retrieved Successfully"
  );
});

const empResign = catchAsync(async (req, res, next) => {
  const { resignDate, empId } = req.body;

  if (empId === undefined || empId === null) {
    return next(
      new AppError("Employee ID is required.", 400, {
        errorCode: "MISSING_FIELDS",
      })
    );
  }

  const updateQuery = `
    UPDATE [dbo].[emp_master] 
    SET [resign_date] = @resignDate
    WHERE [emp_id] = @empId;
  `;

  const result = await req.executeQuery(updateQuery, {
    resignDate: resignDate || null,
    empId,
  });

  if (result.rowsAffected[0] === 0) {
    return next(
      new AppError("Failed to update resignation. Employee not found.", 404, {
        errorCode: "EMPLOYEE_NOT_FOUND",
      })
    );
  }

  return sendSuccess(res, null, "Employee resignation updated successfully.");
});

const empResignNull = catchAsync(async (req, res, next) => {
  const { empId } = req.body;

  if (empId === undefined || empId === null) {
    return next(
      new AppError("Employee ID is required.", 400, {
        errorCode: "MISSING_FIELDS",
      })
    );
  }

  const updateQuery = `
    UPDATE [dbo].[emp_master] 
    SET [resign_date] = NULL
    WHERE [emp_id] = @empId;
  `;

  const result = await req.executeQuery(updateQuery, {
    empId,
  });

  if (result.rowsAffected[0] === 0) {
    return next(
      new AppError("Failed to update resignation. Employee not found.", 404, {
        errorCode: "EMPLOYEE_NOT_FOUND",
      })
    );
  }

  return sendSuccess(res, null, "Employee resignation updated successfully.");
});

module.exports = {
  registration,
  getAllEmploy,
  empResign,
  empResignNull,
  getAllEmployName,
};
