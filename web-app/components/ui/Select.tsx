"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";

type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange" | "value" | "children" | "type"
> & {
  value: string;
  onChange: (value: string) => void;
  /** `<option>` (and `<optgroup>`) children, as with a native select. */
  children: ReactNode;
  /** Classes for the positioning wrapper (e.g. width, margins). */
  wrapperClassName?: string;
  /** Dense toolbar/filter sizing. */
  compact?: boolean;
  /** Borderless inline variant for toolbars that already have a container. */
  plain?: boolean;
  /** Leave room on the left for an icon rendered by the parent. */
  leading?: boolean;
  /** Renders a hidden input so the value is submitted with a plain form. */
  name?: string;
  /** Marks the control required for assistive tech (validate in the form). */
  required?: boolean;
  /** Shown when the value matches no option. */
  placeholder?: string;
};

type PanelPosition = {
  left: number;
  width: number;
  maxHeight: number;
  top?: number;
  bottom?: number;
};

const PANEL_MAX_HEIGHT = 320;
const SEARCH_THRESHOLD = 12;

/** Positions the fixed panel against the trigger, flipping up near the edge. */
function measure(trigger: HTMLElement | null): PanelPosition | null {
  if (!trigger) return null;

  const rect = trigger.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  const openUp =
    spaceBelow < Math.min(PANEL_MAX_HEIGHT, 200) && spaceAbove > spaceBelow;

  const width = Math.min(
    Math.max(rect.width, 200),
    Math.max(200, window.innerWidth - 24),
  );
  const left = Math.min(
    Math.max(12, rect.left),
    Math.max(12, window.innerWidth - width - 12),
  );

  return {
    left,
    width,
    maxHeight: Math.max(
      160,
      Math.min(PANEL_MAX_HEIGHT, (openUp ? spaceAbove : spaceBelow) - 12),
    ),
    ...(openUp
      ? { bottom: window.innerHeight - rect.top + 6 }
      : { top: rect.bottom + 6 }),
  };
}

/** Flattens option text, e.g. `{barangay}, {municipality}`. */
function labelOf(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }
      if (isValidElement(child)) {
        return labelOf((child.props as { children?: ReactNode }).children);
      }
      return "";
    })
    .join("");
}

function collectOptions(
  children: ReactNode,
  options: SelectOption[] = [],
): SelectOption[] {
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;

    const props = child.props as {
      value?: string | number;
      disabled?: boolean;
      children?: ReactNode;
    };

    if (child.type === "optgroup") {
      collectOptions(props.children, options);
      return;
    }

    if (child.type !== "option") return;

    const label = labelOf(props.children).trim();
    options.push({
      value:
        props.value === undefined || props.value === null
          ? label
          : String(props.value),
      label,
      disabled: props.disabled,
    });
  });

  return options;
}

/**
 * Custom dropdown for SK-Ledge.
 *
 * A native `<select>` cannot be themed beyond its closed state: the option list
 * is drawn by the OS. This component replaces both parts with a themed trigger
 * and a portalled listbox (searchable once the list gets long, which matters
 * for the 851 canonical barangays), while keeping form-friendly props such as
 * `name`, `required`, `disabled` and `aria-*`.
 */
export default function Select({
  value,
  onChange,
  children,
  wrapperClassName = "",
  compact = false,
  plain = false,
  leading = false,
  name,
  required = false,
  className = "",
  disabled = false,
  placeholder,
  id,
  ...buttonProps
}: SelectProps) {
  const options = collectOptions(children);
  const searchable = options.length > SEARCH_THRESHOLD;

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [position, setPosition] = useState<PanelPosition | null>(null);

  const generatedId = useId();
  const triggerId = id ?? `select-${generatedId}`;
  const panelId = `${triggerId}-listbox`;

  const visibleOptions = query.trim()
    ? options.filter((option) =>
        option.label.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : options;

  const selected = options.find((option) => option.value === value);
  const displayLabel =
    selected?.label ??
    placeholder ??
    options.find((option) => option.value === "")?.label ??
    "Select an option";

  const openPanel = () => {
    if (disabled || open) return;
    const index = options.findIndex((option) => option.value === value);
    setQuery("");
    setHighlight(index >= 0 ? index : 0);
    setPosition(measure(triggerRef.current));
    setOpen(true);
  };

  const closePanel = () => {
    setOpen(false);
    setQuery("");
  };

  useEffect(() => {
    if (!open) return;

    const reposition = () => setPosition(measure(triggerRef.current));
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
      setQuery("");
    };

    reposition();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const active = listRef.current?.children[highlight] as
      | HTMLElement
      | undefined;
    active?.scrollIntoView({ block: "nearest" });
  }, [highlight, open]);

  const commit = (option: SelectOption) => {
    if (option.disabled) return;
    onChange(option.value);
    closePanel();
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const moveHighlight = (step: number) => {
    if (visibleOptions.length === 0) return;
    let next = highlight;
    for (let attempts = 0; attempts < visibleOptions.length; attempts += 1) {
      next = (next + step + visibleOptions.length) % visibleOptions.length;
      if (!visibleOptions[next]?.disabled) break;
    }
    setHighlight(next);
  };

  const handleKeyDown = (event: ReactKeyboardEvent) => {
    if (!open) {
      if (
        event.key === "ArrowDown" ||
        event.key === "ArrowUp" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        openPanel();
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        moveHighlight(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        moveHighlight(-1);
        break;
      case "Home":
        event.preventDefault();
        setHighlight(0);
        break;
      case "End":
        event.preventDefault();
        setHighlight(Math.max(0, visibleOptions.length - 1));
        break;
      case "Enter": {
        event.preventDefault();
        const option = visibleOptions[highlight];
        if (option) commit(option);
        break;
      }
      case "Escape":
        event.preventDefault();
        closePanel();
        triggerRef.current?.focus();
        break;
      case "Tab":
        closePanel();
        break;
      default:
        break;
    }
  };

  const base = plain
    ? [
        "group inline-flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border-0 bg-transparent py-0 pr-1 text-left font-bold text-primary-foreground outline-none transition-colors hover:text-primary focus-visible:text-primary",
        compact ? "text-xs" : "text-sm",
      ].join(" ")
    : [
        "group flex w-full cursor-pointer items-center justify-between gap-2 rounded-2xl border border-border bg-white text-left",
        "font-semibold text-primary-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        "transition-all hover:border-primary/40",
        "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
        "disabled:cursor-not-allowed disabled:bg-secondary/60 disabled:text-secondary-foreground",
        compact ? "py-2 pr-3 text-xs" : "py-3.5 pr-4 text-sm",
      ].join(" ");

  const leftPadding = plain
    ? ""
    : leading
      ? compact
        ? "pl-9"
        : "pl-12"
      : compact
        ? "pl-3"
        : "pl-4";

  return (
    <div className={`relative ${wrapperClassName}`}>
      {name ? <input type="hidden" name={name} value={value} /> : null}

      <button
        {...buttonProps}
        ref={triggerRef}
        id={triggerId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-required={required || undefined}
        disabled={disabled}
        onClick={() => (open ? closePanel() : openPanel())}
        onKeyDown={handleKeyDown}
        className={[base, leftPadding, className].filter(Boolean).join(" ")}
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            selected ? "" : "font-medium text-secondary-foreground/70"
          }`}
        >
          {displayLabel}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`shrink-0 text-secondary-foreground transition-transform duration-150 group-focus-visible:text-primary ${
            open ? "rotate-180 text-primary" : ""
          } ${plain ? "h-4 w-4" : compact ? "h-3.5 w-3.5" : "h-4 w-4"}`}
        />
      </button>

      {open && position && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              role="listbox"
              id={panelId}
              aria-labelledby={triggerId}
              style={
                {
                  position: "fixed",
                  left: position.left,
                  width: position.width,
                  maxHeight: position.maxHeight,
                  top: position.top,
                  bottom: position.bottom,
                } as CSSProperties
              }
              className="z-[90] flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-[0_24px_48px_-24px_rgba(15,23,42,0.35)]"
            >
              {searchable ? (
                <div className="border-b border-border/70 p-2">
                  <div className="relative">
                    <Search
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-secondary-foreground"
                    />
                    <input
                      autoFocus
                      type="text"
                      value={query}
                      onChange={(event) => {
                        setQuery(event.target.value);
                        setHighlight(0);
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder="Search…"
                      aria-label="Search options"
                      aria-controls={panelId}
                      className="w-full rounded-xl border border-border bg-secondary/40 py-2 pl-8 pr-3 text-xs font-semibold text-primary-foreground outline-none transition-colors placeholder:font-medium placeholder:text-secondary-foreground/70 focus:border-primary focus:bg-white"
                    />
                  </div>
                </div>
              ) : null}

              <div ref={listRef} className="overflow-y-auto p-1.5">
                {visibleOptions.length === 0 ? (
                  <p className="px-3 py-2.5 text-xs font-medium text-secondary-foreground">
                    No matches
                  </p>
                ) : (
                  visibleOptions.map((option, index) => {
                    const isSelected = option.value === value;
                    const isHighlighted = index === highlight;

                    return (
                      <button
                        key={`${option.value}-${index}`}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        disabled={option.disabled}
                        onMouseEnter={() => setHighlight(index)}
                        onClick={() => commit(option)}
                        className={[
                          "flex w-full items-center justify-between gap-2 rounded-xl px-3 text-left transition-colors",
                          compact ? "py-1.5 text-xs" : "py-2 text-sm",
                          option.disabled
                            ? "cursor-not-allowed text-secondary-foreground/50"
                            : "cursor-pointer",
                          isSelected
                            ? "bg-primary/[0.08] font-bold text-primary"
                            : isHighlighted
                              ? "bg-secondary font-semibold text-primary-foreground"
                              : "font-medium text-primary-foreground",
                        ].join(" ")}
                      >
                        <span className="truncate">{option.label}</span>
                        {isSelected ? (
                          <Check
                            aria-hidden="true"
                            className="h-3.5 w-3.5 shrink-0 text-primary"
                          />
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
