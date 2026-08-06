import {
  createDepartment,
  deleteDepartment,
  getAllDepartments,
  getDepartment,
  updateDepartment,
} from "../models/department.model.js";

const getAllDepartmentController = async (req, res) => {
  try {
    const departments = await getAllDepartments();

    return res.status(200).json({
      message: "Departments fetched successfully.",
      departments,
    });
  } catch (e) {
    console.error(e);

    return res.status(e.status || 500).json({
      message: e.message || "Internal server error.",
    });
  }
};
const createDepartmentController = async (req, res) => {
  try {
    const { department_name } = req.body;

    if (!department_name) {
      return res.status(400).json({
        message: "Department name is required.",
      });
    }

    const result = await createDepartment(department_name.trim());

    return res.status(201).json({
      message: "Department created successfully.",
      departmentId: result.insertId,
    });
  } catch (e) {
    console.error(e);

    return res.status(e.status || 500).json({
      message: e.message || "Internal server error.",
    });
  }
};
const getDepartmentController = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await getDepartment(id);

    return res.status(200).json({
      message: "Department fetched successfully.",
      department,
    });
  } catch (e) {
    console.error(e);

    return res.status(e.status || 500).json({
      message: e.message || "Internal server error.",
    });
  }
};

const updateDepartmentController = async (req, res) => {
  try {
    const { id } = req.params;
    const { department_name } = req.body;

    if (!department_name) {
      return res.status(400).json({
        message: "Department name is required.",
      });
    }

    await updateDepartment(id, department_name.trim());

    return res.status(200).json({
      message: "Department updated successfully.",
    });
  } catch (e) {
    console.error(e);

    return res.status(e.status || 500).json({
      message: e.message || "Internal server error.",
    });
  }
};

const deleteDepartmentController = async (req, res) => {
  try {
    const { id } = req.params;

    await deleteDepartment(id);

    return res.status(200).json({
      message: "Department deleted successfully.",
    });
  } catch (e) {
    console.error(e);

    return res.status(e.status || 500).json({
      message: e.message || "Internal server error.",
    });
  }
};

export {
  getAllDepartmentController,
  createDepartmentController,
  getDepartmentController,
  updateDepartmentController,
  deleteDepartmentController,
};
