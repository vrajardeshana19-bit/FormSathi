# FormSaathi – Organic Editorial Design Transformation

## 1. Design Direction: Organic Editorial

FormSaathi's interface follows an **Organic Editorial** visual signature:
- **Philosophy**: *"A little bold in composition. Natural in shape. Minimal in execution. Exceptional in detail."*
- **Inspirations**: Premium editorial websites, modern fintech product design, contemporary organic architecture, and typography-led applications.
- **Surface Layering**: Deep Teal hero surfaces with asymmetrical organic curved transitions, layered over Paper Ivory with subtle background contour lines and Soft Sage accents.

---

## 2. Official Colour System

| Token | Hex | Role |
|---|---|---|
| **Deep Teal** | `#174B4F` | Primary brand surface, hero canvas, primary action buttons, active navigation states |
| **Secondary Sage** | `#496A60` | Secondary headings, icons, context indicators |
| **Soft Sage** | `#DCE8E2` | Selected field highlights, interpreted answer surfaces, pill badges |
| **Paper Ivory** | `#F7F6F1` | Dominant application canvas |
| **Deep Ink** | `#263433` | Primary editorial headings and question text |
| **Muted Ink** | `#5F7371` | Secondary labels, captions, and context notes |
| **Fine Border** | `#E3E5DD` | Structural 1px separation lines |
| **Warm Ochre** | `#A96F2D` | Sensitive field alerts, skipped questions, and manual entry indicators |
| **Pale Ochre** | `#F1E6D5` | Warning/manual entry container backgrounds |

---

## 3. Structural & Component Composition

### A. Welcome Screen (Editorial Hero Composition)
- **Top Brand Bar**: Compact FormSaathi brand mark + wordmark + segmented English/Kannada selector + settings link.
- **Deep Teal Organic Hero**: Sculptural asymmetrical curved bottom boundary created with bespoke SVG contour paths.
- **Bespoke Form Assistance Artwork**: Custom SVG illustration representing voice-guided form completion with guided path nodes and acoustic soundwaves.
- **Overlapping Application Card**: Floats over the organic curve with subtle negative margin, displaying application name, field count, and status.
- **Segmented Language Selector**: Compact pill switch between `English (EN)` and `ಕನ್ನಡ (KN)`.
- **Integrated Privacy Commitments**: Three structured commitments embedded as an interconnected editorial section.
- **Prominent Action**: Primary Teal "Start Form Assistant" button.

### B. Active Form Assistant (Functionality-First Editorial Layout)
- **Compact Sticky Header**: Includes brand mark, form name, quick language toggle (`EN | KN`), and progress counter.
- **Typographic Question Focus**: Question text in bold Deep Ink with an organic corner tab and secondary context explanation.
- **Integrated Voice Interaction**: Natural central microphone stage with organic audio wave visualization and inline text typing toggle.
- **Interpreted Answer Preview**: Rendered in a Soft Sage (`#DCE8E2`) surface with Deep Teal typography before filling.
- **Primary Action**: Primary Teal "Confirm and Fill" action with immediate webpage filling and highlighting.
- **Secondary Actions**: "Repeat Question" and "Skip for Now" side-by-side.
- **Privacy Assurance**: Quiet footer note indicating client-side processing and manual submission requirement.

### C. Application Review, Privacy Centre & Settings
- **Review**: Segmented metric pills, manual submission requirement banner, grouped field list with one-click return to edit.
- **Privacy Centre**: Architectural clarity detailing client-side exclusion of passwords, OTPs, and bank accounts.
- **Settings**: Segmented language selector, browser voice diagnostics (TTS/STT detection), speech speed slider, and high-contrast mode.

---

## 4. Local Development & Testing

- **Dev Server**: `npm run dev` starts Vite at `http://localhost:5173/`.
- **Demo Form**: Open `http://localhost:5173/demo` to test real DOM scanning and filling.
- **Production Build**: `npm run build` compiles TypeScript and Vite bundles into `extension/dist/`.
- **Chrome Side Panel**: Load unpacked `extension/dist/` in `chrome://extensions/`.
