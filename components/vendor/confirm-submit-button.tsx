"use client";

/**
 * A form submit button that shows a native confirm() before letting the
 * submit go through — for Server Action forms where a plain <button
 * type="submit"> would fire on the first click with no confirmation step
 * (e.g. advancing/cancelling an order, publishing/deleting a product).
 */
export function ConfirmSubmitButton({
  confirmMessage,
  className,
  children,
  ...props
}: {
  confirmMessage: string;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type" | "onClick">) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
}
