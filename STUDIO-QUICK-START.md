# Studio — Quick Start Guide

> For builders. Covers what exists today.

---

## What is Studio?

Studio is a visual page builder built into your Frappe desk. It lets you create custom pages and apps for your site without writing code — using a drag-and-drop canvas, a component palette, and a live preview.

---

## Getting Access

1. Log in to the Frappe desk.
2. Ask your system administrator to assign you the **Studio Builder** role.
3. Once assigned, Studio appears in the desk's app menu (top-left grid icon) as **Studio**.

---

## Opening Studio

Click the app menu icon → select **Studio**.

You land on the Studio home screen showing all existing apps.

---

## Core Concepts

| Term | What it means |
|---|---|
| **App** | A named collection of pages you build and publish together |
| **Page** | A single screen inside an app — has its own URL |
| **Component** | A UI building block you drag onto the canvas (button, text, table, etc.) |
| **Canvas** | The visual editing area where you arrange components |
| **Block Tree** | The left panel showing the hierarchy of all components on the current page |
| **Properties Panel** | The right panel where you configure the selected component |

---

## Quick Start — Build Your First Page

### Step 1 — Create an App

1. On the Studio home screen, click **New App**.
2. Give it a name (e.g. `My Dashboard`).
3. Click **Create**. Studio opens the app editor.

### Step 2 — Create a Page

1. In the left sidebar, click **+ Add Page**.
2. Enter a page name and URL slug (e.g. `home`).
3. Click **Create**. The canvas opens blank.

### Step 3 — Add Components

1. Click the **Components** tab in the left panel (grid icon).
2. Browse or search for a component — e.g. `Text`, `Button`, `Table`.
3. Drag it onto the canvas, or click it to append it to the page.

### Step 4 — Configure a Component

1. Click any component on the canvas to select it.
2. The **Properties Panel** opens on the right.
3. Edit the component's text, style, size, colours, and behaviour.
4. Changes apply live on the canvas as you type.

### Step 5 — Preview the Page

1. Click the **Preview** button (eye icon, top toolbar).
2. The page renders as it will appear to users.
3. Click **Back to Editor** to keep building.

### Step 6 — Publish the App

1. When you're happy with your pages, click **Publish** (top-right).
2. Studio generates the live URL for each page.
3. Share the URL with users — no deployment needed.

---

## The Left Panel at a Glance

| Tab | What it does |
|---|---|
| **Pages** | List of all pages in this app — click to switch |
| **Components** | Palette of all available components to drag onto the canvas |
| **Block Tree** | Hierarchy of every component on the current page |
| **Assets** | Images and files uploaded for use in the app |

---

## The Right Panel at a Glance

| Section | What it does |
|---|---|
| **Properties** | Text, values, and settings for the selected component |
| **Style** | Spacing, size, colours, borders, and typography |
| **Events** | Click handlers and other interactions (coming soon) |

---

## Saving Your Work

Studio **auto-saves** as you build. You will see a subtle save indicator in the toolbar. You can also press **Cmd/Ctrl + S** to force a save at any time.

---

## Tips

- **Undo / Redo** — `Cmd/Ctrl + Z` / `Cmd/Ctrl + Shift + Z`
- **Select a parent** — click a component, then click outside its bounds to select the container
- **Duplicate a component** — right-click on the canvas → **Duplicate**, or `Cmd/Ctrl + D`
- **Delete a component** — select it and press `Backspace` or `Delete`
- **Reorder components** — drag them in the Block Tree for precise control

---

## What's Coming

The following capabilities are in development and will be added to Studio progressively:

- **Form Fields** — bind canvas components directly to Frappe DocType fields
- **PathFinder** — visually navigate DocType relationships to build data bindings
- **Tab Containers** — group form fields into tabbed layouts
- **Portal Lists** — display and edit child table data inline
- **Action Buttons** — wire buttons to DocType methods, form saves, or navigation
- **Theme System** — set brand colours, fonts, and spacing that apply across the whole app

---

## Getting Help

Contact your system administrator or the Studio development team.