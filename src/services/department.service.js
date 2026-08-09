import * as departmentRepository from "../repositories/department.repository.js";

const getAllDepartments = async () => {
  try {
    return await departmentRepository.findAll();
  } catch (e) {
    const error = new Error("Failed to fetch departments.");
    error.status = 500;
    throw error;
  }
};

const getDepartment = async (id) => {
  const department = await departmentRepository.findById(id);
  if (!department) {
    const error = new Error("Department not found.");
    error.status = 404;
    throw error;
  }
  return department;
};

const createDepartment = async (departmentName) => {
  const normalizedDepartmentName = departmentName.trim();
  const departments = await departmentRepository.findByName(
    normalizedDepartmentName,
  );
  if (departments.length > 0) {
    const error = new Error("Department already exists.");
    error.status = 409;
    throw error;
  }
  return departmentRepository.create(normalizedDepartmentName);
};

const updateDepartment = async (id, departmentName) => {
  const normalizedDepartmentName = departmentName.trim();
  await getDepartment(id);
  const duplicate = await departmentRepository.findByName(
    normalizedDepartmentName,
    id,
  );
  if (duplicate.length > 0) {
    const error = new Error("Department already exists.");
    error.status = 409;
    throw error;
  }
  return departmentRepository.update(id, normalizedDepartmentName);
};

const deleteDepartment = async (id) => {
  await getDepartment(id);
  if ((await departmentRepository.countUsers(id)) > 0) {
    const error = new Error(
      "Cannot delete department. Users are assigned to it.",
    );
    error.status = 409;
    throw error;
  }
  if ((await departmentRepository.countTickets(id)) > 0) {
    const error = new Error(
      "Cannot delete department. Tickets are assigned to it.",
    );
    error.status = 409;
    throw error;
  }
  return departmentRepository.remove(id);
};

export {
  getAllDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
