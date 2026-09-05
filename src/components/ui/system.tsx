import React from "react";
import {
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Ellipsis,
  Info,
  Loader2,
  Menu,
  MoreHorizontal,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { designTokens } from "./design-tokens";

export const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const baseInputClasses =
  "w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text)] shadow-[var(--shadow-sm)] transition-all duration-200 placeholder:text-[var(--color-text-soft)] focus:border-[var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-soft)] disabled:cursor-not-allowed disabled:opacity-60";

const baseCardClasses =
  "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  className,
  ...props
}: ButtonProps) {
  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      "bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-strong)] shadow-[var(--shadow-sm)]",
    secondary:
      "bg-[var(--color-surface-muted)] text-[var(--color-text)] hover:bg-[var(--color-surface)] border border-[var(--color-border)]",
    ghost: "text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]",
    danger: "bg-[var(--color-danger)] text-white hover:opacity-95",
  };

  const sizeClasses: Record<ButtonSize, string> = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-5 text-base",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-medium transition-[background-color,box-shadow,transform] duration-200 ease-out focus:outline-none focus-visible:ring-3 focus-visible:ring-[var(--color-brand-soft)] disabled:cursor-not-allowed disabled:opacity-60 kdp-button-feedback motion-reduce:transform-none motion-reduce:transition-none",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export function Input({ label, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="w-full">
      {label ? (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
        >
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={cn(baseInputClasses, className)}
        {...props}
      />
      {hint ? (
        <p className="mt-1 text-xs text-[var(--color-text-soft)]">{hint}</p>
      ) : null}
    </div>
  );
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Array<{ label: string; value: string }>;
}

export function Select({
  label,
  options,
  className,
  id,
  ...props
}: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="w-full">
      {label ? (
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
        >
          {label}
        </label>
      ) : null}
      <div className="relative">
        <select
          id={selectId}
          className={cn(baseInputClasses, "appearance-none pr-10", className)}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-soft)]" />
      </div>
    </div>
  );
}

export interface DropdownItem {
  label: React.ReactNode;
  value?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
  className?: string;
}

export function Dropdown({
  trigger,
  items,
  align = "left",
  className,
}: DropdownProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className={cn("relative inline-block", className)}>
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-text)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--color-surface-muted)]"
      >
        {trigger}
        <ChevronDown className="h-4 w-4 text-[var(--color-text-soft)]" />
      </button>
      {open ? (
        <div
          className={cn(
            "absolute z-20 mt-2 min-w-48 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-[var(--shadow-lg)]",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {items.map((item) => (
            <button
              key={item.value ?? `${String(item.label)}-${Math.random()}`}
              type="button"
              disabled={item.disabled}
              onClick={() => {
                item.onClick?.();
                setOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-[var(--radius-md)] px-3 py-2 text-left text-sm text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: ModalProps) {
  if (!open) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[2px]">
      <div
        className={cn(
          "w-full kdp-modal-enter rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)]",
          sizeClasses[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-5 py-4">
          <div>
            {title ? (
              <h3 className="text-lg font-semibold text-[var(--color-text)]">
                {title}
              </h3>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--radius-sm)] p-1.5 text-[var(--color-text-soft)] transition hover:bg-[var(--color-surface-muted)]"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer ? (
          <div className="border-t border-[var(--color-border)] px-5 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  position?: "left" | "right";
  title?: React.ReactNode;
  children?: React.ReactNode;
}

export function Drawer({
  open,
  onClose,
  position = "right",
  title,
  children,
}: DrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[2px]">
      <div
        className={cn(
          "absolute top-0 h-full w-full max-w-md border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)] transition-transform duration-200 kdp-drawer-enter",
          position === "left" ? "left-0" : "right-0",
        )}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <div className="text-lg font-semibold text-[var(--color-text)]">
            {title}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--radius-sm)] p-1.5 text-[var(--color-text-soft)] hover:bg-[var(--color-surface-muted)]"
            aria-label="Close drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ content, children, side = "top" }: TooltipProps) {
  const sideClasses = {
    top: "-top-2 -translate-y-full",
    bottom: "-bottom-2 translate-y-full",
    left: "-left-2 -translate-x-full",
    right: "-right-2 translate-x-full",
  };

  return (
    <span className="group relative inline-flex items-center">
      {children}
      <span
        className={cn(
          "pointer-events-none absolute z-30 whitespace-nowrap rounded-[var(--radius-sm)] bg-slate-900 px-2 py-1 text-xs text-white opacity-0 shadow-[var(--shadow-md)] transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100",
          sideClasses[side],
        )}
      >
        {content}
      </span>
    </span>
  );
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "brand" | "success" | "warning" | "danger";
}

export function Badge({
  children,
  variant = "neutral",
  className,
  ...props
}: BadgeProps) {
  const variantClasses: Record<string, string> = {
    neutral:
      "bg-[var(--color-surface-muted)] text-[var(--color-text)] border border-[var(--color-border)]",
    brand:
      "bg-[var(--color-brand-soft)] text-[var(--color-brand-strong)] border border-[var(--color-brand-soft)]",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border border-amber-200",
    danger: "bg-red-50 text-red-700 border border-red-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold",
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
}

export function Card({
  children,
  padded = true,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        baseCardClasses,
        padded ? "p-5" : "",
        "kdp-card-hover",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface TableProps {
  headers: Array<string | React.ReactNode>;
  rows: Array<Array<string | React.ReactNode>>;
  className?: string;
}

export function Table({ headers, rows, className }: TableProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]",
        className,
      )}
    >
      <table className="min-w-full text-left text-sm">
        <thead className="bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]">
          <tr>
            {headers.map((header, index) => (
              <th key={`header-${index}`} className="px-4 py-3 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={`row-${rowIndex}`}
              className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]/70"
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={`cell-${rowIndex}-${cellIndex}`}
                  className="px-4 py-3 align-middle text-[var(--color-text)]"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export interface TabItem {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  defaultTab?: string;
}

export function Tabs({ items, defaultTab }: TabsProps) {
  const [activeTab, setActiveTab] = React.useState(
    defaultTab ?? items[0]?.id ?? "",
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-1">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition",
              activeTab === item.id
                ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-[var(--shadow-sm)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {items.find((item) => item.id === activeTab)?.content ?? null}
      </div>
    </div>
  );
}

export interface ToastProps {
  title: string;
  description?: string;
  variant?: "default" | "success" | "warning" | "danger";
}

export function Toast({ title, description, variant = "default" }: ToastProps) {
  const variantClasses = {
    default:
      "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    danger: "border-red-200 bg-red-50 text-red-900",
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex max-w-md items-start gap-3 rounded-[var(--radius-lg)] border p-3 shadow-[var(--shadow-md)]",
        variantClasses[variant],
      )}
    >
      <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-current/10">
        {variant === "danger" ? (
          <AlertCircle className="h-3.5 w-3.5" />
        ) : (
          <Info className="h-3.5 w-3.5" />
        )}
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        {description ? (
          <p className="mt-1 text-xs opacity-80">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

export interface AlertProps {
  title: string;
  description?: string;
  variant?: "info" | "success" | "warning" | "danger";
}

export function Alert({ title, description, variant = "info" }: AlertProps) {
  const variantClasses = {
    info: "border-sky-200 bg-sky-50 text-sky-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    danger: "border-red-200 bg-red-50 text-red-900",
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-[var(--radius-lg)] border p-4",
        variantClasses[variant],
      )}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        {description ? (
          <p className="mt-1 text-sm opacity-80">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

export interface ChartDatum {
  label: string;
  value: number;
  color?: string;
}

export interface ChartProps {
  data: ChartDatum[];
  height?: number;
}

export function Chart({ data, height = 180 }: ChartProps) {
  const maxValue = Math.max(...data.map((entry) => entry.value), 1);
  const barWidth = 100 / Math.max(data.length, 1);

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
      <svg
        viewBox={`0 0 100 ${height}`}
        className="h-[180px] w-full overflow-visible"
        role="img"
        aria-label="Chart"
      >
        {data.map((entry, index) => {
          const barHeight = (entry.value / maxValue) * (height - 28);
          const x = index * barWidth + 4;
          const y = height - 16 - barHeight;

          return (
            <g key={`${entry.label}-${index}`}>
              <rect
                x={x}
                y={y}
                width={barWidth - 8}
                height={barHeight}
                rx={6}
                fill={entry.color ?? "var(--color-brand)"}
                className="kdp-chart-bar"
              />
              <text
                x={x + (barWidth - 8) / 2}
                y={height - 4}
                textAnchor="middle"
                fontSize="4"
                fill="var(--color-text-soft)"
              >
                {entry.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((pageNumber) => (
        <button
          key={pageNumber}
          type="button"
          onClick={() => onPageChange(pageNumber)}
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-sm font-medium transition",
            page === pageNumber
              ? "bg-[var(--color-brand)] text-white"
              : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]",
          )}
        >
          {pageNumber}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number;
}

export function Skeleton({ lines = 3, className, ...props }: SkeletonProps) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "animate-pulse rounded-[var(--radius-md)] bg-[linear-gradient(90deg,rgba(148,163,184,0.15),rgba(148,163,184,0.3),rgba(148,163,184,0.15))]",
            index === 0
              ? "h-6 w-3/4"
              : index === lines - 1
                ? "h-5 w-1/2"
                : "h-5 w-full",
          )}
        />
      ))}
    </div>
  );
}

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-text-soft)] shadow-[var(--shadow-sm)]">
        <Search className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--color-text)]">
        {title}
      </h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-[var(--color-text-muted)]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center gap-3 text-[var(--color-text-muted)]">
      <Loader2 className="h-5 w-5 animate-spin text-[var(--color-brand)]" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

export interface NavItem {
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

export interface NavigationProps {
  items: NavItem[];
  className?: string;
}

export function Navigation({ items, className }: NavigationProps) {
  return (
    <nav className={cn("flex flex-wrap items-center gap-2", className)}>
      {items.map((item, index) => (
        <button
          key={`${item.label}-${index}`}
          type="button"
          onClick={item.onClick}
          className={cn(
            "inline-flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition",
            item.active
              ? "bg-[var(--color-brand-soft)] text-[var(--color-brand-strong)]"
              : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]",
          )}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </nav>
  );
}

export interface SidebarProps {
  items: Array<{
    label: string;
    icon?: React.ReactNode;
    active?: boolean;
    onClick?: () => void;
  }>;
  footer?: React.ReactNode;
}

export function Sidebar({ items, footer }: SidebarProps) {
  return (
    <aside className="flex min-h-screen w-72 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
      <div className="mb-6 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-brand)] text-white shadow-[var(--shadow-sm)]">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-base font-semibold text-[var(--color-text)]">
            KDP Orbit
          </p>
          <p className="text-xs text-[var(--color-text-soft)]">
            Publishing intelligence
          </p>
        </div>
      </div>
      <nav className="space-y-1">
        {items.map((item, index) => (
          <button
            key={`${item.label}-${index}`}
            type="button"
            onClick={item.onClick}
            className={cn(
              "flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-left text-sm font-medium transition",
              item.active
                ? "bg-[var(--color-brand-soft)] text-[var(--color-brand-strong)]"
                : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]",
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
      {footer ? <div className="mt-auto">{footer}</div> : null}
    </aside>
  );
}

export interface HeaderProps {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
}

export function Header({ title, actions, breadcrumb }: HeaderProps) {
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 px-5 py-4 backdrop-blur-md">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          {breadcrumb ? (
            <div className="mb-1 text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-text-soft)]">
              {breadcrumb}
            </div>
          ) : null}
          {title ? (
            <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
              {title}
            </h1>
          ) : null}
        </div>
        {actions ? (
          <div className="flex items-center gap-3">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}

export interface FooterProps {
  children?: React.ReactNode;
  className?: string;
}

export function Footer({ children, className }: FooterProps) {
  return (
    <footer
      className={cn(
        "border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 text-sm text-[var(--color-text-muted)]",
        className,
      )}
    >
      {children ?? "© 2026 KDP Orbit. Built for focused publishing decisions."}
    </footer>
  );
}

export const ui = {
  designTokens,
  Button,
  Input,
  Select,
  Dropdown,
  Modal,
  Drawer,
  Tooltip,
  Badge,
  Card,
  Table,
  Tabs,
  Toast,
  Alert,
  Chart,
  Pagination,
  Skeleton,
  EmptyState,
  LoadingState,
  Navigation,
  Sidebar,
  Header,
  Footer,
};

export default ui;
