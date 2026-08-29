import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { roleEnum } from "../../types/user.js";
import { Department } from "./department.model.js";
import { Contact } from "./contact.model.js";
import { Ticket } from "./ticket.model.js";

@Entity()
export class User {
  @PrimaryColumn({ type: "uuid", default: () => "uuidv7()" })
  id!: string;

  @Column({ name: "first_name", type: "varchar", length: 50 })
  firstName!: string;

  @Column({ name: "last_name", type: "varchar", length: 50 })
  lastName!: string;

  @Column({ type: "enum", enum: roleEnum, default: roleEnum.user })
  role!: roleEnum;

  @Column({ type: "varchar", unique: true, length: 254 })
  email!: string;

  @Column({ type: "varchar", select: false })
  password!: string;

  @Column({ type: "varchar", nullable: true, select: false })
  refreshToken!: string | null;

  @Column({ name: "department_id", type: "uuid", nullable: true })
  departmentId!: string | null;

  @ManyToOne(() => Department, (department) => department.users, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "department_id" })
  department!: Department | null;

  @OneToMany(() => Contact, (contact) => contact.user)
  contacts!: Contact[];

  @OneToMany(() => Ticket, (ticket) => ticket.createdBy)
  createdTickets!: Ticket[];

  @OneToMany(() => Ticket, (ticket) => ticket.assignedTo)
  assignedTickets!: Ticket[];

  @OneToMany(() => Department, (department) => department.manager)
  managedDepartments!: Department[];

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
