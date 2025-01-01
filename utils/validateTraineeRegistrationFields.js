const validateRegistrationFields = (fields, isUpdateMode) => {
  const errors = [];

  if (!fields.traineeName || fields.traineeName.trim() === "") {
    errors.push("Trainee Name is required.");
  }

  if (!fields.birthDate || isNaN(new Date(fields.birthDate).getTime())) {
    errors.push("Invalid birth date.");
  }

  const validGenders = ["Male", "Female", "male", "female"];
  if (!fields.gender || !validGenders.includes(fields.gender)) {
    errors.push("Gender must be 'Male' or 'Female'.");
  }

  if (!fields.education || fields.education.trim() === "") {
    errors.push("Education is required.");
  }

  if (!fields.presentAdd || fields.presentAdd.trim() === "") {
    errors.push("Present address is required.");
  }

  if (!fields.permanentAdd || fields.permanentAdd.trim() === "") {
    errors.push("Permanent address is required.");
  }

  if (!fields.experience || fields.experience.trim() === "") {
    errors.push("Experience is required.");
  }

  const mobilePattern = /^[0-9]{10}$/;
  if (!fields.mobileNo || !mobilePattern.test(fields.mobileNo)) {
    errors.push("Mobile number must be a 10-digit number.");
  }

  if (fields.alternetNo && !mobilePattern.test(fields.alternetNo)) {
    errors.push("Alternate mobile number must be a 10-digit number.");
  }

  const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  if (!fields.emailAdd || !emailPattern.test(fields.emailAdd)) {
    errors.push("Invalid email address.");
  }

  if (!fields.joinDate || isNaN(new Date(fields.joinDate).getTime())) {
    errors.push("Invalid join date.");
  }

  if (fields.resignDate && isNaN(new Date(fields.resignDate).getTime())) {
    errors.push("Invalid resignation date.");
  }

  const aadharPattern = /^[2-9]{1}[0-9]{11}$/;
  if (fields.aadharNo && !aadharPattern.test(fields.aadharNo)) {
    errors.push("Invalid Aadhar number format.");
  }

  const urlPattern = /^(https?:\/\/[^\s$.?#].[^\s]*)$/;
  const files = [
    { field: "aadharFront", label: "Aadhar front photo" },
    { field: "aadharBack", label: "Aadhar back photo" },
    { field: "residentProof", label: "Resident proof photo" },
  ];
  
  files.forEach((file) => {
    if (!fields[file.field] || !urlPattern.test(fields[file.field])) {
      errors.push(`${file.label} must be a valid URL.`);
    }
  });

  if (errors.length > 0) {
    return errors;
  }

  return null;
};

module.exports = {
  validateRegistrationFields,
};
