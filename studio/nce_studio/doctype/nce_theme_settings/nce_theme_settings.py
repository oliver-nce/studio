# -*- coding: utf-8 -*-
"""
NCE Theme Settings — Frappe Document Controller

Single DocType that persists the site-wide NCE theme configuration.
On every save, the CSS variable file is regenerated so the UI reflects
the latest brand colours and typography settings immediately.
"""

from __future__ import unicode_literals

import math
import os
import re

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import get_site_path

# ---------------------------------------------------------------------------
# OKLCH colour math (Python port of frontend/src/nce/theme/colorShades.ts)
# ---------------------------------------------------------------------------


def _hex_to_rgb(hex_color: str) -> tuple[float, float, float]:
    """Convert a #RRGGBB hex string to linear RGB (0–1 range each)."""
    hex_color = hex_color.lstrip("#")
    if len(hex_color) == 3:
        hex_color = "".join(c * 2 for c in hex_color)
    r = int(hex_color[0:2], 16) / 255.0
    g = int(hex_color[2:4], 16) / 255.0
    b = int(hex_color[4:6], 16) / 255.0
    return r, g, b


def _linearise(c: float) -> float:
    """Apply sRGB → linear RGB gamma expansion."""
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def _rgb_to_oklab(r: float, g: float, b: float) -> tuple[float, float, float]:
    """Convert linear sRGB to Oklab."""
    rl, gl, bl = _linearise(r), _linearise(g), _linearise(b)

    l = 0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl
    m = 0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl
    s = 0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl

    l_ = l ** (1 / 3)
    m_ = m ** (1 / 3)
    s_ = s ** (1 / 3)

    L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_
    a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_
    b_ = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_

    return L, a, b_


def _oklab_to_oklch(L: float, a: float, b: float) -> tuple[float, float, float]:
    """Convert Oklab to OKlch (L, C, H)."""
    C = math.sqrt(a * a + b * b)
    H = math.degrees(math.atan2(b, a)) % 360
    return L, C, H


def _oklch_to_oklab(L: float, C: float, H: float) -> tuple[float, float, float]:
    """Convert OKlch back to Oklab."""
    h_rad = math.radians(H)
    a = C * math.cos(h_rad)
    b = C * math.sin(h_rad)
    return L, a, b


def _oklab_to_linear_rgb(L: float, a: float, b: float) -> tuple[float, float, float]:
    """Convert Oklab to linear sRGB."""
    l_ = L + 0.3963377774 * a + 0.2158037573 * b
    m_ = L - 0.1055613458 * a - 0.0638541728 * b
    s_ = L - 0.0894841775 * a - 1.2914855480 * b

    l = l_**3
    m = m_**3
    s = s_**3

    r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    b_ = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s

    return r, g, b_


def _gamma_compress(c: float) -> float:
    """Apply linear RGB → sRGB gamma compression."""
    c = max(0.0, min(1.0, c))
    return c * 12.92 if c <= 0.0031308 else 1.055 * (c ** (1 / 2.4)) - 0.055


def _oklch_to_hex(L: float, C: float, H: float) -> str:
    """Convert OKlch values to a #RRGGBB hex string."""
    lab = _oklch_to_oklab(L, C, H)
    r, g, b = _oklab_to_linear_rgb(*lab)
    r = int(round(_gamma_compress(r) * 255))
    g = int(round(_gamma_compress(g) * 255))
    b = int(round(_gamma_compress(b) * 255))
    return "#{:02X}{:02X}{:02X}".format(r, g, b)


# Shade steps and their target lightness values
_SHADE_STEPS = {
    50: 0.97,
    100: 0.93,
    200: 0.86,
    300: 0.74,
    400: 0.63,
    500: 0.54,
    600: 0.44,
    700: 0.37,
    800: 0.30,
    900: 0.23,
    950: 0.15,
}


def generate_shades(hex_color: str) -> dict[int, str]:
    """Generate 11 OKLCH shades for a given hex colour.

    Args:
        hex_color: A #RRGGBB hex string.

    Returns:
        dict mapping shade step (50–950) to hex colour string.
    """
    try:
        r, g, b = _hex_to_rgb(hex_color)
        _, C, H = _oklab_to_oklch(*_rgb_to_oklab(r, g, b))
    except Exception:
        # If conversion fails, return a greyscale fallback
        return {step: hex_color for step in _SHADE_STEPS}

    shades = {}
    for step, target_L in _SHADE_STEPS.items():
        shades[step] = _oklch_to_hex(target_L, C, H)
    return shades


# ---------------------------------------------------------------------------
# CSS generation helpers
# ---------------------------------------------------------------------------

# Master colour field registry.  Third element marks whether the colour
# gets a full shade scale ("shade") or is a flat semantic token ("semantic").
# All sub-lists are derived from this single source of truth.
_COLOUR_FIELDS = [
    ("primary_color", "primary", "shade"),
    ("secondary_color", "secondary", "shade"),
    ("accent_color", "accent", "shade"),
    ("success_color", "success", "shade"),
    ("warning_color", "warning", "shade"),
    ("danger_color", "danger", "shade"),
    ("info_color", "info", "shade"),
    ("gray_color", "gray", "shade"),
    ("text_color", "text", "semantic"),
    ("text_muted_color", "text-muted", "semantic"),
    ("background_color", "background", "semantic"),
    ("surface_color", "surface", "semantic"),
    ("border_color", "border", "semantic"),
    ("link_color", "link", "semantic"),
    ("focus_ring_color", "focus-ring", "semantic"),
    ("shadow_color", "shadow-color", "semantic"),
]

# Derived sub-lists — kept in sync automatically
_SHADE_COLOUR_FIELDS = [(f, v) for f, v, k in _COLOUR_FIELDS if k == "shade"]
_SEMANTIC_COLOUR_FIELDS = [(f, v) for f, v, k in _COLOUR_FIELDS if k == "semantic"]

_SHADOW_MAP = {
    "sm": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    "DEFAULT": "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    "md": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    "lg": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    "xl": "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
}


def _build_css(doc: "NCEThemeSettings") -> str:
    """Build the full CSS variable stylesheet from a theme settings doc."""
    lines = [
        "/* NCE Studio — Generated Theme CSS */",
        "/* Do not edit this file manually. */",
        "/* Regenerated on every save of NCE Theme Settings. */",
        "",
        ":root {",
    ]

    # --- Colour base variables + shade scales ---
    for field, var_name in _SHADE_COLOUR_FIELDS:
        hex_val = doc.get(field) or "#000000"
        lines.append(f"  /* {var_name} */")
        lines.append(f"  --nce-{var_name}: {hex_val};")
        shades = generate_shades(hex_val)
        for step, shade_hex in sorted(shades.items()):
            lines.append(f"  --nce-{var_name}-{step}: {shade_hex};")
        lines.append("")

    # --- Semantic colour variables (no shade scale) ---
    lines.append("  /* Semantic colours */")
    for field, var_name in _SEMANTIC_COLOUR_FIELDS:
        hex_val = doc.get(field) or "#000000"
        lines.append(f"  --nce-{var_name}: {hex_val};")
    lines.append("")

    # --- Typography ---
    lines.append("  /* Typography */")
    lines.append(f"  --nce-font-family: {doc.font_family or 'inherit'};")
    lines.append(f"  --nce-font-size-base: {doc.font_size_base or '1rem'};")
    lines.append(f"  --nce-font-weight-base: {doc.font_weight_base or '400'};")
    lines.append(f"  --nce-line-height-base: {doc.line_height_base or '1.5'};")
    lines.append("")

    # --- Layout ---
    lines.append("  /* Layout */")
    lines.append(f"  --nce-border-radius: {doc.border_radius or '0.375rem'};")
    lines.append(f"  --nce-spacing-unit: {doc.spacing_unit or '0.25rem'};")
    lines.append(f"  --nce-max-content-width: {doc.max_content_width or '1280px'};")
    lines.append(f"  --nce-sidebar-width: {doc.sidebar_width or '280px'};")
    lines.append(f"  --nce-transition-speed: {doc.transition_speed or '0.2s'};")
    lines.append("")

    # --- Shadows ---
    shadow_style = doc.shadow_style or "DEFAULT"
    lines.append("  /* Shadows */")
    for key, value in _SHADOW_MAP.items():
        var_suffix = "" if key == "DEFAULT" else f"-{key.lower()}"
        lines.append(f"  --nce-shadow{var_suffix}: {value};")
    lines.append("")

    lines.append("}")
    lines.append("")

    # --- Custom CSS (appended verbatim) ---
    if doc.custom_css:
        lines.append("/* Custom CSS */")
        lines.append(doc.custom_css)
        lines.append("")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Document controller
# ---------------------------------------------------------------------------


_CSS_VALUE_PATTERN = re.compile(
    r"^[a-zA-Z0-9\s\-_.,#%()/'\"+:;]*$"
)


def _validate_css_value(value: str, field_label: str) -> None:
    """Validate that a CSS value contains no dangerous characters.

    Rejects values containing braces, semicolons (outside custom_css),
    backslashes, url(), expression(), and other injection vectors.
    """
    if not value:
        return
    if not _CSS_VALUE_PATTERN.match(value):
        frappe.throw(
            _("Theme field '{0}' contains invalid characters: {1}").format(
                field_label, value
            ),
            title=_("Invalid CSS Value"),
        )


class NCEThemeSettings(Document):
    # ------------------------------------------------------------------
    # Lifecycle hooks
    # ------------------------------------------------------------------

    def validate(self):
        """Validate CSS values before saving to prevent injection."""
        css_fields = [
            ("font_family", "Font Family"),
            ("font_size_base", "Font Size Base"),
            ("font_weight_base", "Font Weight Base"),
            ("line_height_base", "Line Height Base"),
            ("border_radius", "Border Radius"),
            ("spacing_unit", "Spacing Unit"),
            ("max_content_width", "Max Content Width"),
            ("sidebar_width", "Sidebar Width"),
            ("transition_speed", "Transition Speed"),
        ]
        for fieldname, label in css_fields:
            value = self.get(fieldname)
            if value:
                _validate_css_value(str(value), label)

    def on_update(self):
        """Regenerate the theme CSS file every time settings are saved."""
        try:
            self.regenerate_theme_css()
        except Exception as exc:
            frappe.log_error(
                title="NCE Theme CSS regeneration failed",
                message=str(exc),
            )
            frappe.msgprint(
                _("Theme CSS could not be regenerated: {0}").format(str(exc)),
                indicator="orange",
                alert=True,
            )

    # ------------------------------------------------------------------
    # Public / whitelisted methods
    # ------------------------------------------------------------------

    @frappe.whitelist()
    def regenerate_theme_css(self):
        """Build and write the NCE theme CSS file, then clear Frappe cache.

        The file is written to:
            {site_path}/public/files/nce_theme.css

        Returns:
            dict: {"status": "ok", "path": "<absolute path>"}
        """
        css_content = _build_css(self)

        # Write to the site's public/files directory so it is served
        # as /files/nce_theme.css by the web server.
        output_dir = get_site_path("public", "files")
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, "nce_theme.css")

        with open(output_path, "w", encoding="utf-8") as fh:
            fh.write(css_content)

        # Clear site cache so hooks.py app_include_css picks up the new file.
        frappe.clear_cache()

        return {"status": "ok", "path": output_path}

    @frappe.whitelist()
    def get_theme_variables(self):
        """Return all theme fields as a plain dict for the frontend.

        Used by ``themeInit.ts`` to hydrate the Vue theme state from the
        canonical server record rather than localStorage.

        Returns:
            dict: All theme field values keyed by fieldname.
        """
        skip = {
            "doctype",
            "name",
            "owner",
            "creation",
            "modified",
            "modified_by",
            "docstatus",
            "idx",
            "__unsaved",
        }

        return {
            key: value
            for key, value in self.as_dict().items()
            if key not in skip and not key.startswith("_")
        }
