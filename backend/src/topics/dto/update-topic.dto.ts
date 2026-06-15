import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { TopicTheme } from '../../../generated/prisma/client.js';

export class UpdateTopicDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TopicTheme)
  theme?: TopicTheme;
}
