// NCE Form Designer Store
// Manages form layout design state for the NCE Form Designer page

import { defineStore } from "pinia";
import { call } from "frappe-ui";
import { createFieldFromPath } from "@/nce/utils/formBinding";

export interface DesignerField {
  id: string;
  bindPath: string;
  label: string;
  fieldtype: string;
  colSpan: number;
  required: boolean;
}

export interface DesignerTab {
  label: string;
  fields: string[];
  condition?: string;
}

export interface FormDefinitionData {
  name: string;
  form_title: string;
  target_doctype: string;
  field_mapping: Record<string, string>;
  tab_layout?: string;
  grid_layout?: string;
}

export const useNceFormDesignerStore = defineStore("nceFormDesigner", {
  state: () => ({
    formName: null as string | null,
    formDefinition: null as FormDefinitionData | null,
    fields: [] as DesignerField[],
    tabs: [] as DesignerTab[],
    selectedFieldId: null as string | null,
    isSaving: false,
    isDirty: false,
  }),

  actions: {
    parseJSON(v: any) {
      if (!v) return null;
      if (typeof v === "string") {
        try {
          return JSON.parse(v);
        } catch {
          return null;
        }
      }
      return v;
    },

    async loadForm(name: string) {
      const result = await call("frappe.client.get", {
        doctype: "NCE Form Definition",
        name,
      });
      this.formDefinition = result;
      this.formName = name;

      const fm = result.field_mapping || {};
      const gl = this.parseJSON(result.grid_layout) || {};

      this.fields = Object.entries(fm).map(([id, bindPath]) => {
        const path = bindPath as string;
        const g = gl[path] || {};
        return {
          id,
          bindPath: path,
          label: id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          fieldtype: "Data",
          colSpan: g.colSpan ?? 6,
          required: g.required ?? false,
        };
      });

      const tl = this.parseJSON(result.tab_layout) || [];
      this.tabs = tl.length
        ? tl
        : [
            {
              label: "Default",
              fields: this.fields.map((f) => f.bindPath),
            },
          ];
    },

    addField(bindPath: string, meta?: any) {
      if (this.fields.find((f) => f.bindPath === bindPath)) return;

      const created = createFieldFromPath(
        bindPath,
        meta?.label,
        meta?.fieldtype || "Data"
      );
      const field: DesignerField = {
        id: created.id,
        bindPath: created.bindPath,
        label: created.label,
        fieldtype: created.fieldtype,
        colSpan: 6,
        required: false,
      };
      this.fields.push(field);

      if (this.tabs.length === 0) {
        this.tabs = [{ label: "Default", fields: [bindPath] }];
      } else {
        this.tabs[0].fields.push(bindPath);
      }
      this.isDirty = true;
    },

    removeField(id: string) {
      const field = this.fields.find((f) => f.id === id);
      if (!field) return;
      this.fields = this.fields.filter((f) => f.id !== id);
      for (const tab of this.tabs) {
        tab.fields = tab.fields.filter((p) => p !== field.bindPath);
      }
      if (this.selectedFieldId === id) this.selectedFieldId = null;
      this.isDirty = true;
    },

    updateField(id: string, patch: Partial<DesignerField>) {
      const field = this.fields.find((f) => f.id === id);
      if (!field) return;
      Object.assign(field, patch);
      this.isDirty = true;
    },

    async saveDesign() {
      if (!this.formName) return;
      this.isSaving = true;
      try {
        const field_mapping = Object.fromEntries(
          this.fields.map((f) => [f.id, f.bindPath])
        );
        const tab_layout = this.tabs.map((t) => ({
          label: t.label,
          fields: t.fields,
          condition: t.condition,
        }));
        const grid_layout = Object.fromEntries(
          this.fields.map((f) => [
            f.bindPath,
            { colSpan: f.colSpan, required: f.required },
          ])
        );
        await call("frappe.client.set_value", {
          doctype: "NCE Form Definition",
          name: this.formName,
          fieldname: {
            field_mapping,
            tab_layout: JSON.stringify(tab_layout),
            grid_layout: JSON.stringify(grid_layout),
          },
        });
        this.isDirty = false;
      } finally {
        this.isSaving = false;
      }
    },
  },
});
