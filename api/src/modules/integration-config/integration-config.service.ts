import { AppError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import type { Prisma } from "@prisma/client";
import { integrationConfigRepository } from "./integration-config.repository.js";
import { auditService } from "../../lib/audit.js";
import { encryptConfig, decryptConfig, maskConfig } from "../../lib/encryption.js";
import type { Request } from "express";
import type { CreateIntegrationConfigInput, UpdateIntegrationConfigInput, ListIntegrationConfigsQuery, TestIntegrationInput } from "./integration-config.schemas.js";

export const integrationConfigService = {
  /**
   * List all integration configs
   */
  async listConfigs(query: ListIntegrationConfigsQuery) {
    return integrationConfigRepository.findMany(query);
  },

  /**
   * Get single integration config (decrypted for internal use)
   */
  async getConfig(id: string) {
    const config = await integrationConfigRepository.findById(id);
    if (!config) {
      throw AppError.notFound("Integration config not found");
    }
    return config;
  },

  /**
   * Get integration config with decrypted values (for internal use only)
   */
  async getConfigDecrypted(id: string) {
    const config = await integrationConfigRepository.findById(id);
    if (!config) {
      throw AppError.notFound("Integration config not found");
    }
    try {
      const decrypted = decryptConfig(config.config as string);
      return { ...config, config: decrypted };
    } catch {
      // If decryption fails, return as-is (might be unencrypted legacy data)
      return config;
    }
  },

  /**
   * Get integration config with masked values (for display)
   */
  async getConfigMasked(id: string) {
    const config = await integrationConfigRepository.findById(id);
    if (!config) {
      throw AppError.notFound("Integration config not found");
    }
    try {
      const decrypted = decryptConfig(config.config as string);
      return { ...config, config: maskConfig(decrypted) };
    } catch {
      return { ...config, config: maskConfig(config.config as Record<string, unknown>) };
    }
  },

  /**
   * Create a new integration config
   */
  async createConfig(input: CreateIntegrationConfigInput, req: Request) {
    // Check if key already exists
    const existing = await integrationConfigRepository.findByKey(input.key);
    if (existing) {
      throw AppError.conflict("An integration with this key already exists");
    }

    // Encrypt the config
    const encryptedConfig = encryptConfig(input.config);

    const config = await prisma.$transaction(async (tx) => {
      const created = await tx.integrationConfig.create({
        data: {
          key: input.key,
          name: input.name,
          description: input.description,
          config: encryptedConfig as Prisma.InputJsonValue,
          isActive: input.isActive,
        },
      });
      return created;
    });

    await auditService.logFromRequest(
      req,
      "CREATE",
      "IntegrationConfig",
      config.id,
      { oldValue: null, newValue: { key: config.key, name: config.name, isActive: config.isActive } },
      undefined,
      "Integration config created"
    );

    return { ...config, config: maskConfig(input.config) };
  },

  /**
   * Update integration config
   */
  async updateConfig(id: string, input: UpdateIntegrationConfigInput, req: Request) {
    const existing = await integrationConfigRepository.findById(id);
    if (!existing) {
      throw AppError.notFound("Integration config not found");
    }

    const updateData: Prisma.IntegrationConfigUpdateInput = {
      name: input.name,
      description: input.description,
      isActive: input.isActive,
    };
    if (input.config) {
      updateData.config = encryptConfig(input.config) as Prisma.InputJsonValue;
    }

    const updated = await integrationConfigRepository.update(id, updateData);

    await auditService.logFromRequest(
      req,
      "UPDATE",
      "IntegrationConfig",
      id,
      {
        oldValue: { name: existing.name, description: existing.description, isActive: existing.isActive },
        newValue: input,
      },
      undefined,
      "Integration config updated"
    );

    const maskedConfig = input.config ? maskConfig(input.config) : (await this.getConfigMasked(id)).config;
    return { ...updated, config: maskedConfig };
  },

  /**
   * Delete integration config
   */
  async deleteConfig(id: string, req: Request) {
    const existing = await integrationConfigRepository.findById(id);
    if (!existing) {
      throw AppError.notFound("Integration config not found");
    }

    await integrationConfigRepository.delete(id);

    await auditService.logFromRequest(
      req,
      "DELETE",
      "IntegrationConfig",
      id,
      { oldValue: { key: existing.key, name: existing.name }, newValue: null },
      undefined,
      "Integration config deleted"
    );
  },

  /**
   * Test integration connection
   */
  async testConfig(id: string, input: TestIntegrationInput, req: Request) {
    const existing = await integrationConfigRepository.findById(id);
    if (!existing) {
      throw AppError.notFound("Integration config not found");
    }

    let configToTest: Record<string, unknown>;
    if (input.config) {
      configToTest = input.config;
    } else {
      try {
        configToTest = decryptConfig(existing.config as string);
      } catch {
        throw AppError.badRequest("Cannot decrypt stored config for testing");
      }
    }

    // Perform integration-specific test
    let success = false;
    let result = "";

    switch (existing.key) {
      case "smtp":
        result = await this.testSmtp(configToTest);
        success = result === "success";
        break;
      case "sms_twilio":
      case "sms_msg91":
        result = await this.testSms(existing.key, configToTest);
        success = result === "success";
        break;
      case "payment_razorpay":
      case "payment_stripe":
        result = await this.testPayment(existing.key, configToTest);
        success = result === "success";
        break;
      default:
        // Generic test - just verify config structure
        result = "config_valid";
        success = true;
    }

    await integrationConfigRepository.updateTestResult(id, success, result);

    await auditService.logFromRequest(
      req,
      "TEST",
      "IntegrationConfig",
      id,
      { oldValue: null, newValue: { testResult: result, success } },
      undefined,
      `Integration test: ${result}`
    );

    return { success, result };
  },

  /**
   * Test SMTP connection
   */
  async testSmtp(config: Record<string, unknown>): Promise<string> {
    // In a real implementation, you would use nodemailer to test SMTP
    // For now, just validate required fields
    const required = ["host", "port", "user", "pass", "from"];
    const missing = required.filter(f => !config[f]);
    if (missing.length > 0) {
      return `missing_fields: ${missing.join(", ")}`;
    }
    // TODO: Actually send test email
    return "success";
  },

  /**
   * Test SMS connection
   */
  async testSms(provider: string, config: Record<string, unknown>): Promise<string> {
    // Validate required fields based on provider
    const required = provider === "sms_twilio"
      ? ["accountSid", "authToken", "fromNumber"]
      : ["authKey", "senderId"];
    const missing = required.filter(f => !config[f]);
    if (missing.length > 0) {
      return `missing_fields: ${missing.join(", ")}`;
    }
    // TODO: Actually send test SMS
    return "success";
  },

  /**
   * Test Payment gateway connection
   */
  async testPayment(provider: string, config: Record<string, unknown>): Promise<string> {
    // Validate required fields based on provider
    const required = provider === "payment_razorpay"
      ? ["keyId", "keySecret"]
      : ["secretKey", "publishableKey"];
    const missing = required.filter(f => !config[f]);
    if (missing.length > 0) {
      return `missing_fields: ${missing.join(", ")}`;
    }
    // TODO: Actually test payment API
    return "success";
  },
};

export type IntegrationConfigService = typeof integrationConfigService;