import { AppError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import type { Prisma } from "@prisma/client";
import { masterConfigRepository } from "./master-config.repository.js";
import { auditService } from "../../lib/audit.js";
import type { Request } from "express";
import type { CreateConfigTemplateInput, UpdateConfigTemplateInput, ListConfigTemplatesQuery } from "./master-config.schemas.js";

export const masterConfigService = {
  /**
   * List all config templates
   */
  async listTemplates(query: ListConfigTemplatesQuery) {
    return masterConfigRepository.findMany(query);
  },

  /**
   * Get single config template
   */
  async getTemplate(id: string) {
    const template = await masterConfigRepository.findById(id);
    if (!template) {
      throw AppError.notFound("Config template not found");
    }
    return template;
  },

  /**
   * Create a new config template
   */
  async createTemplate(input: CreateConfigTemplateInput, req: Request) {
    const template = await masterConfigRepository.create({
      ...input,
      template: input.template as Prisma.InputJsonValue,
    });

    await auditService.logFromRequest(
      req,
      "CREATE",
      "ConfigTemplate",
      template.id,
      { oldValue: null, newValue: { name: template.name, description: template.description } },
      undefined,
      "Config template created"
    );

    return template;
  },

  /**
   * Update config template
   */
  async updateTemplate(id: string, input: UpdateConfigTemplateInput, req: Request) {
    const existing = await masterConfigRepository.findById(id);
    if (!existing) {
      throw AppError.notFound("Config template not found");
    }

    const updateData = { ...input };
    if (input.template) {
      (updateData as Record<string, unknown>).template = input.template as Prisma.InputJsonValue;
    }

    const updated = await masterConfigRepository.update(id, updateData as Prisma.ConfigTemplateUpdateInput);

    await auditService.logFromRequest(
      req,
      "UPDATE",
      "ConfigTemplate",
      id,
      {
        oldValue: { name: existing.name, description: existing.description, isActive: existing.isActive },
        newValue: input,
      },
      undefined,
      "Config template updated"
    );

    return updated;
  },

  /**
   * Delete config template (soft delete by deactivating)
   */
  async deleteTemplate(id: string, req: Request) {
    const existing = await masterConfigRepository.findById(id);
    if (!existing) {
      throw AppError.notFound("Config template not found");
    }

    await masterConfigRepository.update(id, { isActive: false });

    await auditService.logFromRequest(
      req,
      "DEACTIVATE",
      "ConfigTemplate",
      id,
      { oldValue: { isActive: true }, newValue: { isActive: false } },
      undefined,
      "Config template deactivated"
    );
  },

  /**
   * Hard delete config template
   */
  async hardDeleteTemplate(id: string, req: Request) {
    const existing = await masterConfigRepository.findById(id);
    if (!existing) {
      throw AppError.notFound("Config template not found");
    }

    await masterConfigRepository.delete(id);

    await auditService.logFromRequest(
      req,
      "DELETE",
      "ConfigTemplate",
      id,
      { oldValue: { name: existing.name }, newValue: null },
      undefined,
      "Config template permanently deleted"
    );
  },

  /**
   * Clone config template
   */
  async cloneTemplate(id: string, newName: string, req: Request) {
    const cloned = await masterConfigRepository.clone(id, newName);

    await auditService.logFromRequest(
      req,
      "CREATE",
      "ConfigTemplate",
      cloned.id,
      { oldValue: null, newValue: { name: cloned.name, clonedFrom: id } },
      undefined,
      "Config template cloned"
    );

    return cloned;
  },
};

export type MasterConfigService = typeof masterConfigService;