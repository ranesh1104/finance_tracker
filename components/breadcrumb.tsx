import Link from "next/link"
import { ChevronRight } from "lucide-react"

interface BreadcrumbProps {
  items: {
    label: string
    href: string
  }[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center text-sm text-muted-foreground mb-4">
      {items.map((item, index) => (
        <div key={item.href} className="flex items-center">
          {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
          <Link
            href={item.href}
            className={
              index === items.length - 1 ? "font-medium text-foreground" : "hover:text-foreground transition-colors"
            }
          >
            {item.label}
          </Link>
        </div>
      ))}
    </nav>
  )
}

