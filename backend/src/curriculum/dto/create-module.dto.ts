import { IsString, IsNotEmpty, IsInt, Min, IsOptional, IsIn } from 'class-validator';

export class CreateModuleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  tier: string;

  @IsInt()
  @Min(0)
  xpPoints: number;

  @IsInt()
  @Min(0)
  estimatedMinutes: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;

  @IsOptional()
  @IsString()
  topicId?: string;

  @IsOptional()
  @IsString()
  @IsIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}
