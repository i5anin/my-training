import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class Exercise {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  /** Мышцы под основной нагрузкой */
  @Column('simple-json')
  muscleGroups: string[];

  /** Мышцы, работающие слабо: ассистенты и стабилизаторы */
  @Column('simple-json', { nullable: true })
  secondaryMuscleGroups: string[] | null;

  /** Вес грифа/снаряда по умолчанию, кг. Прибавляется к весу
   *  блинов в статистике. В тренировке можно переопределить. */
  @Column({ type: 'real', nullable: true })
  barWeight: number | null;
}
