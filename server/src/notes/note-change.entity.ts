import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('note_changes')
export class NoteChangeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  noteId: string;

  @Column('text')
  deviceId: string;

  @Column('integer')
  updatedAt: number;

  @Column('text')
  version: string;

  @Column('text')
  payload: string; // JSON string for simplicity
}
