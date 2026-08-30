import { AppDataSource } from "../dbConnection.js";
import { Contact } from "../models/contact.model.js";
import type { ContactType } from "../../types/contact.js";

export class ContactRepository {
  public static repository = AppDataSource.getRepository(Contact);

  public static async createContact(
    userId: string,
    contactType: ContactType,
    contactDetail: string,
  ): Promise<Contact> {
    const contact = this.repository.create({
      userId,
      contactType,
      contactDetail,
    });
    return await this.repository.save(contact);
  }

  public static async findById(id: string): Promise<Contact | null> {
    return await this.repository.findOne({ where: { id } });
  }

  public static async findByTypeAndDetail(
    contactType: ContactType,
    contactDetail: string,
  ): Promise<Contact | null> {
    return await this.repository.findOne({
      where: { contactType, contactDetail },
    });
  }

  public static async updateContact(
    id: string,
    updates: Partial<Contact>,
  ): Promise<Contact | null> {
    await this.repository.update(id, updates);
    return await this.findById(id);
  }

  public static async deleteContact(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
