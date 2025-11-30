"use client"

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

/**
 * Root component for the Collapsible.
 *
 * @param props - Props for the Collapsible Root.
 * @returns The rendered Collapsible Root.
 */
function Collapsible({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

/**
 * Trigger to toggle the Collapsible.
 *
 * @param props - Props for the Collapsible Trigger.
 * @returns The rendered Collapsible Trigger.
 */
function CollapsibleTrigger({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      {...props}
    />
  )
}

/**
 * Content that is shown/hidden by the Collapsible.
 *
 * @param props - Props for the Collapsible Content.
 * @returns The rendered Collapsible Content.
 */
function CollapsibleContent({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      {...props}
    />
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
