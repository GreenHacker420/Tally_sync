"use client";

import React from "react";
import { useForm, FormProvider, useFormContext, FieldPath, FieldValues } from "react-hook-form";
import { cn } from "@/lib/utils";

interface FormProps<T extends FieldValues> extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
  onSubmit: (data: T) => void | Promise<void>;
  defaultValues?: Partial<T>;
  mode?: "onChange" | "onBlur" | "onSubmit" | "onTouched" | "all";
}

interface FormFieldProps<T extends FieldValues> {
  name: FieldPath<T>;
  children: React.ReactNode;
  className?: string;
}

interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  required?: boolean;
}

interface FormControlProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface FormDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
}

function Form<T extends FieldValues>({
  children,
  onSubmit,
  defaultValues,
  mode = "onSubmit",
  className,
  ...props
}: FormProps<T>) {
  const methods = useForm<T>({
    defaultValues,
    mode,
  });

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className={cn("space-y-6", className)}
        {...props}
      >
        {children}
      </form>
    </FormProvider>
  );
}

function FormField<T extends FieldValues>({
  name,
  children,
  className,
}: FormFieldProps<T>) {
  return (
    <div className={cn("space-y-2", className)}>
      {typeof children === "function" ? children({ name }) : children}
    </div>
  );
}

const FormItem = React.forwardRef<HTMLDivElement, FormItemProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {children}
      </div>
    );
  }
);

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, children, required, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700",
          className
        )}
        {...props}
      >
        {children}
        {required && <span className="text-error-500 ml-1">*</span>}
      </label>
    );
  }
);

const FormControl = React.forwardRef<HTMLDivElement, FormControlProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={className} {...props}>
        {children}
      </div>
    );
  }
);

const FormDescription = React.forwardRef<HTMLParagraphElement, FormDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn("text-sm text-gray-600", className)}
        {...props}
      >
        {children}
      </p>
    );
  }
);

const FormMessage = React.forwardRef<HTMLParagraphElement, FormMessageProps>(
  ({ className, children, ...props }, ref) => {
    const { formState } = useFormContext();
    const error = formState.errors[props.id as string];

    if (!error && !children) return null;

    return (
      <p
        ref={ref}
        className={cn("text-sm font-medium text-error-600", className)}
        {...props}
      >
        {children || error?.message}
      </p>
    );
  }
);

FormItem.displayName = "FormItem";
FormLabel.displayName = "FormLabel";
FormControl.displayName = "FormControl";
FormDescription.displayName = "FormDescription";
FormMessage.displayName = "FormMessage";

export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
};
