import CallToAction from "@/components/landingpage/calltoaction";
import FooterSection from "@/components/landingpage/footer";
import { HeroHeader } from "@/components/landingpage/header";
import { Button } from "@/components/ui/button";
import { Cpu, Sparkles } from "lucide-react";
import Link from "next/link";

const tableData = [
  {
    feature: "Unlimited Folders and Notes",
    free: true,
    pro: true,
    startup: true,
  },
  {
    feature: "AI chat",
    free: "limited",
    pro: true,
    startup: true,
  },
  {
    feature: "File Upload",
    free: "limited",
    pro: true,
    startup: true,
  },
  {
    feature: "AI Flashcards",
    free: "limited",
    pro: true,
    startup: true,
  },
  {
    feature: "Chat with Pdf",
    free: false,
    pro: true,
    startup: true,
  },
  {
    feature: "Public Market Place",
    free: true,
    pro: true,
    startup: true,
  },
  {
    feature: "Priority Support",
    free: false,
    pro: true,
    startup: true,
  },
];

export default function PricingComparator() {
  return (
    <div>
      <HeroHeader />
      <section className="py-16 md:py-32  ">
        <div className="mx-auto max-w-5xl px-6">
          <div className="w-full overflow-auto lg:overflow-visible">
            <table className="w-[200vw] border-separate border-spacing-x-3 md:w-full dark:[--color-muted:var(--color-zinc-900)]">
              <thead className="bg-background sticky top-0">
                <tr className="*:py-4 *:text-left *:font-medium">
                  <th className="lg:w-2/5"></th>
                  <th className="space-y-3">
                    <span className="block">Free</span>

                    <Button asChild variant="outline" size="sm">
                      <Link href="#">Get Started</Link>
                    </Button>
                  </th>
                  <th className="bg-muted rounded-t-(--radius) space-y-3 px-4">
                    <span className="block">Pro</span>
                    <Button asChild size="sm">
                      <Link href="#">Get Started</Link>
                    </Button>
                  </th>
                  <th className="space-y-3">
                    <span className="block">Startup</span>
                    <Button asChild variant="outline" size="sm">
                      <Link href="#">Get Started</Link>
                    </Button>
                  </th>
                </tr>
              </thead>
              <tbody className="text-caption text-sm">
                {tableData.map((row, index) => (
                  <tr key={index} className="*:border-b *:py-3">
                    <td className="text-muted-foreground">{row.feature}</td>
                    <td>
                      {row.free === true ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="size-4"
                        >
                          <path
                            fillRule="evenodd"
                            d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        row.free
                      )}
                    </td>
                    <td className="bg-muted border-none px-4">
                      <div className="-mb-3 border-b py-3">
                        {row.pro === true ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="size-4"
                          >
                            <path
                              fillRule="evenodd"
                              d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          row.pro
                        )}
                      </div>
                    </td>
                    <td>
                      {row.startup === true ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="size-4"
                        >
                          <path
                            fillRule="evenodd"
                            d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        row.startup
                      )}
                    </td>
                  </tr>
                ))}
                <tr className="*:py-6">
                  <td></td>
                  <td></td>
                  <td className="bg-muted rounded-b-(--radius) border-none px-4"></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <CallToAction />
      <FooterSection />
    </div>
  );
}
