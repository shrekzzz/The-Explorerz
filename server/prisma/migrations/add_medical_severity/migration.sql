-- Add medical condition severity field to consent_forms table
ALTER TABLE "consent_forms" ADD COLUMN "medicalConditionSeverity" VARCHAR(20);

-- Add comment for documentation
COMMENT ON COLUMN "consent_forms"."medicalConditionSeverity" IS 'Severity level of medical condition: Mild, Moderate, or Severe';
