import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Root navigation component for Breadcrumbs.
 *
 * @param props - Props for the nav element.
 * @returns The rendered Breadcrumb nav.
 */
function Breadcrumb({ ...props }: React.ComponentProps<"nav">) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />
}

/**
 * Ordered list container for Breadcrumb items.
 *
 * @param props - Props for the ol element.
 * @returns The rendered Breadcrumb list.
 */
function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5",
        className
      )}
      {...props}
    />
  )
}

/**
 * Individual item within the Breadcrumb list.
 *
 * @param props - Props for the li element.
 * @returns The rendered Breadcrumb item.
 */
function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    />
  )
}

/**
 * Props for the BreadcrumbLink component.
 */
export interface BreadcrumbLinkProps extends React.ComponentProps<"a"> {
  /** If true, renders as a child component. */
  asChild?: boolean
}

/**
 * Link component for a Breadcrumb item.
 *
 * @param props - Props for the Breadcrumb Link.
 * @returns The rendered Breadcrumb link.
 */
function BreadcrumbLink({
  asChild,
  className,
  ...props
}: BreadcrumbLinkProps) {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cn("hover:text-foreground transition-colors", className)}
      {...props}
    />
  )
}

/**
 * Component representing the current page in the Breadcrumb.
 *
 * @param props - Props for the span element.
 * @returns The rendered Breadcrumb page.
 */
function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("text-foreground font-normal", className)}
      {...props}
    />
  )
}

/**
 * Separator component between Breadcrumb items.
 *
 * @param props - Props for the separator.
 * @returns The rendered separator.
 */
function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("[&>svg]:size-3.5", className)}
      {...props}
    >
      {children ?? <ChevronRight />}
    </li>
  )
}

/**
 * Ellipsis component for truncated Breadcrumbs.
 *
 * @param props - Props for the ellipsis.
 * @returns The rendered ellipsis.
 */
function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More</span>
    </span>
  )
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}
