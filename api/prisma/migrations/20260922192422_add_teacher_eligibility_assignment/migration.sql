-- CreateTable
CREATE TABLE "teacher_eligibilities" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "teacherId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "classId" UUID NOT NULL,
    "maxClassId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_eligibilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_assignments" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "teacherId" UUID NOT NULL,
    "academicYearId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "classId" UUID NOT NULL,
    "sectionId" UUID NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "teacher_eligibilities_schoolId_teacherId_idx" ON "teacher_eligibilities"("schoolId", "teacherId");

-- CreateIndex
CREATE INDEX "teacher_eligibilities_schoolId_subjectId_idx" ON "teacher_eligibilities"("schoolId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_eligibilities_schoolId_teacherId_subjectId_classId_key" ON "teacher_eligibilities"("schoolId", "teacherId", "subjectId", "classId");

-- CreateIndex
CREATE INDEX "teacher_assignments_schoolId_academicYearId_idx" ON "teacher_assignments"("schoolId", "academicYearId");

-- CreateIndex
CREATE INDEX "teacher_assignments_schoolId_teacherId_idx" ON "teacher_assignments"("schoolId", "teacherId");

-- CreateIndex
CREATE INDEX "teacher_assignments_schoolId_classId_sectionId_idx" ON "teacher_assignments"("schoolId", "classId", "sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_assignments_schoolId_academicYearId_subjectId_class_key" ON "teacher_assignments"("schoolId", "academicYearId", "subjectId", "classId", "sectionId", "teacherId");

-- AddForeignKey
ALTER TABLE "teacher_eligibilities" ADD CONSTRAINT "teacher_eligibilities_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_eligibilities" ADD CONSTRAINT "teacher_eligibilities_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_eligibilities" ADD CONSTRAINT "teacher_eligibilities_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_eligibilities" ADD CONSTRAINT "teacher_eligibilities_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_eligibilities" ADD CONSTRAINT "teacher_eligibilities_maxClassId_fkey" FOREIGN KEY ("maxClassId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
