import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Module, ModuleLevel, Prisma } from '../../generated/prisma/client.js';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { ReorderModulesDto } from './dto/reorder-modules.dto';
import { ProgressService } from '../progress/progress.service';

@Injectable()
export class ModulesService {
  constructor(
    private prisma: PrismaService,
    private progressService: ProgressService,
  ) {}

  /**
   * Finds the next sequential orderIndex within a topic.
   * Queries across ALL levels in the topic and returns max + 1.
   * Never renumbers or shifts existing modules.
   */
  private async getNextOrderIndex(
    tx: Prisma.TransactionClient,
    topicId: string | null,
  ): Promise<number> {
    const last = await tx.module.findFirst({
      where: { topicId: topicId ?? null },
      orderBy: { orderIndex: 'desc' },
    });
    return last ? last.orderIndex + 1 : 0;
  }

  async findAll(): Promise<Module[]> {
    return this.prisma.module.findMany({
      orderBy: { orderIndex: 'asc' },
    });
  }

  async findOne(id: string) {
    const module = await this.prisma.module.findUnique({
      where: { id },
      include: {
        slides: {
          orderBy: { orderIndex: 'asc' },
        },
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!module) {
      throw new NotFoundException(`Module with ID "${id}" not found`);
    }

    return module;
  }

  async findOneBySlug(slug: string) {
    const module = await this.prisma.module.findUnique({
      where: { slug },
      include: {
        slides: {
          orderBy: { orderIndex: 'asc' },
        },
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!module) {
      throw new NotFoundException(`Module with slug "${slug}" not found`);
    }

    return module;
  }

  async findByTier(tier: string): Promise<Module[]> {
    return this.prisma.module.findMany({
      where: { tier },
      orderBy: { orderIndex: 'asc' },
    });
  }

  async findByTopicId(topicId: string): Promise<Module[]> {
    return this.prisma.module.findMany({
      where: { topicId },
      orderBy: { orderIndex: 'asc' },
    });
  }

  async create(dto: CreateModuleDto): Promise<Module> {
    const slug = await this.generateUniqueSlug(dto.name);

    const module = await this.prisma.$transaction(async (tx) => {
      let orderIndex = dto.orderIndex;
      if (orderIndex === undefined || orderIndex === null) {
        orderIndex = await this.getNextOrderIndex(
          tx,
          dto.topicId ?? null,
        );
      }

      return tx.module.create({
        data: {
          name: dto.name,
          description: dto.description,
          tier: dto.tier,
          xpPoints: dto.xpPoints,
          orderIndex,
          slug,
          topicId: dto.topicId ?? null,
          level: dto.level ?? null,
        },
      });
    });

    await this.progressService.retroactiveUnlockForNewModule(
      module.id,
      dto.topicId ?? null,
      (dto.level as ModuleLevel) ?? null,
    );

    return module;
  }

  async update(id: string, dto: UpdateModuleDto): Promise<Module> {
    const existing = await this.prisma.module.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Module with ID "${id}" not found`);
    }

    const data: Partial<Omit<Module, 'id' | 'createdAt' | 'updatedAt'>> = {
      name: dto.name,
      description: dto.description,
      tier: dto.tier,
      xpPoints: dto.xpPoints,
      orderIndex: dto.orderIndex,
      topicId: dto.topicId,
      level: dto.level,
    };

    if (dto.name && dto.name !== existing.name) {
      data.slug = await this.generateUniqueSlug(dto.name);
    }

    return this.prisma.module.update({
      where: { id },
      data,
    });
  }

  /**
   * Remove a module.
   * Hard delete is implemented now, but structured in a single service method
   * to facilitate soft-delete conversion later without altering controller contracts.
   */
  async remove(id: string): Promise<{ success: boolean }> {
    const existing = await this.prisma.module.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Module with ID "${id}" not found`);
    }

    await this.prisma.module.delete({
      where: { id },
    });

    return { success: true };
  }

  async reorder(dto: ReorderModulesDto): Promise<{ success: boolean }> {
    // 1. Verify all IDs exist and fetch their current order index in a single query
    const existingModules = await this.prisma.module.findMany({
      where: {
        id: { in: dto.ids },
      },
      select: {
        id: true,
        orderIndex: true,
      },
    });

    if (existingModules.length !== dto.ids.length) {
      throw new NotFoundException('One or more module IDs not found');
    }

    // 2. Compare the current orderIndex values against the desired ordering
    const moduleMap = new Map<string, number>();
    for (const m of existingModules) {
      moduleMap.set(m.id, m.orderIndex);
    }

    const updateOperations: any[] = [];
    for (let index = 0; index < dto.ids.length; index++) {
      const id = dto.ids[index];
      const currentOrder = moduleMap.get(id);
      if (currentOrder !== index) {
        updateOperations.push(
          this.prisma.module.update({
            where: { id },
            data: { orderIndex: index },
          }),
        );
      }
    }

    // 3. If no modules require updates, skip transaction entirely
    if (updateOperations.length === 0) {
      return { success: true };
    }

    // 4. Execute only the filtered update operations inside a Prisma transaction with a 15s timeout
    await this.prisma.$transaction(updateOperations, {
      timeout: 15000,
    });

    return { success: true };
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const targetSlug = baseSlug || 'module';
    let slug = targetSlug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.module.findUnique({
        where: { slug },
      });
      if (!existing) {
        return slug;
      }
      slug = `${targetSlug}-${counter}`;
      counter++;
    }
  }
}
