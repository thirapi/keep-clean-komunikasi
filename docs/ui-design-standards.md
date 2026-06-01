# UI Design Standards

This document outlines the design standards for the Komunikasi platform to ensure consistency across light and dark modes and maintain a polished, modern aesthetic.

## 1. Core Principles
- **Border-Based Structure**: Components should rely on borders (e.g., `border-border`) rather than background color differentiation to separate elements. This approach naturally adapts to both light and dark themes without creating high-contrast background conflicts.
- **Theme Awareness**: Avoid hardcoded background colors. Utilize Tailwind utility classes referencing CSS variables (`bg-background`, `bg-card`, `bg-accent`, `bg-muted`) to ensure colors adapt dynamically.
- **Subtle Interactions**: Hover states should be subtle, typically using `hover:bg-muted/10` or `hover:bg-accent` to maintain a clean interface.

## 2. Component Guidelines

### Post Item & Post Input
- **Container**: Use border-bottom (`border-b border-border`) for vertical separation.
- **Backgrounds**: Avoid background color differentiation for post items and inputs. Keep backgrounds transparent or use the theme's base `bg-background` to ensure a cohesive page look.
- **Input Fields**: Collapsed input views should use a border-only style (`border border-border`) with no background (`bg-transparent`) or extremely subtle background (`bg-muted/10`) on hover.

### Navigation & Buttons
- **Back/Chevron Buttons**: Always use `hover:bg-accent` and `text-foreground` to ensure visibility and consistency across themes. Avoid hardcoded border colors or fixed background opacities.

## 3. Color Palette Recommendations

The current system utilizes OKLCH color space for dynamic theme adaptability. When adding new components:

| Role | Variable |
| :--- | :--- |
| **Main Surface** | `var(--background)` |
| **Card Surface** | `var(--card)` |
| **Borders** | `var(--border)` |
| **Text** | `var(--foreground)` |
| **Muted Text** | `var(--muted-foreground)` |
| **Accent/Hover** | `var(--accent)` |

*Always prefer these variables over hex/rgb hardcoding.*

--
*Created: June 2026*
