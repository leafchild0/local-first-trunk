import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('notes')
export class NoteEntity {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  title: string;

  @Column('text')
  content: string;

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column('integer')
  updatedAt: number;

  @Column('integer')
  createdAt: number;

  @Column('boolean', { default: false })
  deleted: boolean;

  @Column('text', { nullable: true })
  version: string;
}
