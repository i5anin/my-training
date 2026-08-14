import { Entity, PrimaryColumn, Column } from 'typeorm';

/**
 * Журнал отправленных сводок: одно сообщение на тренировку.
 * Ключ составной, потому что за один день бывает несколько тренировок;
 * workoutId = 0 — служебное сообщение «за день записей нет».
 */
@Entity()
export class DigestLog {
  /** Дата тренировки, YYYY-MM-DD */
  @PrimaryColumn()
  date: string;

  @PrimaryColumn({ type: 'integer' })
  workoutId: number;

  @Column({ type: 'integer' })
  messageId: number;

  @Column()
  sentAt: string;

  /** rich | fallback | empty | failed */
  @Column()
  variant: string;
}
