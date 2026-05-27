import { UrlInput } from '@/components/url-input';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl text-center">
        <h1 className="mb-2 text-5xl font-bold tracking-tight">
          Hub<span className="text-orange-500">all</span>
        </h1>
        <p className="mb-10 text-lg text-zinc-400">
          Paste any website URL and get a complete HubSpot CMS theme
        </p>
        <UrlInput />
      </div>
    </main>
  );
}
