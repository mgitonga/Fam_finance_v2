import { z } from 'zod';
import { DASHBOARD_WIDGETS } from '@/lib/dashboard-widgets';

const widgetIds = DASHBOARD_WIDGETS.map((w) => w.id) as [string, ...string[]];

export const widgetPreferenceSchema = z.object({
  id: z.enum(widgetIds),
  order: z.number().int().min(0).max(20),
  enabled: z.boolean(),
});

export const dashboardPreferencesSchema = z
  .array(widgetPreferenceSchema)
  .min(1, 'At least one widget preference (enabled or disabled) must be provided')
  .refine((prefs) => prefs.some((p) => p.enabled), 'At least one widget must be enabled')
  .refine((prefs) => {
    const ids = prefs.map((p) => p.id);
    return new Set(ids).size === ids.length;
  }, 'Duplicate widget IDs are not allowed');

export type WidgetPreference = z.infer<typeof widgetPreferenceSchema>;
export type DashboardPreferences = z.infer<typeof dashboardPreferencesSchema>;
