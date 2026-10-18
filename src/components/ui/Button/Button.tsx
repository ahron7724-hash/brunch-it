import clsx from "clsx";
import Link from "next/link";
import type { ComponentProps } from "react";

import styles from "./Button.module.css";

type Variant = "primary" | "line" | "text";
type Tone = "default" | "onImage";

type StyleProps = { variant?: Variant; tone?: Tone };

function buttonClassName({ variant = "primary", tone = "default" }: StyleProps, className?: string) {
  return clsx(styles.button, styles[variant], tone === "onImage" && styles.onImage, className);
}

type ButtonProps = ComponentProps<"button"> & StyleProps;

export function Button({ variant, tone, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClassName({ variant, tone }, className)} {...props} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & StyleProps;

export function ButtonLink({ variant, tone, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClassName({ variant, tone }, className)} {...props} />;
}
