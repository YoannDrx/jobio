import { redirect } from "next/navigation";

export default function CvLabPage() {
  redirect("/job/cv-studio?tab=editor");
}
