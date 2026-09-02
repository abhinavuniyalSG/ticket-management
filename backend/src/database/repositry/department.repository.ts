import { AppDataSource } from "../dbConnection.js";
import { Department } from "../models/department.model.js";

export interface DepartmentFilterOptions {
  departmentName?: string | undefined;
}

export class DepartmentRepository {
  private static repository = AppDataSource.getRepository(Department);

  public static async findAll(
    filter?: DepartmentFilterOptions,
  ): Promise<Department[]> {
    const query = this.repository
      .createQueryBuilder("department")
      .leftJoinAndSelect("department.manager", "manager");

    if (filter?.departmentName) {
      query.andWhere("department.departmentName ILIKE :departmentName", {
        departmentName: `%${filter.departmentName}%`,
      });
    }

    return query.getMany();
  }

  public static async findById(id: string): Promise<Department | null> {
    return this.repository
      .createQueryBuilder("department")
      .leftJoinAndSelect("department.manager", "manager")
      .where("department.departmentId = :id", { id })
      .getOne();
  }

  public static async findByName(name: string): Promise<Department | null> {
    return this.repository
      .createQueryBuilder("department")
      .where("department.departmentName = :name", { name })
      .getOne();
  }

  public static async findByEmail(email: string): Promise<Department | null> {
    return this.repository
      .createQueryBuilder("department")
      .where("department.departmentEmail = :email", { email })
      .getOne();
  }

  public static async createDepartment(
    data: Partial<Department>,
  ): Promise<Department> {
    const department = this.repository.create(data);
    return this.repository.save(department);
  }

  public static async updateDepartment(
    id: string,
    data: Partial<Department>,
  ): Promise<Department | null> {
    await this.repository.update({ departmentId: id }, data);
    return this.findById(id);
  }

  public static async deleteDepartment(id: string): Promise<boolean> {
    const result = await this.repository.delete({ departmentId: id });
    return (result.affected ?? 0) > 0;
  }
}
