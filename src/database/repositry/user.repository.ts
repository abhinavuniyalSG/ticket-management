import { AppDataSource } from "../dbConnection.js";
import { User } from "../models/user.model.js";
import { Contact } from "../models/contact.model.js";
import type { ContactType } from "../../types/contact.js";
import { roleEnum } from "../../types/user.js";

export class UserRepository {
  public static repository = AppDataSource.getRepository(User);

  public static async findByEmail(email: string): Promise<User | null> {
    return this.repository
      .createQueryBuilder("user")
      .where("user.email = :email", { email })
      .addSelect("user.password")
      .getOne();
  }

  public static async findByIdWithRefreshToken(
    id: string,
  ): Promise<User | null> {
    return this.repository
      .createQueryBuilder("user")
      .where("user.id = :id", { id })
      .addSelect("user.refreshToken")
      .getOne();
  }

  public static async findAll(filter?: {
    departmentId?: string | null;
  }): Promise<User[]> {
    const query = this.repository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.department", "department")
      .leftJoinAndSelect("user.contacts", "contacts");

    if (filter?.departmentId !== undefined) {
      if (filter.departmentId === null) {
        query.where("user.departmentId IS NULL");
      } else {
        query.where("user.departmentId = :departmentId", {
          departmentId: filter.departmentId,
        });
      }
    }

    return query.getMany();
  }

  public static async findById(id: string): Promise<User | null> {
    return this.repository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.department", "department")
      .leftJoinAndSelect("user.contacts", "contacts")
      .where("user.id = :id", { id })
      .getOne();
  }

  public static async findByRole(role: roleEnum): Promise<User[]> {
    return this.repository
      .createQueryBuilder("user")
      .where("user.role = :role", { role })
      .getMany();
  }

  public static async findByRoleAndDepartment(
    role: roleEnum,
    departmentId: string,
  ): Promise<User[]> {
    return this.repository
      .createQueryBuilder("user")
      .where("user.role = :role", { role })
      .andWhere("user.departmentId = :departmentId", { departmentId })
      .getMany();
  }

  public static async createUser(userDetails: Partial<User>): Promise<User> {
    const user = this.repository.create(userDetails);
    return this.repository.save(user);
  }

  public static async updateRefreshToken(
    id: string,
    refreshToken: string | null,
  ): Promise<void> {
    await this.repository.update(id, { refreshToken });
  }

  public static async updateUserWithContacts(
    id: string,
    userUpdates: Partial<User>,
    contacts?: Array<{ contactType: ContactType; contactDetail: string }>,
  ): Promise<User | null> {
    return await AppDataSource.transaction(
      async (transactionalEntityManager) => {
        if (Object.keys(userUpdates).length > 0) {
          await transactionalEntityManager.update(User, id, userUpdates);
        }

        if (contacts !== undefined) {
          await transactionalEntityManager.delete(Contact, { userId: id });
          if (contacts.length > 0) {
            const contactEntities = contacts.map((c) =>
              transactionalEntityManager.create(Contact, {
                userId: id,
                contactType: c.contactType,
                contactDetail: c.contactDetail,
              }),
            );
            await transactionalEntityManager.save(Contact, contactEntities);
          }
        }

        return transactionalEntityManager
          .createQueryBuilder(User, "user")
          .leftJoinAndSelect("user.department", "department")
          .leftJoinAndSelect("user.contacts", "contacts")
          .where("user.id = :id", { id })
          .getOne();
      },
    );
  }

  public static async deleteUser(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
