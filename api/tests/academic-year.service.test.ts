import { describe, expect, it, vi } from "vitest";
import { AppError } from "../src/lib/errors.js";
import type { AcademicYearRepository } from "../src/modules/academic-years/academic-year.repository.js";
import { createAcademicYearService } from "../src/modules/academic-years/academic-year.service.js";

function fakeRepo(overrides: Partial<AcademicYearRepository> = {}): AcademicYearRepository {
  return {
    list: vi.fn(),
    findById: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
    setCurrent: vi.fn(),
    ...overrides,
  } as unknown as AcademicYearRepository;
}

describe("academicYearService", () => {
  it("throws NOT_FOUND when the year does not exist in this school", async () => {
    const service = createAcademicYearService(fakeRepo());
    await expect(service.get("school-1", "year-1")).rejects.toMatchObject({
      status: 404,
      code: "NOT_FOUND",
    });
  });

  it("refuses to activate a closed year", async () => {
    const repo = fakeRepo({
      findById: vi.fn().mockResolvedValue({ id: "y1", status: "CLOSED" }),
    });
    const service = createAcademicYearService(repo);

    await expect(service.activate("school-1", "y1")).rejects.toBeInstanceOf(AppError);
    expect(repo.setCurrent).not.toHaveBeenCalled();
  });

  it("activates a draft year", async () => {
    const setCurrent = vi.fn().mockResolvedValue({ id: "y1", isCurrent: true });
    const repo = fakeRepo({
      findById: vi.fn().mockResolvedValue({ id: "y1", status: "DRAFT" }),
      setCurrent,
    });
    const service = createAcademicYearService(repo);

    await service.activate("school-1", "y1");
    expect(setCurrent).toHaveBeenCalledWith("school-1", "y1");
  });

  it("converts ISO dates to UTC dates when creating", async () => {
    const create = vi.fn().mockResolvedValue({});
    const service = createAcademicYearService(fakeRepo({ create }));

    await service.create("school-1", {
      name: "2026-27",
      startDate: "2026-04-01",
      endDate: "2027-03-31",
    });

    expect(create).toHaveBeenCalledWith("school-1", {
      name: "2026-27",
      startDate: new Date("2026-04-01T00:00:00.000Z"),
      endDate: new Date("2027-03-31T00:00:00.000Z"),
    });
  });
});
