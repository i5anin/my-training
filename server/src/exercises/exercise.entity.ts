import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class Exercise {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column('simple-json')
  muscleGroups: string[];

  /** Вес грифа/снаряда по умолчанию, кг. Прибавляется к весу
   *  блинов в статистике. В тренировке можно переопределить. */
  @Column({ type: 'real', nullable: true })
  barWeight: number | null;
}
