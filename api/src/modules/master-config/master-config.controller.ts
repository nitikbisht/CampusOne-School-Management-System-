import type { Request, Response } from "express";
import { getValidated } from "../../middleware/validate.js";
import { masterConfigService } from "./master-config.service.js";
import type { CreateConfigTemplateInput, UpdateConfigTemplateInput, ListConfigTemplatesQuery } from "./master-config.schemas.js";

export const masterConfigController = {
  async list(req: Request, res: Response) {
    const { query } = getValidated<{ query: ListConfigTemplatesQuery }>(res);
    const result = await masterConfigService.listTemplates(query);
    res.json({ data: result });
  },

  async get(req: Request, res: Response) {
    const { params } = getValidated<{ params: { id: string } }>(res);
    const template = await masterConfigService.getTemplate(params.id);
    res.json({ data: template });
  },

  async create(req: Request, res: Response) {
    const { body } = getValidated<{ body: CreateConfigTemplateInput }>(res);
    const template = await masterConfigService.createTemplate(body, req);
    res.status(201).json({ data: template });
  },

  async update(req: Request, res: Response) {
    const { params, body } = getValidated<{ params: { id: string }; body: UpdateConfigTemplateInput }>(res);
    const template = await masterConfigService.updateTemplate(params.id, body, req);
    res.json({ data: template });
  },

  async delete(req: Request, res: Response) {
    const { params } = getValidated<{ params: { id: string } }>(res);
    const { query } = getValidated<{ query: { hard?: string } }>(res);

    const hardDelete = query.hard === "true";
    if (hardDelete) {
      await masterConfigService.hardDeleteTemplate(params.id, req);
      res.json({ data: { message: "Config template permanently deleted" } });
    } else {
      await masterConfigService.deleteTemplate(params.id, req);
      res.json({ data: { message: "Config template deactivated" } });
    }
  },

  async clone(req: Request, res: Response) {
    const { params } = getValidated<{ params: { id: string } }>(res);
    const { body } = getValidated<{ body: { name: string } }>(res);

    const template = await masterConfigService.cloneTemplate(params.id, body.name, req);
    res.status(201).json({ data: template });
  },
};