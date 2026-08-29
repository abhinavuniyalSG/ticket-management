import {
  Entity,
  PrimaryColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Ticket } from "./ticket.model.js";
import { User } from "./user.model.js";

@Entity()
export class Department {
  @PrimaryColumn({
    name: "department_id",
    type: "uuid",
    default: () => "uuidv7()",
  })
  departmentId!: string;

  @Column({
    name: "department_name",
    type: "varchar",
    unique: true,
    length: 100,
  })
  departmentName!: string;

  @Column({
    name: "department_email",
    type: "varchar",
    unique: true,
    length: 254,
  })
  departmentEmail!: string;

  @Column({
    name: "managed_by",
    type: "uuid",
    nullable: true,
  })
  managedBy!: string | null;

  @ManyToOne(() => User, (user) => user.managedDepartments, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "managed_by" })
  manager!: User | null;

  @OneToMany(() => Ticket, (ticket) => ticket.department)
  tickets!: Ticket[];

  @OneToMany(() => User, (user) => user.department)
  users!: User[];

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
