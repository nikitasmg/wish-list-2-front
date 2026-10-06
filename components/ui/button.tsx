import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react"; // Импортируем иконку загрузки

/*
 * Кнопка дизайн-системы (docs/design-system.md). Нажатие сжимает до 0.97 —
 * отклик на касание, а не только на отпускание. Высота и скругление идут
 * парой: чем выше кнопка, тем больше радиус.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-[transform,background-color,color,opacity] duration-fast active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Цвет схемы — роль «Кнопка». Работает и в интерфейсе, и у гостя.
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90",
        // Главное действие интерфейса — градиент из акцентов схемы.
        brand:
          "bg-brand text-white font-bold hover:opacity-90",
        // Главное действие Тайного Санты.
        festive:
          "bg-festive text-white font-bold hover:opacity-90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-transparent hover:bg-secondary",
        secondary:
          "border border-border bg-card text-foreground hover:bg-secondary",
        ghost: "hover:bg-secondary hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        sm: "h-control-sm rounded-tag px-3 text-label",
        default: "h-control rounded-control px-4 text-body-sm",
        lg: "h-control-lg rounded-control-lg px-5 text-body",
        xl: "h-control-xl rounded-control-lg px-6 text-body",
        "icon-sm": "size-control-sm rounded-tag",
        icon: "size-control rounded-control",
        "icon-lg": "size-control-lg rounded-control-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean; // Добавляем пропс loading
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={loading || props.disabled} // Отключаем кнопку при загрузке
        {...props}
      >
        {loading ? (
          <Loader2 className="animate-spin" /> // Отображаем иконку загрузки
        ) : (
          children // Отображаем текст кнопки
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };