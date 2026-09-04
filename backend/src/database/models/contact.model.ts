import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  type Relation,
} from "typeorm";
import { User } from "./user.model.js";
import { ContactType } from "../../types/contact.js";

@Entity()
@Unique(["contactType", "contactDetail"])
export class Contact {
  @PrimaryColumn({ type: "uuid", default: () => "uuidv7()" })
  id!: string;

  @Index("IDX_contact_user_id")
  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @ManyToOne(() => User, (user) => user.contacts, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user!: Relation<User>;

  @Column({ name: "contact_type", type: "enum", enum: ContactType })
  contactType!: ContactType;

  @Column({
    name: "contact_detail",
    type: "varchar",
    length: 500,
  })
  contactDetail!: string;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamp with time zone",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamp with time zone",
  })
  updatedAt!: Date;
}
