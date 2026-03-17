import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm'
import { Group } from './Group'
import { Token } from './Token'

@Entity('group_tokens')
@Unique(['group_id', 'token_id'])
export class GroupToken {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'integer' })
  group_id: number

  @Column({ type: 'integer' })
  token_id: number

  @CreateDateColumn()
  created_at: Date

  @ManyToOne(() => Group, (group) => group.groupTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group

  @ManyToOne(() => Token, (token) => token.groupTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'token_id' })
  token: Token
}
