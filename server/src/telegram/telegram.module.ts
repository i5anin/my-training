import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkoutsModule } from '../workouts/workouts.module';
import { ExercisesModule } from '../exercises/exercises.module';
import { MuscleGroupsModule } from '../muscle-groups/muscle-groups.module';
import { DigestLog } from './digest-log.entity';
import { CardLog } from './technique/card-log.entity';
import { TelegramConfig } from './telegram.config';
import { BOT, createBot } from './bot.factory';
import { TelegramBotService } from './telegram-bot.service';
import { DigestScheduler } from './digest.scheduler';
import { WorkoutDigestService } from './digest/workout-digest.service';
import { RichReportBuilder } from './report/rich-report.builder';
import { FallbackReportBuilder } from './report/fallback-report.builder';
import { TechniqueCardBuilder } from './technique/technique-card.builder';
import { TechniqueRichBuilder } from './technique/technique-rich.builder';
import { WorkoutMediaService } from './media/workout-media.service';
import { TelegramController } from './telegram.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([DigestLog, CardLog]),
    WorkoutsModule,
    ExercisesModule,
    MuscleGroupsModule,
  ],
  controllers: [TelegramController],
  providers: [
    TelegramConfig,
    { provide: BOT, useFactory: createBot, inject: [TelegramConfig] },
    TelegramBotService,
    DigestScheduler,
    WorkoutDigestService,
    RichReportBuilder,
    FallbackReportBuilder,
    TechniqueCardBuilder,
    TechniqueRichBuilder,
    WorkoutMediaService,
  ],
  exports: [TelegramBotService],
})
export class TelegramModule {}
