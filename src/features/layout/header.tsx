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
        Features
      </Link>
      <Link
        href="/use-cases"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        Use cases
      </Link>
      <Link
        href="/docs"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        Docs
      </Link>
      <Link
        href="/about"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        About
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
