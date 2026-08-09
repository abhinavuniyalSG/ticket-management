import {
  createDepartment,
  deleteDepartment,
  getAllDepartments,
  getDepartment,
  updateDepartment,
} from "../services/department.service.js";

const getAllDepartmentController = async (req, res, next) => {
  try {
    const departments = await getAllDepartments();

    return res.status(200).json({
      message: "Departments fetched successfully.",
      departments,
    });
  } catch (e) {
    return next(e);
  }
};
const createDepartmentController = async (req, res, next) => {
  try {
    const { department_name } = req.body;

    if (!department_name) {
      return res.status(400).json({
        message: "Department name is required.",
      });
    }

    const result = await createDepartment(department_name);

    return res.status(201).json({
      message: "Department created successfully.",
      departmentId: result.insertId,
    });
  } catch (e) {
    return next(e);
  }
};
const getDepartmentController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const department = await getDepartment(id);

    return res.status(200).json({
      message: "Department fetched successfully.",
      department,
    });
  } catch (e) {
    return next(e);
  }
};

const updateDepartmentController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { department_name } = req.body;

    if (!department_name) {
      return res.status(400).json({
        message: "Department name is required.",
      });
    }

    await updateDepartment(id, department_name);

    return res.status(200).json({
      message: "Department updated successfully.",
    });
  } catch (e) {
    return next(e);
  }
};

const deleteDepartmentController = async (req, res, next) => {
  try {
    const { id } = req.params;

    await deleteDepartment(id);

    return res.status(200).json({
      message: "Department deleted successfully.",
    });
  } catch (e) {
    return next(e);
  }
};

export {
  getAllDepartmentController,
  createDepartmentController,
  getDepartmentController,
  updateDepartmentController,
  deleteDepartmentController,
};
