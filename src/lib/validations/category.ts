import { z } from 'zod';

export const categoryTypeEnum = z.enum(['expense', 'income', 'both']);

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  type: categoryTypeEnum,
  parent_id: z.string().uuid().nullable().optional(),
  icon: z.string().max(50).nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code')
    .nullable()
    .optional(),
  sort_order: z.number().int(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// ---- Category Import/Export ----

export const categoryImportRowSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  type: categoryTypeEnum,
  parent_category: z.string().max(100).optional().default(''),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color')
    .optional()
    .default(''),
  icon: z.string().max(50).optional().default(''),
  sort_order: z.coerce.number().int().optional().default(0),
});

export type CategoryImportRow = z.infer<typeof categoryImportRowSchema>;

/**
 * Validate a category import row against existing categories and earlier rows in the CSV.
 * Returns action: 'create', 'skip', or errors.
 */
export function validateCategoryImportRow(
  row: CategoryImportRow,
  existingNames: Set<string>,
  csvParentNames: Set<string>,
): { action: 'create' | 'skip'; errors: string[] } {
  const errors: string[] = [];
  const nameLower = row.name.toLowerCase();

  // Duplicate detection (case-insensitive)
  if (existingNames.has(nameLower)) {
    return { action: 'skip', errors: [] };
  }

  // Parent validation
  if (row.parent_category) {
    const parentLower = row.parent_category.toLowerCase();
    if (!existingNames.has(parentLower) && !csvParentNames.has(parentLower)) {
      errors.push(`Parent category "${row.parent_category}" not found`);
    }

    // Check for second-level nesting: if the parent itself has a parent
    // This is deferred to the API where we can check the DB
  }

  // Color validation (already handled by Zod, but double-check non-empty invalid)
  if (row.color && !/^#[0-9A-Fa-f]{6}$/.test(row.color)) {
    errors.push('Invalid hex color format');
  }

  return { action: errors.length === 0 ? 'create' : 'skip', errors };
}
