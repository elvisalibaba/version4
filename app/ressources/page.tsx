import { BookOpen, HelpCircle, Lightbulb, Trophy, Video } from "lucide-react";

const blogTopics = [
  "Conseils pour écrire un livre",
  "Conseils pour publier son livre",
  "Conseils pour imprimer un livre",
  "Conseils pour vendre son livre",
];

const resources = [
  { title: "Guides gratuits", icon: BookOpen },
  { title: "Concours d’écriture", icon: Trophy },
  { title: "Vidéos", icon: Video },
  { title: "Questions fréquentes", icon: HelpCircle },
];

export default function RessourcesPage() {
  return (
    <section className="space-y-10">
      <div className="space-y-3">
        <p className="ios-kicker">Conseils & ressources</p>
        <h1 className="ios-title text-3xl font-bold sm:text-4xl">Tout pour réussir votre projet d’édition.</h1>
        <p className="ios-muted max-w-3xl text-sm sm:text-base">
          Articles, guides et ressources pratiques pour avancer avec méthode à chaque étape de votre publication.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="ios-surface rounded-md p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <Lightbulb className="h-5 w-5" />
            </span>
            <h2 className="text-lg font-semibold text-slate-900">Blog</h2>
          </div>
          <div className="mt-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
            {blogTopics.map((topic) => (
              <div key={topic} className="ios-surface-strong rounded-md p-4">
                <p className="text-sm font-semibold text-slate-800">{topic}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="ios-surface rounded-md p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900">Ressources</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {resources.map((resource) => {
              const Icon = resource.icon;
              return (
                <div key={resource.title} className="ios-surface-strong rounded-md p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white">
                      <Icon className="h-4 w-4" />
                    </span>
                    <p className="text-sm font-semibold text-slate-900">{resource.title}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
