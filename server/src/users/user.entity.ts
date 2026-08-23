import { Entity, PrimaryColumn, Column } from 'typeorm';

/**
 * Профиль атлета. Приложение пока однопользовательское: при первом
 * запуске создаётся владелец по шаблону, остальные поля заполняются
 * по мере надобности. Заготовка под мультипользовательский режим.
 */
@Entity()
export class User {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  /** Владелец базы — запись, создаваемая при первом запуске */
  @Column({ type: 'boolean', default: false })
  isOwner: boolean;

  /** Провайдер входа: vk | yandex | google | null для локального */
  @Column({ type: 'varchar', nullable: true })
  provider: string | null;

  @Column({ type: 'real', nullable: true })
  weightKg: number | null;

  @Column({ type: 'integer', nullable: true })
  heightCm: number | null;

  @Column({ nullable: true })
  createdAt: string;
}
