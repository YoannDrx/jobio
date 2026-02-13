import { getPublicPortalBySlug } from "@/features/portal/portal.action";
import { SiteConfig } from "@/site-config";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/features/page/layout";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Briefcase,
  GraduationCap,
  Globe,
  Code,
  FolderOpen,
  Euro,
  CalendarCheck,
} from "lucide-react";

type PageParams = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const portal = await getPublicPortalBySlug(slug);

  if (!portal || !portal.isPublic) {
    return { title: "Profil introuvable" };
  }

  const title = `${portal.profile.name} | ${SiteConfig.title}`;
  const description = portal.customBio ?? portal.profile.headline;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SiteConfig.prodUrl}/p/${slug}`,
      type: "profile",
    },
  };
}

type Skill = { name: string; level?: string };
type Experience = {
  title: string;
  company: string;
  startDate?: string;
  endDate?: string;
  description?: string;
};
type Education = {
  degree: string;
  school: string;
  year?: string;
};
type Project = {
  name: string;
  description?: string;
  url?: string;
};
type Language = {
  name: string;
  level?: string;
};

export default async function PortalPage({ params }: PageParams) {
  const { slug } = await params;
  const portal = await getPublicPortalBySlug(slug);

  if (!portal || !portal.isPublic) {
    notFound();
  }

  const { profile, user } = portal;
  const bio = portal.customBio ?? profile.bio;

  const skills = (profile.skills as Skill[] | null) ?? [];
  const experiences = (profile.experiences as Experience[] | null) ?? [];
  const education = (profile.education as Education[] | null) ?? [];
  const projects = (profile.projects as Project[] | null) ?? [];
  const languages = (profile.languages as Language[] | null) ?? [];

  return (
    <div className="relative isolate overflow-hidden pb-16">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="from-primary/15 via-brand-cyan/10 to-brand-emerald/15 absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b" />
        <div className="bg-background absolute inset-x-0 bottom-0 h-[300px]" />
        <div className="bg-brand-cyan/20 absolute top-24 left-[8%] size-40 rounded-full blur-3xl" />
        <div className="bg-brand-emerald/20 absolute top-16 right-[12%] size-44 rounded-full blur-3xl" />
      </div>

      <Layout size="lg" className="pt-14 pb-8">
        <div className="flex w-full flex-col gap-5 rounded-3xl border border-white/60 bg-white/80 p-8 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-black/20">
          <div className="flex items-center gap-4">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || ""}
                className="size-16 rounded-full object-cover"
              />
            ) : null}
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {profile.name}
              </h1>
              <p className="text-muted-foreground text-base sm:text-lg">
                {profile.headline}
              </p>
            </div>
          </div>
          {bio ? (
            <p className="text-muted-foreground max-w-3xl leading-relaxed">
              {bio}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {portal.showAvailability && profile.workTypePreference ? (
              <Badge variant="outline">{profile.workTypePreference}</Badge>
            ) : null}
            {portal.showAvailability && profile.zone ? (
              <Badge variant="outline">{profile.zone}</Badge>
            ) : null}
            {portal.showTjm && profile.tjmTarget ? (
              <Badge variant="outline">{profile.tjmTarget} EUR/j</Badge>
            ) : null}
          </div>
        </div>
      </Layout>

      <Layout size="lg">
        <div className="grid w-full gap-4 md:grid-cols-2">
          {portal.showSkills && skills.length > 0 ? (
            <Section icon={Code} title="Competences">
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge key={skill.name} variant="secondary">
                    {skill.name}
                    {skill.level ? ` - ${skill.level}` : ""}
                  </Badge>
                ))}
              </div>
            </Section>
          ) : null}

          {portal.showExperiences && experiences.length > 0 ? (
            <Section icon={Briefcase} title="Experiences">
              <div className="flex flex-col gap-4">
                {experiences.map((exp, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <p className="font-medium">{exp.title}</p>
                    <p className="text-muted-foreground text-sm">
                      {exp.company}
                      {exp.startDate ? ` | ${exp.startDate}` : ""}
                      {exp.endDate ? ` - ${exp.endDate}` : ""}
                    </p>
                    {exp.description ? (
                      <p className="text-muted-foreground text-sm">
                        {exp.description}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </Section>
          ) : null}

          {portal.showEducation && education.length > 0 ? (
            <Section icon={GraduationCap} title="Formation">
              <div className="flex flex-col gap-3">
                {education.map((edu, i) => (
                  <div key={i}>
                    <p className="font-medium">{edu.degree}</p>
                    <p className="text-muted-foreground text-sm">
                      {edu.school}
                      {edu.year ? ` | ${edu.year}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </Section>
          ) : null}

          {portal.showProjects && projects.length > 0 ? (
            <Section icon={FolderOpen} title="Projets">
              <div className="flex flex-col gap-3">
                {projects.map((proj, i) => (
                  <div key={i}>
                    <p className="font-medium">{proj.name}</p>
                    {proj.description ? (
                      <p className="text-muted-foreground text-sm">
                        {proj.description}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </Section>
          ) : null}

          {portal.showLanguages && languages.length > 0 ? (
            <Section icon={Globe} title="Langues">
              <div className="flex flex-wrap gap-2">
                {languages.map((lang) => (
                  <Badge key={lang.name} variant="secondary">
                    {lang.name}
                    {lang.level ? ` - ${lang.level}` : ""}
                  </Badge>
                ))}
              </div>
            </Section>
          ) : null}

          {portal.showTjm && profile.tjmTarget ? (
            <Section icon={Euro} title="Tarification">
              <p className="text-2xl font-bold">{profile.tjmTarget} EUR/jour</p>
              {profile.minDuration || profile.maxDuration ? (
                <p className="text-muted-foreground text-sm">
                  Duree : {profile.minDuration ?? "?"} -{" "}
                  {profile.maxDuration ?? "?"}
                </p>
              ) : null}
            </Section>
          ) : null}

          {portal.showAvailability ? (
            <Section icon={CalendarCheck} title="Disponibilite">
              <div className="flex flex-col gap-2">
                {profile.workTypePreference ? (
                  <p>
                    <span className="text-muted-foreground text-sm">
                      Type :{" "}
                    </span>
                    <span className="font-medium">
                      {profile.workTypePreference}
                    </span>
                  </p>
                ) : null}
                {profile.zone ? (
                  <p>
                    <span className="text-muted-foreground text-sm">
                      Zone :{" "}
                    </span>
                    <span className="font-medium">{profile.zone}</span>
                  </p>
                ) : null}
              </div>
            </Section>
          ) : null}
        </div>
      </Layout>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="w-full rounded-2xl border border-black/5 bg-white/80 p-6 shadow-sm backdrop-blur-md sm:p-7 dark:border-white/10 dark:bg-black/20">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="text-primary size-5" />
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  );
}
