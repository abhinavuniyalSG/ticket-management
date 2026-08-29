import { AppDataSource } from "../dbConnection.js";
import { User } from "../models/user.model.js";
import type { RegisterInput } from "../../services/authentication.service.js";

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
}
