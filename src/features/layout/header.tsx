import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { AuthButton } from "../auth/auth-button";
import { HeaderBase } from "./header-base";

export function Header() {
  return (
    <HeaderBase>
      <Link
        href="/features"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        Fonctionnalités
      </Link>
      <Link
        href="/use-cases"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        Cas d’usage
      </Link>
      <Link
        href="/docs"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        Documentation
      </Link>
      <Link
        href="/about"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        À propos
      </Link>
      <Link
        href="/blog"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        Blog
      </Link>
      <Link
        href="/contact"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        Contact
      </Link>
      <AuthButton />
    </HeaderBase>
  );
}
