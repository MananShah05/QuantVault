import { PortfolioBuilder } from "@/components/portfolio/PortfolioBuilder";

export default function NewPortfolioPage() {
  return (
    <div className="container max-w-7xl mx-auto py-10 px-4 md:px-8">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Build Portfolio</h1>
          <p className="text-muted-foreground mt-2">Add assets and allocate weights to construct a custom portfolio.</p>
        </div>
        <PortfolioBuilder />
      </div>
    </div>
  );
}
