import { Entity, PrimaryColumn, Column } from 'typeorm';

/**
 * Отправленные карточки техники. Ключ — тренировка плюс упражнение,
 * поэтому повторная отправка правит прежнее сообщение, а не плодит новые.
 */
@Entity()
export class CardLog {
  @PrimaryColumn({ type: 'integer' })
  workoutId: number;

  @PrimaryColumn()
  exerciseId: string;

  @Column({ type: 'integer' })
  messageId: number;

  /** true — сообщение с фото: правится caption, а не text */
  @Column({ type: 'integer', default: 0 })
  hasPhoto: number;

  /** rich — блочное сообщение, photo — фото с HTML-подписью, text — текст */
  @Column({ default: 'photo' })
  variant: string;

  @Column()
  sentAt: string;
}
