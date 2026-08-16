import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity()
export class Workout {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  date: string;

  @Column('simple-json', { nullable: true })
  muscleGroups: string[];

  @Column('simple-json', { nullable: true })
  entries: any[];

  @Column({ nullable: true })
  description: string;

  @Column('simple-json', { nullable: true })
  photoIds: string[];

  @Column({ nullable: true })
  primaryType: string;

  @Column({ nullable: true })
  secondaryType: string;

  /**
   * Запись создана заранее как план: веса проставлены, работа ещё не
   * сделана. Снимается, когда тренировка отработана.
   */
  @Column({ nullable: true })
  isPlan: boolean;

  /**
   * Закладка «требует внимания» — например, id временный и подлежит
   * пересчёту при следующей нормализации нумерации.
   */
  @Column({ nullable: true })
  flagged: boolean;

  @Column({ nullable: true })
  createdAt: string;

  @Column({ nullable: true })
  totalEditMs: number;
}
