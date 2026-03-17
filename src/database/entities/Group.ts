import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm'
import { GroupToken } from './GroupToken'

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'text', unique: true })
  name: string

  @Column({ type: 'text', nullable: true })
  description: string

  @Column({ type: 'integer', default: 0 })
  order_index: number

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

  @OneToMany(() => GroupToken, (gt) => gt.group, { cascade: true })
  groupTokens: GroupToken[]
}
