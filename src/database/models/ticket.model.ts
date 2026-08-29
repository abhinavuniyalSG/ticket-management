import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Check,
} from "typeorm";
import { Department } from "./department.model.js";
import { User } from "./user.model.js";
import { TicketStatus } from "../../types/ticket.js";

const statusCheckConstraint = `
  (
    status = 'closed'
    AND closed_at IS NOT NULL
  )
  OR
  (
    status <> 'closed'
    AND closed_at IS NULL
  )
`;

@Entity()
@Check(statusCheckConstraint)
export class Ticket {
  @PrimaryColumn({ name: "ticket_id", type: "uuid", default: () => "uuidv7()" })
  ticketId!: string;

  @Column({ type: "varchar", length: 200 })
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({
    type: "enum",
    enum: TicketStatus,
    default: TicketStatus.open,
  })
  status!: TicketStatus;

  @Column({ name: "department_id", type: "uuid" })
  departmentId!: string;

  @ManyToOne(() => Department, (department) => department.tickets, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "department_id" })
  department!: Department;

  @Column({ name: "assigned_to", type: "uuid", nullable: true })
  assignedToId!: string | null;

  @ManyToOne(() => User, (user) => user.assignedTickets, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "assigned_to" })
  assignedTo!: User | null;

  @Column({ name: "created_by", type: "uuid" })
  createdById!: string;

  @ManyToOne(() => User, (user) => user.createdTickets, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "created_by" })
  createdBy!: User;

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

  @Column({
    name: "closed_at",
    type: "timestamp with time zone",
    nullable: true,
  })
  closedAt!: Date | null;
}
