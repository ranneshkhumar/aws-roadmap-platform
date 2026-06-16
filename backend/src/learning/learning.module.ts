import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProgressModule } from '../progress/progress.module';
import { LearningController } from './learning.controller';
import { LearningService } from './learning.service';

@Module({
  imports: [PrismaModule, ProgressModule],
  controllers: [LearningController],
  providers: [LearningService],
})
export class LearningModule {}
