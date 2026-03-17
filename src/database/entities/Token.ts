import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { GroupToken } from "./GroupToken";

@Entity("tokens")
export class Token {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar" })
  name: string;

  @Column({ type: "text" })
  value: string;

  @Column({ type: "varchar", nullable: true })
  env_name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "text", nullable: true })
  tags: string;

  @Column({ type: "varchar", nullable: true })
  website: string;

  @Column({ type: "datetime", nullable: true })
  expired_at: Date;

  @Column({ type: "integer", default: 0 })
  order_index: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => GroupToken, (gt) => gt.token, { cascade: true })
  groupTokens: GroupToken[];
}
